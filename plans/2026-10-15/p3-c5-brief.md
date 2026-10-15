# P3 · C5 brief: `state` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p3-c5`, branch `p3-c5` (from `p3-core` after C2 and C4). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-core`'s `state` module as stubs, and the tests that define it. Stubs return `todo!()`. The tests compile and fail because of the stubs. C6 (Opus high) makes them pass without changing them.

`state` holds windows, panes, tabs, history and the current listing. Readers are `pub`. Mutators are `pub(crate)`: only `apply()` (C10) calls them, so the state changes only through commands. Tests live inside the crate (`src/state/tests.rs` or `src/state/tests/`) and may call `pub(crate)` items.

## Read first

- `plans/2026-10-14-p3-core-model.md` (whole file), `plans/README.md` "Test-driven" and "Size limits".
- `crates/rusty-core/src/lib.rs`, `id/`, `location/`, `direction/`, `layout/mod.rs` (the API part), `command/mod.rs` (the `Command` enum only).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-core/src/state/
├── mod.rs        AppState, Window, StateError, re-exports
├── pane.rs       Pane
├── tab.rs        Tab, ViewState
├── history.rs    History
├── listing.rs    Listing, Entry
└── tests.rs      (or tests/ with mod.rs)
```

Add `mod state;` and `pub use state::{AppState, Entry, History, Listing, Pane, StateError, Tab, ViewState, Window};` to `src/lib.rs`. Touch nothing else.

## The API (exact)

```rust
// listing.rs
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Entry { pub name: String, pub is_folder: bool }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Listing { /* private: Arc<[Entry]> */ }
impl Listing {
    pub fn new(entries: Vec<Entry>) -> Self;
    pub fn len(&self) -> u64;
    pub fn is_empty(&self) -> bool;
    pub fn get(&self, row: u64) -> Option<&Entry>;
    pub fn entries(&self) -> &[Entry];
}

// tab.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ViewState { pub cursor: u64, pub scroll: u64 }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Tab { /* private */ }
impl Tab {
    pub fn id(&self) -> TabId;
    pub fn location(&self) -> &Location;
    pub fn view(&self) -> ViewState;                 // for the current location
    pub fn listing(&self) -> Option<&Listing>;       // None while loading
    pub fn history(&self) -> &History;
    pub(crate) fn new(id: TabId, location: Location) -> Self;
    pub(crate) fn navigate(&mut self, location: Location);
    pub(crate) fn back(&mut self) -> Result<(), StateError>;
    pub(crate) fn forward(&mut self) -> Result<(), StateError>;
    pub(crate) fn set_listing(&mut self, listing: Listing);
    pub(crate) fn set_cursor(&mut self, row: u64);
    pub(crate) fn set_scroll(&mut self, row: u64);
}

// history.rs
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct History { /* private */ }
impl History {
    pub const LIMIT: usize = 100;
    pub fn back(&self) -> &[Location]  /* or an iterator */;   // oldest first
    pub fn forward(&self) -> &[Location];                      // next first
}

// pane.rs
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Pane { /* private */ }
impl Pane {
    pub fn id(&self) -> PaneId;
    pub fn tabs(&self) -> &[Tab];
    pub fn active_index(&self) -> usize;
    pub fn active(&self) -> &Tab;
    pub(crate) fn new(id: PaneId, first: Tab) -> Self;
    pub(crate) fn active_mut(&mut self) -> &mut Tab;
    pub(crate) fn open_tab(&mut self, tab: Tab);                         // inserted right after the active tab, then activated
    pub(crate) fn close_tab(&mut self, index: usize) -> Result<(), StateError>;
    pub(crate) fn activate(&mut self, index: usize) -> Result<(), StateError>;
}

// mod.rs
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Window { /* private: id, layout, panes */ }
impl Window {
    pub fn id(&self) -> WindowId;
    pub fn layout(&self) -> &Layout;
    pub fn pane(&self, id: PaneId) -> Option<&Pane>;
    pub fn panes(&self) -> Vec<&Pane>;                 // in layout order
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AppState { /* private: windows, focused window, id counter */ }
impl AppState {
    pub fn new(home: Location) -> Self;               // one window, one pane, one tab at `home`
    pub fn window_ids(&self) -> Vec<WindowId>;        // ascending
    pub fn focused_window(&self) -> WindowId;
    pub fn window(&self, id: WindowId) -> Option<&Window>;
    pub fn focused_pane(&self) -> PaneId;             // the focused window's layout focus
    pub fn pane(&self, id: PaneId) -> Option<&Pane>;  // any window
    pub fn active_tab(&self) -> &Tab;                 // the focused pane's active tab
    pub(crate) fn active_tab_mut(&mut self) -> &mut Tab;
    pub(crate) fn focused_pane_mut(&mut self) -> &mut Pane;
    pub(crate) fn new_tab(&mut self, location: Location) -> Tab;          // takes a fresh id
    pub(crate) fn split(&mut self, direction: Direction) -> Result<PaneId, StateError>;
    pub(crate) fn close_pane(&mut self, pane: PaneId) -> Result<(), StateError>;
    pub(crate) fn focus_direction(&mut self, direction: Direction) -> Result<PaneId, StateError>;
    pub(crate) fn open_window(&mut self, location: Location) -> WindowId;
    pub(crate) fn close_window(&mut self, id: WindowId) -> Result<(), StateError>;
    pub(crate) fn focus_window(&mut self, id: WindowId) -> Result<(), StateError>;
}

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum StateError {
    UnknownWindow(WindowId),
    UnknownPane(PaneId),
    LastWindow,
    LastTab,
    NoSuchTab(usize),
    NothingBack,
    NothingForward,
    Layout(#[from] LayoutError),
}  // an #[error("…")] message on each; C6 may not change them
```

## Behaviour

- **Ids:** one counter for windows, panes and tabs, starting at 1. `AppState::new` gives window 1, pane 2, tab 3. Ids are never reused.
- **navigate:** remembers the current `ViewState` for the current location; pushes the current location on `back` (dropping the oldest above `LIMIT`); clears `forward`; sets the new location; listing becomes `None`; the view is the one remembered for the new location, or the default.
- **back / forward:** move one step, keeping the other stack (bounded by `LIMIT` too), remembering and restoring views the same way. `NothingBack` / `NothingForward` when empty.
- Views are remembered only for locations that are current, in `back` or in `forward`; others are forgotten, so memory stays bounded.
- **set_listing:** stores it and clamps `cursor` and `scroll` to `len - 1` (0 when empty). **set_cursor / set_scroll** clamp the same way; with no listing they store the value unclamped.
- **open_tab / close_tab:** closing the last tab gives `LastTab`; a bad index gives `NoSuchTab`. After closing the active tab, the tab that took its index becomes active, or the one before it if it was the last.
- **split:** splits the focused pane in its window's layout; the new pane gets one new tab at the focused tab's location (fresh history and view); focus moves to it; returns its id.
- **close_pane:** `LayoutError::LastPane` (wrapped) for the window's only pane; removes the pane and its tabs.
- **open_window:** a new window with one pane and one tab at `location`, focused. **close_window:** `LastWindow` for the only window; focus goes to the lowest remaining window id if the closed one was focused.
- **Every failing call leaves the state unchanged.**

## Tests to write

1. Unit: the initial state and its ids; navigate, back, forward with view restore; the history limit (push 150, keep 100, oldest dropped); forward cleared by navigate; views forgotten when their location leaves the history; listing clamps; tabs open, close and activate rules; split and close pane; open, close and focus windows; every `StateError` variant at least once.
2. Properties (`proptest`): a random sequence (up to 60) of the `pub(crate)` operations with random inputs (locations from a small pool so they repeat). After every step:
   - each window's `layout().panes()` equals its panes' ids, in order; every id appears once across the whole state;
   - every pane has at least one tab and `active_index() < tabs().len()`;
   - every history stack holds at most `LIMIT` entries;
   - with a listing, `view().cursor < len` (or 0 when empty);
   - a call that returned `Err` left the state equal (`==`) to a clone taken before it.

## Rules

- Stubs are `todo!()` only; type definitions and private fields may be real. C6 may change private fields freely.
- One reason to fail per test, named as the behaviour. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p3-c5`.

## Check

```sh
cargo nextest run -p rusty-core --no-fail-fast 2>&1 | tail -40
```

The earlier modules' tests pass; the `state` tests compile and fail with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief. Stop early if the API cannot be written as given.
