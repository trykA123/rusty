# P3 · C3 brief: `layout` Red

Role: `checker` (Sonnet, high). Worktree: `<worktrees>/rusty-p3-c3`, branch `p3-c3` (from `p3-core`). Do not commit; the orchestrator does.

## Goal

Write the public API of `rusty-core`'s `layout` module (the pane split tree of one window) as stubs, and the tests that define it. Stubs return `todo!()`. The tests must compile and fail because of the stubs. C4 (Opus) makes them pass without changing them.

## Read first

- `plans/2026-10-14-p3-core-model.md` (whole file) and `plans/README.md` sections "Test-driven" and "Size limits".
- `crates/rusty-core/src/` (all of it, under 150 lines): `PaneId`, `Direction`. Use them; do not change them.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-core/src/layout/
├── mod.rs     Layout, Rect, LayoutError; stubs; `#[cfg(test)] mod tests;`
└── tests.rs   unit tests and properties (or a tests/ folder: tests/unit.rs, tests/props.rs)
```

Add `mod layout;` and `pub use layout::{Layout, LayoutError, Rect};` to `src/lib.rs`. Touch nothing else.

## Model

- A binary tree. A leaf holds a `PaneId`. A split holds an axis (side by side, or stacked), a ratio and two children: first is left or top, second is right or bottom.
- The ratio is the first child's share in permille, kept within `100..=900`.
- The layout covers the unit square `[0,1]×[0,1]`, x to the right, y down. A side-by-side split with ratio r gives the first child width `w·r/1000`.
- Exactly one leaf is focused. The tree is never empty.

## The API (exact)

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Layout { /* private */ }

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Rect { pub x: f64, pub y: f64, pub width: f64, pub height: f64 }

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum LayoutError {
    UnknownPane(PaneId),
    DuplicatePane(PaneId),
    LastPane,
    NoNeighbour(Direction),
    NoSplitToResize(Direction),
}  // give each an #[error("…")] message; C4 may not change them

impl Layout {
    pub fn new(pane: PaneId) -> Self;
    pub fn focused(&self) -> PaneId;
    pub fn panes(&self) -> Vec<PaneId>;            // leaves in tree order: first child before second
    pub fn contains(&self, pane: PaneId) -> bool;
    pub fn rects(&self) -> Vec<(PaneId, Rect)>;    // same order as panes()
    pub fn split(&mut self, direction: Direction, new_pane: PaneId) -> Result<(), LayoutError>;
    pub fn close(&mut self, pane: PaneId) -> Result<(), LayoutError>;
    pub fn focus(&mut self, pane: PaneId) -> Result<(), LayoutError>;
    pub fn neighbour(&self, pane: PaneId, direction: Direction) -> Option<PaneId>;
    pub fn focus_direction(&mut self, direction: Direction) -> Result<PaneId, LayoutError>;
    pub fn swap(&mut self, direction: Direction) -> Result<(), LayoutError>;
    pub fn resize(&mut self, direction: Direction, delta: u16) -> Result<(), LayoutError>;
}
```

## Behaviour

- **split:** splits the focused leaf. The new pane goes on the `direction` side (Right: second child of a side-by-side split; Left: first child; Down: second of a stacked split; Up: first). Ratio 500. Focus moves to the new pane. `DuplicatePane` if `new_pane` is already in the layout.
- **close:** removes the leaf; its sibling subtree takes the parent's place, keeping the parent's rectangle. If the closed pane was focused, focus goes to the first leaf (tree order) of that sibling subtree. `LastPane` for the only pane; `UnknownPane` if absent.
- **focus:** `UnknownPane` if absent.
- **neighbour (geometry):** candidates are panes whose near edge touches the given pane's far edge in that direction (|difference| < 1e-9) and whose span on the other axis overlaps the given pane's span by more than 1e-9. Pick the largest overlap; on a tie the smaller start (top-most for Left/Right, left-most for Up/Down). `None` when there is no candidate or the pane is unknown.
- **focus_direction:** focus moves to `neighbour(focused, direction)` and returns it; `NoNeighbour(direction)` otherwise.
- **swap:** the focused pane and its neighbour in `direction` exchange places in the tree; focus stays on the same `PaneId`. `NoNeighbour` otherwise.
- **resize:** moves a border of the focused pane towards `direction` by `delta` permille. It changes the nearest ancestor split with the matching axis (side by side for Left/Right, stacked for Up/Down) in which the focused pane's subtree is on the side opposite `direction` (first child for Right/Down, second child for Left/Up), so the pane grows. If there is none, it changes the nearest ancestor split with the matching axis on the other side, so the pane shrinks (a border always moves towards `direction`, as in tmux). Right/Down add `delta` to the ratio, Left/Up subtract it; the result is clamped to `100..=900` without overflow. `NoSplitToResize(direction)` when no ancestor split has the matching axis. (Changed by the orchestrator after C3.)
- **Every failing call leaves the layout unchanged.**

## Tests to write

1. Unit: new layout (one pane, rect = unit square); split in each direction (order of `panes()`, rects, focus); close merges the sibling and moves focus; `LastPane`, `UnknownPane`, `DuplicatePane`; `neighbour` in an L-shaped three-pane layout (largest overlap wins, tie breaks to the top or left); `focus_direction` and `NoNeighbour`; swap changes `panes()` order and keeps focus; resize grows, shrinks, clamps at 100 and 900, and returns `NoSplitToResize`; nested splits resize the nearest matching ancestor.
2. Properties (`proptest`): apply a random sequence (up to 40) of operations (split with a fresh id from a counter, split with an existing id, close a random known or unknown pane, focus, focus_direction, swap, resize with `0..=1000`). After every step:
   - `panes()` is non-empty and has no duplicates; `focused()` is in it; `contains` agrees with it;
   - `rects()` has one rect per pane, each inside the unit square with positive size; the areas sum to 1 within 1e-9; no two rects overlap by more than 1e-9 in area;
   - every call that returned `Err` left the layout equal (`==`) to a clone taken before it.
3. `neighbour` is symmetric for side-by-side pairs: if `neighbour(a, Right) == Some(b)` in a two-pane layout, then `neighbour(b, Left) == Some(a)`.

## Rules

- Tests through the public API only. One reason to fail per test, named as the behaviour.
- Stubs are `todo!()` only. The private tree types may be declared (you choose their shape; C4 may change private types freely).
- Files under 400 lines (tests exempt). `cargo fmt`.

## Check

```sh
cargo nextest run -p rusty-core --no-fail-fast 2>&1 | tail -40
```

The id, direction and location tests pass; your `layout` tests compile and fail with `not yet implemented`. `cargo clippy -p rusty-core --all-targets` may report only `todo` lints.

## Stop and report

Stop when the check holds. Report: files, test count by group, the check output tail, and any place where this brief is ambiguous or wrong (do not guess silently). Stop early and report if the API above cannot be written as given.
