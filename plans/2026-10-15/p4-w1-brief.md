# P4 · W1 brief: `atomic_write` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p4-w1`, branch `p4-w1` (from `p4-storage`). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-store`'s `atomic_write` module as stubs, and the tests that define it. Stubs return `todo!()`. The tests compile and fail because of the stubs. W2 (Opus high) makes them pass without changing them.

`write_atomic` replaces a file so that a crash at any moment leaves either the old content or the new content readable, never a mix and never nothing. The previous content is kept as `<name>.bak`.

## Read first

- `plans/2026-10-14-p4-storage.md` (whole file); `docs/architecture.md`, the section on "No corruption" (search for it); `plans/README.md` "Test-driven" and "Size limits".
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-store/src/atomic_write/
├── mod.rs     write_atomic, write_atomic_with, Stage, backup_path
└── tests.rs   (or tests/ with mod.rs)
```

Add `mod atomic_write;` and `pub use atomic_write::{backup_path, write_atomic};` to `crates/rusty-store/src/lib.rs` (keep `#![forbid(unsafe_code)]`). Add the dev-dependencies `tempfile = "3.27.0"` and `proptest = "1.12.0"` to `crates/rusty-store/Cargo.toml`. Touch nothing else.

## The API (exact)

```rust
pub fn write_atomic(path: &Path, bytes: &[u8]) -> io::Result<()>;   // = write_atomic_with(path, bytes, |_| Ok(()))
pub fn backup_path(path: &Path) -> PathBuf;                         // "settings.toml" -> "settings.toml.bak"

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Stage {
    TempWritten,   // the temp file holds all bytes, not yet synced
    TempSynced,    // the temp file is flushed and fsynced
    BackupMade,    // <name>.bak holds the previous content (skipped when there was no previous file)
    Replaced,      // the temp file has replaced the target
}

// The hook runs after each stage; an Err from it aborts the write at that point, as a crash or an I/O error would.
pub(crate) fn write_atomic_with(
    path: &Path,
    bytes: &[u8],
    hook: impl FnMut(Stage) -> io::Result<()>,
) -> io::Result<()>;
```

## Behaviour

- The temp file is created in the same folder as the target, named `.<name>.tmp-<random or counter>`, so the rename stays on one volume.
- Order: write the temp file → `sync_all` → make the backup → rename the temp file over the target → on Unix, fsync the folder.
- **Backup:** when the target exists, `<name>.bak` becomes a copy of its current content before the replace (a hard link where the file system allows it, else a copy; W2 decides). An older `.bak` is replaced.
- **On error** (a real I/O error, or the hook returning `Err` at any stage): the error is returned; the target still holds its old content (or still does not exist), unless the error came after `Replaced`; and no temp file is left in the folder.
- The target's folder must exist; a missing folder is an `io::ErrorKind::NotFound` error, and nothing is created.
- Writing to a path that is a directory is an error, and the directory is left alone.
- Empty `bytes` are allowed and give an empty file.

## Tests to write

1. Unit, each in a fresh `tempfile::TempDir`:
   - a new file is created with the bytes, and no `.bak` appears;
   - replacing an existing file writes the new bytes, and `.bak` holds the old ones; a second replace moves the backup forward;
   - empty bytes; a large write (8 MiB);
   - a missing parent folder → `NotFound`, and the folder is still missing;
   - a directory as the target → `Err`, and the directory still exists;
   - `backup_path` for a name with an extension, without one, and with several dots.
2. Fault injection with `write_atomic_with`: for each `Stage`, a hook that fails at that stage. Then check:
   - the target content, which is old for every stage before `Replaced` and new at `Replaced`;
   - no `.tmp-` file is left in the folder;
   - the error is returned with the hook's `ErrorKind`.
   Run each case once with an existing target and once without.
3. Property (`proptest`, 32 cases): for random byte vectors `a` and `b` and a random failing stage (or none), after `write a` then `write b` with that failure, the target holds `a` or `b`, never anything else, and it holds `b` exactly when the failure is none or `Replaced`.
4. Unix only (`#[cfg(unix)]`): a read-only folder makes the write fail cleanly, and the target is unchanged.

## Rules

- Stubs are `todo!()` only. One reason to fail per test, named as the behaviour. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p4-w1`. Delete any `proptest-regressions/` your stub runs create.
- `clippy::todo` is denied; lint the tests with `cargo clippy -p rusty-store --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-store --no-fail-fast 2>&1 | tail -30
```

Every `atomic_write` test compiles and fails with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took. Stop early if the API cannot be written as given.
