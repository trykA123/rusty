# P4 · W5 brief: `session` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p4-w5`, branch `p4-w5` (from `p4-storage`). Do not commit; the orchestrator does.

## Goal

Write the API of the session snapshot as stubs, and the tests that define it. W6 (Opus high) makes them pass without changing them.

The session snapshot lets Ferrite draw its first frame without opening a database (D17): the layout, every tab with its location, history and view, and about 100 visible rows per pane. It is written on exit and periodically, read at start-up, and must survive a crash in the middle of a write.

The work has two halves:

- **`rusty-core::session`:** a plain-data `SessionState` with `serde` derives, plus the conversion to and from `AppState`. It stays in core because only core sees the private layout tree and tabs.
- **`rusty-store::session`:** the file format, with header, version and CRC32, a `postcard` body, `write_atomic` and the `.bak` fallback.

## Read first

- `plans/2026-10-14-p4-storage.md` (W5/W6 brief); `docs/decisions.md` D17, D21; `docs/architecture.md` "No corruption".
- `crates/rusty-core/src/`: `state/` (all), `layout/` (all), `selection/mod.rs` (the API only), `lib.rs`.
- `crates/rusty-store/src/`: `atomic_write/mod.rs`, `lib.rs`.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Dependencies

- `rusty-core`: `serde = { version = "1.0.229", features = ["derive"] }`.
- `rusty-store`: `rusty-core = { path = "../rusty-core" }`, `postcard = { version = "1.1.3", default-features = false, features = ["use-std"] }`, `crc32fast = "1.5.2"`.

## Part 1: `crates/rusty-core/src/session/`

```rust
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SessionState {
    pub windows: Vec<WindowState>,     // ascending id
    pub focused_window: u64,
    pub next_id: u64,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WindowState { pub id: u64, pub layout: LayoutState, pub focused_pane: u64, pub panes: Vec<PaneState> }   // panes in layout order
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum LayoutState {
    Pane(u64),
    Split { side_by_side: bool, ratio: u16, first: Box<LayoutState>, second: Box<LayoutState> },
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct PaneState { pub id: u64, pub active: usize, pub page_rows: u64, pub tabs: Vec<TabState> }
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TabState {
    pub id: u64,
    pub location: String,
    pub back: Vec<String>,             // oldest first
    pub forward: Vec<String>,          // next first
    pub cursor: u64,
    pub scroll: u64,
    pub rows: Option<RowsState>,       // the visible slice of the listing, if one was loaded
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RowsState { pub first: u64, pub total: u64, pub entries: Vec<EntryState> }   // entries are rows first..first+len
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EntryState { pub name: String, pub is_folder: bool }

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum SessionError { Invalid(String) }   // any structural problem; the message names it

impl AppState {
    pub fn to_session(&self, rows_per_pane: usize) -> SessionState;
    pub fn from_session(session: SessionState) -> Result<AppState, SessionError>;
}
```

- `to_session` saves, for each tab with a listing, the `rows_per_pane` rows starting at the view's `scroll` (fewer at the end), plus `total`. Remembered views of other locations and the selection are not saved.
- `from_session` rebuilds the state:
  - restored tabs have **no listing**, so the runtime reads the folders again; the rows are for the first frame only, and the UI reads them through `SessionState`, not `AppState`;
  - each view is restored as saved;
  - `next_id` is kept, so new ids never collide.
- `from_session` validates everything and returns `Invalid` for: no windows; duplicate ids anywhere; a focused window or pane that does not exist; a layout whose panes differ from `panes`; a pane with no tabs; `active` out of range; a ratio outside 100..=900; a location that `Location::new` rejects; `next_id` not above every id.

## Part 2: `crates/rusty-store/src/session/`

```rust
pub const SESSION_MAGIC: &[u8; 16] = b"FERRITE-SESSION\n";
pub const SESSION_VERSION: u16 = 1;

#[derive(Debug, thiserror::Error)]
pub enum SessionFileError {
    Io(#[from] std::io::Error),
    BadMagic,
    TooNew { found: u16, supported: u16 },
    BadChecksum,
    Decode(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SessionSource { Main, Backup, Empty }   // where the session came from

pub fn write_session(path: &Path, session: &SessionState) -> Result<(), SessionFileError>;
pub fn read_session_file(path: &Path) -> Result<SessionState, SessionFileError>;           // one file, no fallback
pub fn load_session(path: &Path) -> (Option<SessionState>, SessionSource, Vec<SessionFileError>);
```

- **File layout:** `MAGIC` (16 bytes), then the version (u16 LE), then the body length (u32 LE), then the CRC32 of the body (u32 LE), then the `postcard` body.
- **`load_session` order:**
  1. Read the main file. It is used if it reads, checks and decodes, **and** `AppState::from_session` accepts it.
  2. Otherwise the same for `.bak` (`backup_path`).
  3. Otherwise `(None, Empty, errors)`.
  - Every failure is collected in order: a missing file counts as an `Io` error with `NotFound`.
- `write_session` uses `write_atomic`, so the old file becomes `.bak`.

## Tests to write

1. Core:
   - `to_session` of the initial state;
   - after splits, tabs, navigation and listings: the round trip `from_session(to_session(s))` equals `s` with listings and selections dropped;
   - rows: the slice from `scroll`, clamped at the end, `total`;
   - every `Invalid` case, once each.
2. Core property (`proptest`): for random command sequences through `apply` and `apply_event`, the round trip holds, compared as above. Use a helper that clears listings: compare `to_session` output before and after instead, which already ignores listings.
3. Store:
   - write then read;
   - the header bytes;
   - `BadMagic`, `TooNew`, `BadChecksum` (flip one body byte), `Decode` (a valid CRC over garbage);
   - a missing file;
   - `load_session` falls back to `.bak` when the main file is corrupt, and when the main file decodes but `from_session` rejects it;
   - `Empty` when both are bad;
   - the error list is in order.
4. Speed: reading a session of 3 panes × 100 rows takes under 5 ms. Measure the median of 20 reads in the test; release-only, with `#[cfg_attr(debug_assertions, ignore)]`.

## Rules

- Stubs are `todo!()` only; type definitions are real. One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p4-w5`. Delete any `proptest-regressions/` your stub runs create.
- `clippy::todo` is denied; lint the tests with `cargo clippy --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-core -p rusty-store --no-fail-fast 2>&1 | tail -40
```

The earlier tests pass; the new `session` tests fail with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
