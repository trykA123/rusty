# P15 · A5 Red brief: match count, marks, bookmarks, search history, persistence (D7, model and store)

Role: `checker` (Opus 5.5, medium). Worktree: `<worktrees>/rusty-p15-a5`, branch `p15-a5` (from `main`). You write the **failing tests** and a compiling stub. The orchestrator writes the real code (Green). The UI (count in the find bar, Find All panel, colour picker, scrollbar ticks, keys) is a later atom on top of this. Commit on this branch; never push.

## Goal

The pure model and the storage behind D7 in `plans/2026-10-15-p15-viewer.md`:
- the find bar shows "3 of 1,248";
- Find All lists every matching line;
- a search becomes a mark in one of 8 colours, drawn in the text and as ticks on the scrollbar;
- bookmarks;
- recent searches are reused on any file;
- marks, bookmarks and recent searches survive closing and reopening (in `rusty.db`).

## Decided shape

### `rusty-core::paging` (next to `find`)

```rust
pub struct Counted { pub total: u64, pub starts: Vec<u64>, pub done: bool }

pub fn count<S: ByteSource + ?Sized>(
    src: &S,
    needle: &Needle,
    keep: usize,                     // keep at most this many starts; `total` stays exact
    cancel: &AtomicBool,
    progress: &mut dyn FnMut(u64, u64), // (bytes scanned, matches so far)
) -> Result<Counted, String>;

pub fn ordinal(counted: &Counted, at: u64) -> Option<u64>; // 1-based position of the match starting at `at`
```

- Matches are non-overlapping, scanned left to right (`aa` in `aaaa` counts 2), as in Notepad++.
- Starts are ascending. A match that spans the 1 MB chunk boundary (`SEARCH_CHUNK`) is counted exactly once.
- Text needles follow `find`: ASCII case folding when `match_case` is false.
- An empty needle gives `total 0, done true`.
- A cancel stops early and returns `done: false` with the counts so far.
- `ordinal` returns `None` when `at` is not a kept start.

### `rusty-core::marks` (new module)

```rust
pub const MARK_COLOURS: u8 = 8;
pub const MAX_MARKS: usize = 32;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Mark { pub needle: Needle, pub colour: u8 }

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct MarkSet { /* … */ }
impl MarkSet {
    pub fn set(&mut self, needle: Needle, colour: u8) -> Result<(), MarkError>; // colour ≥ 8 or a 33rd mark is an error; the same needle recolours in place
    pub fn remove(&mut self, needle: &Needle) -> bool;
    pub fn clear(&mut self);
    pub fn iter(&self) -> impl Iterator<Item = &Mark>;
    pub fn colour_of(&self, needle: &Needle) -> Option<u8>;
    pub fn is_empty(&self) -> bool;
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Bookmarks { /* BTreeSet<u64> of row or line starts */ }
impl Bookmarks {
    pub fn toggle(&mut self, at: u64) -> bool;      // true when now set
    pub fn next_after(&self, at: u64) -> Option<u64>;     // wraps to the first
    pub fn previous_before(&self, at: u64) -> Option<u64>; // wraps to the last
    pub fn iter(&self) -> impl Iterator<Item = u64> + '_;
    pub fn is_empty(&self) -> bool;
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SearchHistory { /* newest first */ }
impl SearchHistory {
    pub const MAX: usize = 50;
    pub fn push(&mut self, needle: Needle);   // an equal needle moves to the front; the oldest drop past MAX; empty needles are ignored
    pub fn iter(&self) -> impl Iterator<Item = &Needle>;
}

pub fn ticks(spans: &[(u64, u8)], len: u64, rows: u32) -> Vec<(u32, u8)>;
// (offset, colour) → (track row, colour) for the scrollbar: row = offset * rows / len, clamped to rows-1;
// one tick per (row, colour); sorted by row, then colour; len 0 or rows 0 gives nothing.
```

`Needle` gains `Serialize`/`Deserialize` (serde is already a dependency of `rusty-core`).

### `rusty-store` (migration V2 in `db/migrations.rs`, API on `Db` or a small `ViewerMemory` type over its connection)

```rust
pub struct Stamp { pub size: u64, pub modified: i64 }           // unix milliseconds
pub struct FileMemory { pub marks: MarkSet, pub bookmarks: Bookmarks }

fn viewer_memory(&self, path: &str, stamp: Stamp) -> Result<Option<FileMemory>, DbError>;
fn save_viewer_memory(&self, path: &str, stamp: Stamp, memory: &FileMemory, now: i64) -> Result<(), DbError>;
fn search_history(&self) -> Result<SearchHistory, DbError>;
fn remember_search(&self, needle: &Needle, now: i64) -> Result<(), DbError>;
fn prune_viewer_memory(&self, keep: usize) -> Result<u64, DbError>; // keeps the `keep` most recently saved files; returns rows removed
```

- Keyed by the location string the app already uses for history and frecency (see the V1 tables).
- Values are `postcard` blobs, as the journal stores plans.
- **Staleness:** when the stamp differs from the saved one, marks still come back (they are searches, valid on any content) but bookmarks are dropped, because offsets no longer mean the same place.
- Saving an empty memory deletes the row.
- `remember_search` keeps at most `SearchHistory::MAX` rows, newest first, with no duplicates.
- A blob that fails to decode reads as no memory (and is not an error that blocks opening the file).
- Opening a V1 database migrates to V2 and keeps every V1 row.

## Tests to write (all must fail on the stub, for the right reason)

Follow the repo's layout:
- `rusty-core`: `paging/tests_*.rs` and `marks/tests.rs`;
- `rusty-store`: `db/tests/` and the existing migration and fixture tests.

1. `count`:
   - basic total and starts;
   - non-overlapping `aa` in `aaaa`;
   - a match across the chunk boundary, built with a test `ByteSource` like the existing search tests;
   - case folding on and off;
   - hex `Needle::Bytes`;
   - `keep` caps starts but not `total`;
   - cancel mid-way gives `done: false`;
   - an empty needle;
   - progress is called and is monotonic;
   - a `proptest` comparing with a naive non-overlapping scan.
2. `ordinal`: first, middle, last, a non-start offset, a start beyond `keep`.
3. `MarkSet`:
   - set, recolour in place (order kept), remove, clear;
   - colour 8 is rejected;
   - the 33rd mark is rejected;
   - a serde round trip through `postcard`.
4. `Bookmarks`: toggle on and off; next and previous, with wrap; empty.
5. `SearchHistory`: dedupe to the front; the cap of 50; empty ignored; text and hex needles with the same characters stay distinct.
6. `ticks`:
   - mapping and clamping;
   - one tick per row and colour;
   - sort order;
   - len 0 and rows 0.
7. Store:
   - V1 to V2 migration keeps data, and `Db::VERSION` is 2;
   - round trip with the same stamp;
   - a stale stamp keeps marks and drops bookmarks;
   - empty memory deletes the row;
   - history dedupes, orders and caps;
   - prune keeps the newest;
   - a corrupt blob reads as `None`;
   - a fresh in-memory db works.

## Stub

Make the crates compile with the API above: return empty values, `None`, `Ok(())` or `Ok(0)`. The workspace lints deny `todo!`, `unimplemented!`, `panic!`, `unwrap`/`expect` outside tests, so return values instead. The V2 migration in the stub may be an empty string, so the migration tests fail on their assertions.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/p15-a5
cargo test -p rusty-core -p rusty-store --no-fail-fast > <scratch>/a5-red.log 2>&1; echo $?
```

It must exit non-zero. Every new test must fail by assertion, and every existing test must still pass. Also run:
- `cargo clippy -p rusty-core -p rusty-store --all-targets -- -D warnings` (it must pass);
- `cargo fmt --check`.

Commit (stub + tests + this brief) with a message that starts `core, store: Red tests for match count, marks and viewer memory (P15 A5)`. It ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` only. No absolute local paths in committed files.

## Do not touch

`crates/rusty-ui`, `crates/rusty-app`, and every existing test's intent. A3 and A4 run in parallel in other worktrees.

## Report

Commit hash, test count by group, the failing-test summary, every API change you made and why.
