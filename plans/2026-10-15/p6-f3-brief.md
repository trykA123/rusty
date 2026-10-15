# P6 · F3 brief: `provider` contract and `fake_fs` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p6-f3`, branch `p6-f3` (from `p6-fs`). Do not commit; the orchestrator does.

## Goal

Define, in `rusty-fs`:
- the `Provider` trait that every file system implements (local disks, shares, archives, the fake);
- the in-memory fake file system with scripted faults, which every later test uses.

Write the stubs and the tests that define them. F4 (Claude agent, Opus medium; D35) makes them pass without changing them.

## Read first

- `plans/2026-10-14-p6-locations-fs.md` (whole, including the G3 note about request numbers); `docs/architecture.md` "Locations, not paths" and "Drives and network locations"; `docs/decisions.md` D19, D21.
- `crates/rusty-core/src/location/` and `src/fs_error/` (the API: `Location`, `ProviderId`, `ProviderPath`, `FsError`, `FsErrorKind`).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Dependencies

`rusty-fs`: `rusty-core = { path = "../rusty-core" }`, `thiserror = "2.0.21"`; dev: `proptest = "1.12.0"`. Add `rusty-fs = 80` to `xtask/coverage-floors.toml`.

## Files you create

```text
crates/rusty-fs/src/
├── lib.rs           (keep #![forbid(unsafe_code)]; mods and pub uses)
├── provider/mod.rs  Provider, ListSink, CancelToken, Capabilities, FsEntry, EntryKind, Attributes, EntryBatch (real types; no stubs needed except CancelToken methods)
├── fake/mod.rs      FakeFs, FakeOp, Fault; stubs
├── fake/tree.rs     (private; F4 fills it)
└── fake/tests.rs    (or tests/ with mod.rs)
```

## The API (exact)

```rust
// provider/mod.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EntryKind { File, Folder, Link }
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Attributes { pub hidden: bool, pub system: bool, pub readonly: bool }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FsEntry {
    pub name: ProviderPath,          // one segment, never a separator
    pub kind: EntryKind,
    pub size: u64,                   // 0 for folders
    pub modified_ms: Option<i64>,    // Unix epoch milliseconds
    pub attributes: Attributes,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EntryBatch { pub entries: Vec<FsEntry>, pub last: bool }
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Capabilities { pub write: bool, pub watch: bool, pub recycle: bool, pub rename: bool }

#[derive(Debug, Clone, Default)]
pub struct CancelToken { /* Arc<AtomicBool> */ }
impl CancelToken { pub fn new() -> Self; pub fn cancel(&self); pub fn is_cancelled(&self) -> bool; }

pub trait ListSink { fn batch(&mut self, batch: EntryBatch) -> ControlFlow<()>; }   // Break: stop listing, return Ok
impl<F: FnMut(EntryBatch) -> ControlFlow<()>> ListSink for F { … }                  // closures are sinks

pub trait Provider: Send + Sync {
    fn id(&self) -> ProviderId;
    fn capabilities(&self) -> Capabilities;
    fn list(&self, folder: &Location, sink: &mut dyn ListSink, cancel: &CancelToken) -> Result<(), FsError>;
    fn metadata(&self, location: &Location) -> Result<FsEntry, FsError>;
}

// fake/mod.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FakeOp { List, Metadata }
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Fault {
    Fail(FsErrorKind),                          // the call fails at once
    FailAfterEntries { kind: FsErrorKind, entries: usize },   // List only: emits that many entries, then fails
}
pub struct FakeFs { /* Mutex<tree>, faults, call counters, batch size */ }
impl FakeFs {
    pub fn new() -> Self;                        // provider id "fake", one empty root folder
    pub fn with_batch_size(self, size: usize) -> Self;   // default 512, minimum 1
    pub fn location(&self, path: &str) -> Location;      // "a/b" -> fake://a/b ; "" -> fake:// root is not a Location, so "" maps to "/"
    pub fn add_folder(&self, path: &str);        // creates missing parents
    pub fn add_file(&self, path: &str, size: u64);
    pub fn add_entry(&self, folder: &str, entry: FsEntry);   // any name, also hostile ones (ProviderPath)
    pub fn remove(&self, path: &str);
    pub fn fault(&self, path: &str, op: FakeOp, on_call: u32, fault: Fault);  // the on_call-th call (1-based) of op on path faults
    pub fn calls(&self, path: &str, op: FakeOp) -> u32;
}
impl Provider for FakeFs { … }   // capabilities: everything true
```

## Behaviour

- **Paths:** fake paths are `/`-separated text after `fake://`. The root is `fake:///`, written as `/`. `location("a/b")` and `location("/a/b")` are the same.
- **`list`:** sends the children of a folder in insertion order, in batches of `batch_size`. The last batch has `last: true`, so an empty folder sends one empty batch with `last: true`. After every batch it checks `cancel`; when cancelled it stops and returns `Err(FsError { kind: Cancelled, … })`. When the sink returns `Break`, it stops and returns `Ok`.
- **Errors:**
  - a missing folder gives `NotFound`;
  - listing a file gives `NameInvalid`;
  - an error carries the location;
  - a location from another provider gives `NotFound`.
- **Faults:**
  - each call increments the counter for (path, op) first;
  - when the counter equals `on_call`, the fault fires: `Fail` returns the error at once, and `FailAfterEntries` streams that many entries (still in batches) and then returns the error;
  - other calls behave normally;
  - a fault fires once.
- **Concurrency:** `FakeFs` is `Send + Sync`, and listing while another thread adds files never panics.

## Tests to write

1. Tree and metadata:
   - `add_folder` creates parents;
   - `add_file` sizes;
   - `metadata` of a file, a folder and the root;
   - a missing path gives `NotFound` with the location;
   - `remove`;
   - a hostile name added with `add_entry` comes back byte-for-byte: a lone surrogate built with `ProviderPath::from_wide`, an invalid UTF-8 name, trailing dots and spaces, and a 300-character name.
2. Listing:
   - insertion order;
   - batching with batch size 3 over 10 entries (4 batches, `last` only on the final one);
   - an empty folder;
   - listing a file;
   - a missing folder;
   - another provider's location;
   - `Break` stops early with `Ok`;
   - cancel before the call gives `Cancelled`;
   - cancel from inside the sink after the first batch gives `Cancelled` and no further batch.
3. Faults:
   - `Fail` on the 1st and on the 3rd call;
   - the counter counts calls;
   - `FailAfterEntries` with 5 entries over batches of 2;
   - a fault fires once;
   - faults are per path and per operation.
4. Property (`proptest`): for random trees (up to 50 entries, nested up to 4 deep) and random batch sizes 1–10, the concatenated batches equal the children in insertion order, and exactly the final batch has `last`.
5. `Send + Sync` and the concurrent add-while-list test (2 threads, no panic, a final list sees every entry).

## Rules

- Stubs are `todo!()` only (types are real). One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p6-f3`. Delete any `proptest-regressions/` your runs create.
- `clippy::todo` is denied; lint with `cargo clippy -p rusty-fs --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-fs --no-fail-fast 2>&1 | tail -30
```

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
