# P6 · F6 brief: `local_provider` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p6-f6`, branch `p6-f6` (from `p6-fs`). Do not commit; the orchestrator does.

## Goal

The local provider lists real folders on Linux and Windows. Write its stubs and the tests that define it. F7 (Linux) and F8 (Windows) make them pass without changing them.

The tests run on Linux locally. Windows CI also runs them; the Windows-only tests use `#[cfg(windows)]`.

**Decision (orchestrator, 2026-10-15):** both platforms use `std::fs::read_dir`, `DirEntry::file_type` and `DirEntry::metadata`, or `symlink_metadata` for `metadata()`.
- On Windows these come from the find data and keep names lossless (WTF-8 inside `OsString`). So the crate keeps `#![forbid(unsafe_code)]`.
- `FindFirstFileExW` with `FIND_FIRST_EX_LARGE_FETCH` comes later, and only if the 100k-entry benchmark misses its target.

## Read first

- `plans/2026-10-14-p6-locations-fs.md` (whole); `docs/architecture.md` "Locations, not paths" and "Drives and network locations".
- `crates/rusty-fs/src/` (`provider`, `fake` and its tests, `hostile_names`); `crates/rusty-core/src/location/` (`Location`, `ProviderPath`, `join`) and `fs_error/` (`FsErrorKind::from_errno`, `from_windows_code`).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-fs/src/local/
├── mod.rs      LocalFs, the Provider impl (stubs), os_path (stub)
└── tests/      mod.rs, listing.rs, metadata.rs, errors.rs, hostile.rs, windows.rs (#[cfg(windows)]), perf.rs
```

Add `mod local;` and `pub use local::LocalFs;` to `src/lib.rs`. Add `tempfile = "3.27.0"` to `[dev-dependencies]`.

## The API (exact)

```rust
#[derive(Debug, Clone)]
pub struct LocalFs { /* batch_size */ }
impl LocalFs {
    pub fn new() -> Self;                                 // batch size 512
    pub fn with_batch_size(self, size: usize) -> Self;    // minimum 1
}
impl Default for LocalFs { … }
impl Provider for LocalFs { … }   // id: ProviderId::local(); capabilities: all false for now (operations come in P8)

pub(crate) fn os_path(location: &Location) -> Result<std::path::PathBuf, FsError>;
```

## Behaviour

**`os_path`:**
- Unix: the path's `to_bytes()`, as an `OsStr`.
- Windows: the path's `to_wide()`. A path that starts with a drive letter gets the `\\?\` prefix, and a UNC path `\\srv\share\x` becomes `\\?\UNC\srv\share\x`. A path that is already verbatim stays as it is. Other shapes stay unprefixed.
- A path with no form for the OS (`Bytes` on Windows, `Wide` on Unix), or a location from another provider, gives `NameInvalid` with the location.

**`list`:**
- Sends the folder's children in batches of `batch_size`. The order is the OS order; tests compare sorted names.
- It never sends `.` or `..`. The last batch has `last: true`, so an empty folder sends one empty batch.
- It checks `cancel` before each batch is sent. When cancelled, it returns `Cancelled` and sends no further batch.
- When the sink returns `Break`, it returns `Ok`.
- An entry whose metadata cannot be read (it was deleted mid-listing) is skipped. It never fails the whole listing.

**`FsEntry` fields:**
- `name`: Unix `from_bytes` of the raw name; Windows `from_wide` of the raw units.
- `kind`: `Link` for a symlink (also a symlink to a folder, and a junction on Windows), `Folder`, or `File`.
- `size`: 0 for folders and links.
- `modified_ms`: Unix epoch milliseconds, or `None` when unavailable.
- `attributes`:
  - Windows: `hidden`, `system` and `readonly` from the file attributes;
  - Unix: `hidden` when the name starts with `.`, `system` false, `readonly` when the owner has no write permission.

**`metadata`:** the same `FsEntry` for the location itself, without following a final symlink. Its `name` is the last segment. For a root (`/`, `C:\`), the name is the whole path text.

**Errors:** an `io::Error` maps through `raw_os_error()`, with `from_errno` on Unix and `from_windows_code` on Windows, and carries the location and the `os_code`.
- A missing folder gives `NotFound`.
- Listing a file gives `NameInvalid`.
- On Unix, a folder without read permission gives `AccessDenied`. Skip that test when running as root.

## Tests to write (on `tempfile::tempdir()`)

1. **Listing:**
   - files, folders and a symlink come back with the right kinds and sizes;
   - `.` and `..` are never listed;
   - batching with batch size 3 over 10 entries: 4 batches, `last` only on the last;
   - an empty folder sends one empty last batch;
   - `Break` stops early with `Ok`;
   - cancel before the call gives `Cancelled` and no batch;
   - cancel from inside the sink after the first batch gives `Cancelled` and no second batch;
   - `modified_ms` is within a few seconds of now for a fresh file;
   - a dot-file is `hidden` on Unix;
   - a read-only file is `readonly`.
2. **Metadata:** a file, a folder, a symlink (kind `Link`, not followed), the root, and a missing path (`NotFound` with the location).
3. **Errors:**
   - a missing folder;
   - listing a file;
   - a permission-denied folder (Unix, skipped as root);
   - a `fake://` location gives `NameInvalid`;
   - a `Wide` path on Unix gives `NameInvalid`.
4. **Hostile corpus:** create every `hostile_names::for_family(Family::Unix)` name in one temp folder (on Windows, `Family::Windows`):
   - files for even indexes and folders for odd ones;
   - build each OS path through `os_path(&folder.join(&name))`;
   - list it and get exactly the corpus set back, byte-for-byte (unit-for-unit on Windows);
   - `metadata` of each child, through `join`, returns the same name and kind.
5. **Long paths:**
   - nest `hostile_names::long_path_segments()` folders, create a file at the bottom and list every level;
   - the total path passes 260 units, so this proves the `\\?\` prefix on Windows.
6. **Windows only** (`#[cfg(windows)]`):
   - `os_path` of `C:\a` is `\\?\C:\a`, and of `\\srv\share\x` is `\\?\UNC\srv\share\x`;
   - a verbatim path is unchanged;
   - a hidden and a system attribute set with `attrib` through `std::process::Command` are reported;
   - a `Bytes` path gives `NameInvalid`.
7. **Unix `os_path`:** the byte form, including invalid UTF-8.
8. **Perf**, `#[ignore]`: run it by hand with `--run-ignored only`. In a folder of 100,000 empty files, the first batch arrives in under 20 ms. Report the time measured on this machine. Creating the files is not timed.

## Rules

- Stubs are `todo!()` only; types are real. One reason to fail per test. Files under 400 lines; tests are exempt. Run `cargo fmt`.
- Symlinks in tests: `std::os::unix::fs::symlink` on Unix; skip symlink tests on Windows, since creating one needs a privilege.
- Run `export CARGO_TARGET_DIR=<targets>/rusty-p6-f6`. Delete any `proptest-regressions/` your runs create.
- `clippy::todo` is denied. Lint with `cargo clippy -p rusty-fs --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-fs local --no-fail-fast 2>&1 | tail -30
```

The new tests fail with `not yet implemented`; the other `rusty-fs` tests still pass.

## Stop and report

Report:
- the files, the test count by group, and the check output tail;
- every ambiguity or error in this brief, with the decision you took.
