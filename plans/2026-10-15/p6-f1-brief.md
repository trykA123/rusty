# P6 · F1 brief: `location` v2 and `error_model` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p6-f1`, branch `p6-f1` (from `p6-fs`). Do not commit; the orchestrator does.

## Goal

Write the API of the new `Location` (provider plus lossless path) and the file-system error model in `rusty-core`, as stubs, with the tests that define them. F2 (orchestrator, Opus high) makes them pass without changing them.

Today `Location` is a non-empty string without NUL. It is used everywhere: commands, state, session, replay. The new version keeps that public surface working:
- `Location::new(text)` still parses the text form;
- `as_str()` returns the text form;
- equality and hashing still work.

Under it, `Location` gains a `ProviderId` and a `ProviderPath` that never loses a file name, even one that is not valid Unicode.

## Read first

- `plans/2026-10-14-p6-locations-fs.md` (whole, including the G3 notes); `docs/decisions.md` D19, D21; `docs/architecture.md` "Locations, not paths" and "Drives and network locations".
- `crates/rusty-core/src/location/` (the current type and tests), `crates/rusty-core/src/lib.rs`.
- How `Location` is used: `grep -rn "Location::new\|as_str()" crates/rusty-core/src crates/rusty-store/src` (do not change those callers).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files

```text
crates/rusty-core/src/location/
├── mod.rs        Location (new fields), LocationError (new variant), re-exports
├── provider.rs   ProviderId
├── path.rs       ProviderPath
└── tests/        (replace tests.rs by a folder: keep the 3 existing tests, add the new ones)
crates/rusty-core/src/fs_error/
├── mod.rs        FsError, FsErrorKind, RecoveryAction
└── tests.rs      snapshots in fs_error/snapshots/
```

Add `pub use` for `ProviderId`, `ProviderPath`, `FsError`, `FsErrorKind`, `RecoveryAction` to `src/lib.rs`, and `mod fs_error;`.

The `Location` struct's fields change. Keep `Location::new` and `as_str` as real code that delegates to the new stubs, so every existing caller compiles. Existing tests will then fail through those stubs until F2; that is expected.

## The API (exact)

```rust
// provider.rs
#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ProviderId(/* String */);
impl ProviderId {
    pub fn new(id: &str) -> Result<Self, LocationError>;   // [a-z][a-z0-9-]{1,31}; else BadProvider
    pub fn local() -> Self;                                  // "local"
    pub fn as_str(&self) -> &str;
}

// path.rs
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ProviderPath(/* enum Repr { Text(String), Wide(Box<[u16]>), Bytes(Box<[u8]>) } */);
impl ProviderPath {
    pub fn from_text(text: &str) -> Self;        // decodes the escape ranges below
    pub fn from_wide(units: &[u16]) -> Self;     // Text when valid UTF-16, else Wide
    pub fn from_bytes(bytes: &[u8]) -> Self;     // Text when valid UTF-8, else Bytes
    pub fn as_str(&self) -> Option<&str>;        // Some only for Text
    pub fn to_text(&self) -> String;             // lossless text form (escapes below)
    pub fn to_wide(&self) -> Option<Vec<u16>>;   // Text or Wide
    pub fn to_bytes(&self) -> Option<Vec<u8>>;   // Text or Bytes
    pub fn display(&self) -> Cow<'_, str>;       // lossy, U+FFFD for what is not Unicode; for the UI only
    pub fn is_empty(&self) -> bool;
    pub fn windows_eq(&self, other: &Self) -> bool;   // Windows rules, see below
}

// mod.rs
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Location { /* provider, path, text (cached text form) */ }
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum LocationError { Empty, Nul, BadProvider }   // keep the two existing messages
impl Location {
    pub fn new(text: impl Into<String>) -> Result<Self, LocationError>;   // parses the text form
    pub fn local(path: ProviderPath) -> Result<Self, LocationError>;
    pub fn with_provider(provider: ProviderId, path: ProviderPath) -> Result<Self, LocationError>;
    pub fn provider(&self) -> &ProviderId;
    pub fn path(&self) -> &ProviderPath;
    pub fn as_str(&self) -> &str;              // the text form
    pub fn is_local(&self) -> bool;
    pub fn same_place(&self, other: &Self) -> bool;   // provider equal and, for local Windows-style paths, windows_eq; else exact
}

// fs_error/mod.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FsErrorKind { NotFound, AccessDenied, SharingViolation, Locked, DiskFull, PathTooLong, NameInvalid, NetworkLost, Timeout, Cancelled, Unknown }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RecoveryAction { Retry, RetryAsAdmin, Skip, SkipAll, Cancel, Rename, OpenFolder, Reconnect }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FsError { pub kind: FsErrorKind, pub location: Option<Location>, pub os_code: Option<i32> }
impl FsErrorKind {
    pub fn from_windows_code(code: u32) -> Self;
    pub fn from_errno(code: i32) -> Self;
}
impl FsError {
    pub fn message(&self) -> String;              // one plain-English sentence; names the location with display(), never the raw OS text
    pub fn recovery(&self) -> &'static [RecoveryAction];
}
```

## Behaviour

- **Text form of a `Location`:**
  - local: the path's `to_text()` (so `C:\Users\admin`, `\\srv\share\x` and `/home/admin` are unchanged from today);
  - other providers: `<provider>://<to_text>`.
  - `Location::new(text)` reads `<id>://` as a provider only when `<id>` is a valid `ProviderId` other than `local`; everything else is a local path. `local://x` is `BadProvider`.
  - Empty text or an empty path is `Empty`. A NUL anywhere in the path is `Nul`.
- **Escapes in `to_text`:**
  - an unpaired UTF-16 surrogate `u` (0xD800–0xDFFF) becomes the character U+100000 + (u − 0xD800);
  - an invalid UTF-8 byte `b` (0x80–0xFF) becomes U+100800 + b.
  - `from_text` reverses this: a text that holds only surrogate escapes becomes `Wide`, and one that holds only byte escapes becomes `Bytes`. A text that mixes both, or holds none, stays `Text` with the characters kept literally.
  - **Round trip:** `from_text(p.to_text()) == p` for every `ProviderPath` built by `from_wide` or `from_bytes`.
- **`windows_eq`:** compare UTF-16 units after mapping each unit through simple uppercase. A unit that maps to exactly one BMP character takes that character; any other unit stays as it is. Lengths must match. This is what NTFS does with its upcase table; it is not Unicode case folding, so `ß` ≠ `SS`.
- **`same_place`:** uses `windows_eq` for local paths that start with a drive letter and `:` or with `\\`; uses `==` otherwise.
- **Windows codes:**
  - 2 and 3: `NotFound`;
  - 5: `AccessDenied`;
  - 32: `SharingViolation`;
  - 33: `Locked`;
  - 39 and 112: `DiskFull`;
  - 111 and 206: `PathTooLong`;
  - 123: `NameInvalid`;
  - 53, 64, 67 and 1231: `NetworkLost`;
  - 121 and 1460: `Timeout`;
  - 1223: `Cancelled`;
  - anything else: `Unknown`.
- **Unix errno values:**
  - 2: `NotFound`;
  - 1 and 13: `AccessDenied`;
  - 26: `SharingViolation`;
  - 16: `Locked`;
  - 28: `DiskFull`;
  - 36: `PathTooLong`;
  - 22 and 84: `NameInvalid`;
  - 101, 103, 104, 112 and 113: `NetworkLost`;
  - 110: `Timeout`;
  - 125: `Cancelled`;
  - anything else: `Unknown`.
- **Recovery actions:**
  - NotFound: Skip, SkipAll, Cancel;
  - AccessDenied: RetryAsAdmin, Skip, SkipAll, Cancel;
  - SharingViolation and Locked: Retry, Skip, SkipAll, Cancel;
  - DiskFull: Retry, Cancel;
  - PathTooLong and NameInvalid: Rename, Skip, Cancel;
  - NetworkLost: Reconnect, Retry, Cancel;
  - Timeout: Retry, Cancel;
  - Cancelled: none;
  - Unknown: Retry, Skip, Cancel.

## Tests to write

1. All three existing location tests, unchanged.
2. Text form:
   - local Windows, UNC and Unix paths are unchanged;
   - `archive://C:\a.zip`;
   - `local://x` is refused, and so are a bad provider id and an empty path;
   - `C:\x` is not taken as a provider;
   - NUL.
3. `ProviderPath`:
   - `from_wide` with valid and with lone-surrogate units;
   - `from_bytes` with valid and with invalid UTF-8;
   - `to_wide` and `to_bytes` across kinds;
   - `display` is lossy;
   - escape characters in the text form;
   - mixed escapes stay literal.
4. `windows_eq` and `same_place`:
   - `C:\Users\Admin` vs `c:\users\ADMIN`;
   - `ß` vs `SS` (not equal);
   - Greek and Cyrillic letters;
   - Unix paths stay case-sensitive;
   - different providers are never the same place.
5. Properties (`proptest`):
   - any `Vec<u16>`, including lone surrogates, survives `from_wide`, then `to_text`, `from_text` and `to_wide`;
   - any `Vec<u8>` survives the same with `from_bytes` and `to_bytes`;
   - `Location::new(l.as_str()) == Ok(l)` for locations built from those paths, without NUL;
   - `windows_eq` is reflexive and symmetric.
6. Errors:
   - every Windows code and errno in the tables, and one unknown value of each;
   - the recovery list of every kind;
   - an `insta` snapshot with the `message()` of every kind, with and without a location (use `C:\Data\report.xlsx`);
   - `message` never holds the OS code text.

## Rules

- Stubs are `todo!()` only. `Location::new` and `as_str` delegate to stubs, as described above. One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p6-f1`. Delete any `proptest-regressions/` your stub runs create. Write `insta` calls; F2 accepts the snapshots.
- `clippy::todo` is denied; lint with `cargo clippy -p rusty-core --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-core --no-fail-fast 2>&1 | tail -40
```

The new tests fail with `not yet implemented`; tests that build a `Location` fail the same way. That is expected for this atom only. Report the count.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
