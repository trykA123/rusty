# P4 · W7 brief: `db` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p4-w7`, branch `p4-w7` (from `p4-storage`). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-store`'s `db` module as stubs, and the tests that define it. W8 (api-builder, gpt-6.1-sol xhigh) makes them pass without changing them.

`ferrite.db` (D29; the plan's `rusty.db`) holds user data: history, frecency, tags, module key-values, the job journal and undo. It opens, migrates by `PRAGMA user_version`, and checks itself after an unclean exit.

## Read first

- `plans/2026-10-14-p4-storage.md` (W7/W8 rows and briefs); `docs/architecture.md` "No corruption" and the storage table; `docs/decisions.md` D17, D29.
- `crates/rusty-store/src/` (all).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Dependencies

Add `rusqlite = { version = "0.40.2", features = ["bundled"] }` and `thiserror = "2.0.21"` (if not present) to `crates/rusty-store/Cargo.toml`; dev: `tempfile`, `proptest` (already there).

## Files you create

```text
crates/rusty-store/src/db/
├── mod.rs          Db, DbError, OpenReport; stubs
├── migrations.rs   MIGRATIONS: &[&str] — real SQL (see below), not a stub
└── tests.rs        (or tests/ with mod.rs)
crates/rusty-store/tests/fixtures/db/v0.sql   SQL that builds an empty version-0 database (no tables)
crates/rusty-store/tests/fixtures/db/v1.sql   SQL that builds a version-1 database with a few rows in every table
```

Add `mod db;` and `pub use db::{Db, DbError, OpenReport};` to `src/lib.rs`. Touch nothing else.

## Migrations (real)

`MIGRATIONS[0]` creates version 1: tables `history(id INTEGER PRIMARY KEY, location TEXT NOT NULL, visited_at INTEGER NOT NULL)`, `frecency(location TEXT PRIMARY KEY, score REAL NOT NULL, last_at INTEGER NOT NULL)`, `tags(location TEXT NOT NULL, tag TEXT NOT NULL, PRIMARY KEY(location, tag))`, `module_kv(module TEXT NOT NULL, key TEXT NOT NULL, value BLOB NOT NULL, PRIMARY KEY(module, key))`, `job(id INTEGER PRIMARY KEY, kind TEXT NOT NULL, state TEXT NOT NULL, created_at INTEGER NOT NULL, plan BLOB NOT NULL)`, `job_step(job_id INTEGER NOT NULL REFERENCES job(id) ON DELETE CASCADE, seq INTEGER NOT NULL, state TEXT NOT NULL, detail BLOB, PRIMARY KEY(job_id, seq))`, `undo(id INTEGER PRIMARY KEY, job_id INTEGER REFERENCES job(id), created_at INTEGER NOT NULL, inverse BLOB NOT NULL)`. Version N is reached by running `MIGRATIONS[0..N]` in order, each in its own transaction that also sets `user_version`.

## The API (stubs)

```rust
#[derive(Debug, thiserror::Error)]
pub enum DbError {
    Sqlite(#[from] rusqlite::Error),
    TooNew { found: u32, supported: u32 },   // the file was written by a newer Ferrite; never touched
    Corrupt(String),                          // integrity_check failed; the file is left as is
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OpenReport {
    pub from_version: u32,
    pub to_version: u32,
    pub checked: bool,         // integrity_check ran (only after an unclean exit)
}

pub struct Db { /* connection */ }
impl Db {
    pub const VERSION: u32;                                     // = MIGRATIONS.len()
    pub fn open(path: &Path, unclean_exit: bool) -> Result<(Self, OpenReport), DbError>;
    pub fn open_in_memory() -> Result<Self, DbError>;           // migrated to VERSION
    pub fn version(&self) -> Result<u32, DbError>;
    pub fn connection(&self) -> &rusqlite::Connection;          // for later modules and tests
}
```

## Behaviour

- `open` sets `journal_mode = WAL`, `synchronous = NORMAL`, `foreign_keys = ON`, `busy_timeout = 5000`.
- A missing file is created at `VERSION`.
- A file with `user_version` below `VERSION` is migrated step by step; each step commits on its own, so a failure leaves the file at the last good version.
- A file with a higher `user_version` gives `TooNew` and is not changed.
- With `unclean_exit`, `PRAGMA integrity_check` runs; any answer but `ok` gives `Corrupt` and the file is not changed.
- `OpenReport` tells the versions and whether the check ran.

## Tests to write

1. Fresh file: created, `version() == VERSION`, every table exists, pragmas set (query them).
2. Fixtures: build v0 and v1 from the `.sql` files into a temp file, open, check the version and that v1's rows survive.
3. `TooNew`: set `user_version` to `VERSION + 1`, open, error, the file bytes are unchanged.
4. Unclean exit: `checked == true` on a good file; a corrupted file (overwrite a page in the middle with garbage; build it with enough rows to have several pages) gives `Corrupt` or `Sqlite` (document which) and is not changed.
5. Migration failure: not testable with real migrations; skip, but test that `MIGRATIONS` is non-empty and each entry is non-empty SQL.
6. `open_in_memory` is at `VERSION`; foreign keys enforced (`job_step` with a missing `job_id` fails).
7. Property (`proptest`, 16 cases): for any starting version from 0 to `VERSION`, after `open` the version is `VERSION` and `OpenReport.from_version` is the start.

## Rules

- Stubs are `todo!()` only (the SQL and fixtures are real). One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p4-w7`. The first build compiles bundled SQLite (a C compiler is on the machine). Delete any `proptest-regressions/` your stub runs create.
- `clippy::todo` is denied; lint the tests with `cargo clippy -p rusty-store --all-targets -- -A clippy::todo -A dead_code`.
- Check `cargo deny check licenses` still passes after adding `rusqlite` (it is MIT; bundled SQLite is public domain — report if deny complains).

## Check

```sh
cargo nextest run -p rusty-store --no-fail-fast 2>&1 | tail -30
```

`atomic_write` tests pass; the `db` tests fail with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, the `cargo deny` result, and every ambiguity or error in this brief with the decision you took.
