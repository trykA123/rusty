# P4 · W9 brief: `cache_db` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p4-w9`, branch `p4-w9` (from `p4-storage` after W8). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-store`'s `cache_db` module as stubs, and the tests that define it. W10 (api-builder, gpt-6.1-sol xhigh) makes them pass without changing them.

`cache.db` holds data that can always be rebuilt: thumbnails, folder sizes, metadata. Losing it costs time, never data. It must stay inside a byte budget, and a corrupt file is moved aside and recreated, never repaired.

## Read first

- `plans/2026-10-14-p4-storage.md` (W9/W10); `docs/decisions.md` D17; `docs/architecture.md` "No corruption" and the storage table.
- `crates/rusty-store/src/db/` (how `ferrite.db` opens; reuse its style, not its code).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-store/src/cache_db/
├── mod.rs     CacheDb, CacheError, CacheOpen; stubs
└── tests.rs   (or tests/ with mod.rs)
```

Add `mod cache_db;` and `pub use cache_db::{CacheDb, CacheError, CacheOpen};` to `src/lib.rs`. Touch nothing else.

## The API (exact)

```rust
#[derive(Debug, thiserror::Error)]
pub enum CacheError { Sqlite(#[from] rusqlite::Error), Io(#[from] std::io::Error) }

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CacheOpen { Opened, Created, Recreated { moved_to: PathBuf } }

pub struct CacheDb { /* connection, budgets */ }
impl CacheDb {
    pub fn open(path: &Path) -> Result<(Self, CacheOpen), CacheError>;
    pub fn open_in_memory() -> Result<Self, CacheError>;
    pub fn set_budget(&mut self, table: &str, bytes: u64);           // per logical table; default 64 MiB
    pub fn get(&self, table: &str, key: &[u8]) -> Result<Option<Vec<u8>>, CacheError>;  // updates last access
    pub fn put(&mut self, table: &str, key: &[u8], value: &[u8]) -> Result<(), CacheError>;
    pub fn remove(&mut self, table: &str, key: &[u8]) -> Result<bool, CacheError>;
    pub fn used_bytes(&self, table: &str) -> Result<u64, CacheError>;  // sum of key and value lengths
    pub fn clear(&mut self, table: &str) -> Result<(), CacheError>;
}
```

## Behaviour

- One physical SQLite table `blob(tbl TEXT, key BLOB, value BLOB, size INTEGER, accessed INTEGER, PRIMARY KEY(tbl, key))`. `size` is key plus value length. `accessed` comes from a logical counter, not the wall clock, so tests are deterministic.
- `PRAGMA journal_mode = WAL`, `synchronous = OFF`.
- **put:** inserts or replaces the entry, then evicts the least recently accessed entries of that table until `used_bytes <= budget`. A value larger than the budget on its own is not stored, and any older value under that key is removed. `put` and `get` both count as an access.
- **open:**
  - a missing file is created (`Created`);
  - a file that is not SQLite, or that fails `PRAGMA quick_check`, is renamed to `<name>.corrupt-<n>` (the first free `n` from 1), then a new file is created (`Recreated`);
  - otherwise `Opened`.
- Table names are any non-empty strings; an empty one is allowed but separate.

## Tests to write

1. put then get; get of a missing key; replace changes the value and the size; remove returns true, then false; clear.
2. Budget:
   - eviction in least-recently-used order, and a `get` refreshes an entry;
   - a value above the budget is not stored and removes the old value;
   - tables have independent budgets;
   - `used_bytes` is exact after each operation.
3. Open:
   - a missing file is `Created`, an existing one `Opened`;
   - garbage bytes give `Recreated` with the moved file present and holding the old bytes;
   - two corruptions in a row give `.corrupt-1`, then `.corrupt-2`;
   - data survives close and reopen.
4. Property (`proptest`, 64 cases): random puts, gets and removes on two tables with small budgets. After each step `used_bytes` is at most the budget, and a get returns the last value put for that key, or `None` if it was evicted or removed. Check this against a model kept in the test.

## Rules

- Stubs are `todo!()` only. One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p4-w9`. Delete any `proptest-regressions/` your stub runs create.
- `clippy::todo` is denied; lint the tests with `cargo clippy -p rusty-store --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-store --no-fail-fast 2>&1 | tail -30
```

The earlier tests pass; the `cache_db` tests fail with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
