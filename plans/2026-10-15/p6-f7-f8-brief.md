# P6 · F7 + F8 brief: `local_provider` Green (Linux and Windows)

Role: Claude agent, Opus medium (D35). Worktree: `<worktrees>/rusty-p6-f6`, branch `p6-f6`. Do not commit or push; the orchestrator does, and runs Windows CI.

## Goal

Make every test in `crates/rusty-fs/src/local/tests/` pass. Implement `crates/rusty-fs/src/local/` as the F6 brief specifies (`plans/2026-10-15/p6-f6-brief.md`, read it whole first).

**Do not change the tests.** If a test is wrong, stop and report it with the reason.

## Read first

- `plans/2026-10-15/p6-f6-brief.md` (the behaviour) and every file in `crates/rusty-fs/src/local/`.
- `crates/rusty-fs/src/provider/mod.rs`, `fake/mod.rs` (the batching and cancel pattern to mirror), `hostile_names/mod.rs`.
- `crates/rusty-core/src/location/` (`ProviderPath::to_bytes`, `to_wide`, `from_bytes`, `from_wide`, `Location::join`) and `fs_error/` (`from_errno`, `from_windows_code`; codes 20 and 267 are `NameInvalid`).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md`.

## Decided

- **No `unsafe`.** Keep `#![forbid(unsafe_code)]`.
- Use `std::fs::read_dir`, `DirEntry::file_type`, `DirEntry::metadata`, `fs::symlink_metadata` and `fs::metadata` only where the F6 brief says.
- Unix uses `std::os::unix::ffi::OsStrExt`/`OsStringExt` and `std::os::unix::fs::PermissionsExt`.
- Windows uses `std::os::windows::ffi::{OsStrExt, OsStringExt}` and `std::os::windows::fs::MetadataExt::file_attributes()`:
  - hidden `0x2`, system `0x4`, readonly `0x1`;
  - a reparse point `0x400` that is a symlink or junction is `Link`; `FileType::is_symlink` covers symlinks.
- **Layout:** `local/mod.rs` holds the `Provider` impl and the batching. Platform code lives in `local/unix.rs` and `local/windows.rs` behind `#[cfg(unix)]` and `#[cfg(windows)]`. Each exposes the same small functions: `os_path`, `entry_name`, `attributes`, and `link_kind` if needed. No file over 400 lines, no function over 50, at most 4 parameters.
- **Errors:** an `io::Error` with `raw_os_error()` maps through the platform table, with the location and `os_code`. Without an OS code, it maps from `io::ErrorKind`: `NotFound`, `PermissionDenied`, `NotADirectory` or `InvalidFilename`, else `Unknown`.
- **Windows root metadata:** `C:\` has no parent segment, so its name is the whole path text, as the brief says.
- **Do not guess Windows behaviour you cannot test.** When unsure what code Windows returns, handle both readings. For example, `NotFound` while listing a path that exists as a file is `NameInvalid`; check it with `symlink_metadata`.

## Rules

- D31: no `unwrap`, `expect`, `panic` or `unimplemented` outside tests. No explanatory comments; at most one short line where something is truly non-obvious.
- Run `export CARGO_TARGET_DIR=<targets>/rusty-p6-f6`.
- Windows cannot be compiled here (no Windows target). Read your `#[cfg(windows)]` code twice against the std docs for this toolchain (Rust 1.99). The orchestrator runs it on Windows CI and sends you the errors.

## Check

```sh
cargo fmt
cargo nextest run -p rusty-fs --no-fail-fast 2>&1 | tail -15
cargo nextest run -p rusty-fs local::tests::perf --run-ignored only 2>&1 | tail -5
cargo clippy -p rusty-fs --all-targets -- -D warnings 2>&1 | tail -5
```

Every `rusty-fs` test passes, and the perf test passes. Report its time.

## Stop and report

Report:
- the files and the check output tails;
- the perf time;
- every place where you were unsure about Windows behaviour, and how the code handles both readings.
