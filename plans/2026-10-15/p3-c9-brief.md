# P3 · C9 brief: `apply` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p3-c9`, branch `p3-c9` (from `p3-core` after C6 and C8). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-core`'s `apply` module as stubs, and the tests that define it. `apply` is the only way the state changes: commands from the user (`Command`) and events from the runtime (`Event`) go in; effects (`Effect`, data for the runtime to run later) come out. C10 (Opus high) makes the tests pass without changing them.

## Read first

- `plans/2026-10-14-p3-core-model.md` (whole file); `docs/decisions.md` D6, D7, D15, D21; `plans/README.md` "Test-driven" and "Size limits".
- `crates/rusty-core/src/` public API: `command/mod.rs`, `state/` (all readers and the `pub(crate)` mutators), `selection/mod.rs`, `layout/mod.rs`. Use them; do not change them.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-core/src/apply/
├── mod.rs       apply(), apply_event(), Effect, Event, CommandError
├── pane.rs      stubs for pane.* handlers
├── select.rs    stubs for selection.* handlers
├── layout.rs    stubs for layout.* and app.* handlers
└── tests.rs     (or tests/ with mod.rs, one file per group)
```

Add `mod apply;` and `pub use apply::{apply, apply_event, CommandError, Effect, Event};` to `src/lib.rs`. Touch nothing else.

## The API (exact)

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Effect {
    ListFolder { tab: TabId, location: Location },          // read this folder, then send Event::ListingLoaded
    MeasureFolder { tab: TabId, location: Location, name: String }, // size of a marked folder (Space on a folder)
    SaveSession,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Event {
    ListingLoaded { tab: TabId, location: Location, listing: Listing },
    PageRowsChanged { pane: PaneId, rows: u64 },             // visible rows, for PageUp/PageDown
}

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum CommandError {
    State(#[from] StateError),
    Pattern(#[from] PatternError),
    NoListing,                 // the command needs the current listing and it is not loaded
    EmptyListing,              // the command needs a row and the listing is empty
}  // with #[error("…")] messages

pub fn apply(state: &mut AppState, command: &Command) -> Result<Vec<Effect>, CommandError>;
pub fn apply_event(state: &mut AppState, event: Event) -> Vec<Effect>;
```

## Behaviour per command

Everything acts on the focused window, its focused pane and that pane's active tab ("the tab").

| Command | Change | Effects | Errors |
| --- | --- | --- | --- |
| `pane.open-tab { location? }` | new tab after the active one, at `location` or the tab's location; activated | `ListFolder` for the new tab | — |
| `pane.close-tab { tab? }` | closes tab index `tab` (default: active) | — | `LastTab`, `NoSuchTab` |
| `pane.navigate { location }` | the tab navigates; its selection clears | `ListFolder` | — |
| `pane.back` / `pane.forward` | history step; selection clears | `ListFolder` | `NothingBack` / `NothingForward` |
| `pane.cursor-move { to }` | Up/Down ±1, PageUp/PageDown ± page rows, First/Last, `Row(n)`; clamped to the listing | — | `NoListing`, `EmptyListing` |
| `selection.toggle` | toggles the cursor row | `MeasureFolder` when the row is a folder that is now marked | `NoListing`, `EmptyListing` |
| `selection.toggle-down` | toggles the cursor row, then cursor +1 (clamped) | — (no measuring, as in Total Commander's Insert) | `NoListing`, `EmptyListing` |
| `selection.range { to }` | `mark_range(to)`; the cursor moves to `to` (clamped) | — | `NoListing`, `EmptyListing` |
| `selection.add-pattern` / `remove-pattern` | pattern over files only (`folders = false`) | — | `Pattern(Empty)`, `NoListing` |
| `selection.invert` / `selection.all` | files only | — | `NoListing` |
| `selection.clear` | clears | — | — |
| `layout.split { direction }` | `split(direction)` | `ListFolder` for the new pane's tab | `State(Layout(…))` |
| `layout.close` | closes the focused pane | — | `State(Layout(LastPane))` |
| `layout.focus { direction }` | `focus_direction` | — | `State(Layout(NoNeighbour))` |
| `app.save-session` | — | `SaveSession` | — |

- Page rows: each pane starts with 20; `Event::PageRowsChanged` sets it (minimum 1). PageDown moves by `rows - 1` (at least 1), as most file managers do.
- **Validation before change:** a command that returns `Err` leaves the state equal to before.
- Events: `ListingLoaded` applies only if the tab still exists and is still at that `location`; otherwise it is ignored (stale). Applying it sets the listing (cursor and scroll clamp) and resets the selection to `Selection::new(len)`. `PageRowsChanged` for an unknown pane is ignored. Events produce no effects today (return an empty `Vec`).
- The selection lives in the tab: C8 adds a `Selection` field to `Tab`, the `pub` reader `Tab::selection() -> &Selection` and the `pub(crate)` `Tab::selection_mut()`. Write the tests against that reader.

## Tests to write

1. Per command: its change, its effects and each of its errors (one test each), using a small helper that builds a state, navigates and loads a listing through `apply` and `apply_event` only.
2. Events: stale `ListingLoaded` ignored (navigated away, tab closed); selection reset on load; `PageRowsChanged` changes PageDown.
3. Properties (`proptest`): random sequences (up to 80) of commands and events (locations from a small pool; listings of 0–50 entries with random folder flags; events sometimes stale). After every step the state invariants of C5 hold, and every `Err` left the state equal (`==`) to a clone taken before. Also: every `ListFolder` effect names a tab that exists and its current location.

## Rules

- Stubs are `todo!()` only; type definitions may be real. One handler per command in C10, each ≤ 30 lines (plan rule).
- One reason to fail per test, named as the behaviour. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p3-c9`. Delete any `proptest-regressions/` your stub runs create.

## Check

```sh
cargo nextest run -p rusty-core --no-fail-fast 2>&1 | tail -40
```

The earlier modules' tests pass; the `apply` tests compile and fail with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took. Stop early if the API cannot be written as given.
