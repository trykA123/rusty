# P3 · C7 brief: `selection` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p3-c7`, branch `p3-c7` (from `p3-core` after C6). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-core`'s `selection` module as stubs, and the tests that define it. Stubs return `todo!()`. The tests compile and fail because of the stubs. C8 (Opus high) makes them pass without changing them.

The module holds the marked rows of one tab's listing (D15, the Total Commander model) and the wildcard patterns used by "select group". It is pure: it knows row indices, names and whether a row is a folder; the cursor and effects belong to `apply()` (C9/C10).

## Read first

- `plans/2026-10-14-p3-core-model.md` (whole file); `docs/decisions.md` D15; `plans/README.md` "Test-driven" and "Size limits".
- `crates/rusty-core/src/lib.rs` and `src/state/listing.rs` (`Listing`, `Entry`).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-core/src/selection/
├── mod.rs       Selection; re-exports
├── pattern.rs   Pattern, PatternError
└── tests.rs     (or tests/ with mod.rs)
```

Add `mod selection;` and `pub use selection::{Pattern, PatternError, Selection};` to `src/lib.rs`. Touch nothing else.

## The API (exact)

```rust
// pattern.rs
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Pattern { /* private */ }

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum PatternError {
    Empty,   // no non-empty item after splitting on ';' and trimming spaces
}  // with an #[error("…")] message

impl Pattern {
    pub fn parse(text: &str) -> Result<Self, PatternError>;
    pub fn matches(&self, name: &str) -> bool;
    pub fn as_str(&self) -> &str;            // the text as given
}

// mod.rs
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Selection { /* private */ }

impl Selection {
    pub fn new(len: u64) -> Self;            // nothing marked, no anchor
    pub fn len(&self) -> u64;                // rows in the listing
    pub fn count(&self) -> u64;              // marked rows
    pub fn is_empty(&self) -> bool;          // count() == 0
    pub fn is_marked(&self, row: u64) -> bool;          // false past the end
    pub fn marked(&self) -> Vec<u64>;                    // ascending
    pub fn anchor(&self) -> Option<u64>;
    pub fn toggle(&mut self, row: u64) -> bool;          // returns the new state; past the end: no change, returns false
    pub fn mark_range(&mut self, to: u64);               // see below
    pub fn mark_pattern(&mut self, listing: &Listing, pattern: &Pattern, folders: bool);
    pub fn unmark_pattern(&mut self, listing: &Listing, pattern: &Pattern, folders: bool);
    pub fn mark_all(&mut self, listing: &Listing, folders: bool);
    pub fn invert(&mut self, listing: &Listing, folders: bool);
    pub fn clear(&mut self);
}
```

## Behaviour

- **Pattern:** the text is split on `;`; each item is trimmed of spaces; empty items are dropped; no items left → `Empty`. A name matches when any item matches the whole name. `*` matches any run of characters (also none), `?` exactly one character; every other character matches itself, case-insensitively (compare `char::to_lowercase` of both sides). No escaping. `*.*` matches every name, even one without a dot (as in Total Commander). Names and patterns may hold any Unicode.
- **toggle:** flips the row, sets the anchor to it, returns the new state.
- **mark_range(to):** marks every row from the anchor to `to`, both included, in either order, clamped to the listing; without an anchor it marks `to` alone. The anchor stays. Rows outside the range keep their state.
- **mark_pattern / unmark_pattern / mark_all / invert:** apply to rows whose name matches (for the pattern ones), skipping folders unless `folders` is true. A skipped folder keeps its state. They do not change the anchor.
- **clear:** unmarks everything and drops the anchor.
- The listing passed in has `len()` rows; calling with a listing of another length is a caller bug: the methods then act only on rows below both lengths (never panic).
- Memory: a listing of 1,000,000 rows must not need more than about 200 KB for its selection (a bitset, not a set of `u64`).

## Tests to write

1. Pattern unit tests: `*`, `?`, both mixed; `*.*` against `README`; case-insensitive (`*.TXT` vs `a.txt`, `Ä` vs `ä`); multiple items (`*.rs; *.toml`); spaces trimmed; `Empty` for `""`, `" ; ;"`; non-ASCII and emoji names; `?` on a multi-byte character; a long run of `*` (no exponential time: `"*a*a*a*a*a*a*b"` against 10,000 `a`s finishes under a second).
2. Selection unit tests: every method above, including toggling past the end, range in both directions, range without anchor, folders skipped and included, invert twice is identity, clear drops the anchor, count after each operation.
3. Properties (`proptest`), on random listings (up to 300 entries, random folder flags, names from a small alphabet so patterns hit):
   - `count() == marked().len()`, all marked rows `< len()`, `marked()` ascending;
   - `invert` twice restores the selection; `mark_all` then `invert` (same `folders`) leaves only skipped folders as they were;
   - with `folders == false`, no pattern, all or invert operation changes a folder row;
   - `Pattern::matches` agrees with a simple reference matcher written in the test (recursive, on short strings up to 8 chars and patterns up to 6 chars over `a`, `b`, `.`, `*`, `?`).
4. One memory test: `Selection::new(1_000_000)` after `mark_all` on a listing of 1,000,000 files (build it once) reports `count() == 1_000_000`; the size check is by design review, not a test.

## Rules

- Stubs are `todo!()` only; type definitions and private fields may be real. C8 may change private fields freely.
- One reason to fail per test, named as the behaviour. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p3-c7`. Delete any `proptest-regressions/` your stub runs create.

## Check

```sh
cargo nextest run -p rusty-core --no-fail-fast 2>&1 | tail -40
```

The earlier modules' tests pass; the `selection` tests compile and fail with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took. Stop early if the API cannot be written as given.
