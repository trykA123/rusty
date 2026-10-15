# P5 · L1 brief: `redact` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p5-l1`, branch `p5-l1` (from `p5-diag`). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-diag`'s `redact` module as stubs, and the tests that define it. L2 (api-builder, gpt-6.1-sol xhigh) makes them pass without changing them.

Diagnostics must never record who the user is (D20, architecture "Diagnostics"). Redaction happens when an event is recorded: paths go through `RedactedPath`, which keeps the shape and drops the names, and free text goes through `Redactor::text`. These tests are the privacy guarantee, so be thorough and adversarial.

## Read first

- `docs/architecture.md`, section "Diagnostics" (whole); `docs/decisions.md` D20; `plans/2026-10-14-p5-diagnostics.md`.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Dependencies

`rusty-diag`: `thiserror = "2.0.21"` if needed; dev: `proptest = "1.12.0"`. No hashing crates: use `std::hash` (SipHash via `DefaultHasher`) over salt and segment.

## Files you create

```text
crates/rusty-diag/src/redact/
├── mod.rs     Salt, Identity, Redactor, RedactedPath, DriveKind, PathKind, LengthClass; stubs
└── tests.rs   (or tests/ with mod.rs)
```

Add `mod redact;` and the `pub use` of every pub item to `crates/rusty-diag/src/lib.rs` (keep `#![forbid(unsafe_code)]`). Add `rusty-diag = 85` to `xtask/coverage-floors.toml`. Touch nothing else.

## The API (exact)

```rust
#[derive(Clone)] pub struct Salt([u8; 16]);
impl Salt { pub fn random() -> Self; pub fn from_bytes(bytes: [u8; 16]) -> Self; }
// Debug for Salt prints "Salt(..)", never the bytes.

#[derive(Debug, Clone, Default)]
pub struct Identity {
    pub user: Option<String>,        // "admin"
    pub computer: Option<String>,    // "WORKPC-17"
    pub domain: Option<String>,      // "CORP"
    pub profile: Option<String>,     // "C:\\Users\\admin" or "/home/admin"
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)] pub enum DriveKind { Local, Network, Removable, Unknown }
#[derive(Debug, Clone, Copy, PartialEq, Eq)] pub enum PathKind { File, Folder }
#[derive(Debug, Clone, Copy, PartialEq, Eq)] pub enum LengthClass { Short, Medium, Long }   // < 64, < 260, >= 260 characters

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RedactedPath { /* private */ }
impl RedactedPath {
    pub fn as_str(&self) -> &str;
    pub fn drive(&self) -> DriveKind;
    pub fn depth(&self) -> usize;            // segments after the root
    pub fn length_class(&self) -> LengthClass;
    pub fn is_long(&self) -> bool;           // >= 260 characters, or a \\?\ prefix
    pub fn has_non_ascii(&self) -> bool;
}
impl std::fmt::Display for RedactedPath { /* as_str */ }

pub struct Redactor { /* salt, identity, server table (interior mutability, Sync) */ }
impl Redactor {
    pub fn new(salt: Salt, identity: Identity) -> Self;
    pub fn path(&self, path: &str, kind: PathKind, drive: DriveKind) -> RedactedPath;
    pub fn text(&self, text: &str) -> String;
}
// Redactor must be Send + Sync (assert it in a test).
```

## Behaviour

- **Roots kept:**
  - drive roots `C:\` and `c:/`, with the letter uppercased;
  - `/` for Unix paths;
  - UNC paths `\\server\share\…` become `\\<server:N>\<share:N>\…`. N counts from 1 per distinct name, case-insensitively, in order of first appearance in this `Redactor`;
  - `\\?\` long-path prefixes are dropped from the text, and `is_long` is set.
- **Profile:** when `identity.profile` is a prefix of the path (case-insensitive for drive paths, exact for Unix), that prefix becomes `C:\<user>` (drive paths) or `/<user>` (Unix).
- **Segments:** every other segment becomes `<d:xxxx>`, or `<f:xxxx>` for the last segment when `kind == File`.
  - `xxxx` is 4 lowercase hex characters from SipHash over the salt and the segment, lowercased. So the same name in any case gets the same token within one salt.
  - A file keeps its extension if the extension is 1–8 ASCII alphanumeric characters, lowercased: `<f:07e1>.jpg`. Otherwise it gets no extension.
- **Separators:** the output uses `\` for drive and UNC paths and `/` for Unix paths. Empty segments from doubled separators are dropped.
- **`text()` replaces:**
  - user, computer and domain names, case-insensitively, wherever they occur, with `<user>`, `<computer>`, `<domain>`;
  - known UNC server names with their `<server:N>` token;
  - every path-like substring with its redacted form, as `PathKind::File` and `DriveKind::Unknown`. Path-like means a drive root or a `\\` start, running up to whitespace, a quote, `<`, `>`, `|` or the end;
  - Unix paths that start with the profile.
- **Never panics** on any input. Relative paths are treated as segments with no root.

## Tests to write

1. Paths, as unit tests:
   - a drive path with profile, giving `C:\<user>\<d:…>\<f:…>.jpg`;
   - a drive path without profile; a folder vs a file; extension rules (`.JPG` → `.jpg`, `.tar.gz` → `.gz`, `.verylongext` → none, `.é` → none);
   - UNC numbering across two paths and two servers;
   - `\\?\C:\…`; a Unix path; doubled separators;
   - the same name in different case gives the same token, and a different salt gives a different token;
   - depth, length class at 63/64/259/260, non-ASCII flag;
   - an empty string; a lone `C:`.
2. Text, as unit tests: each identity field; case-insensitivity; a Windows error text with an embedded path, `Access is denied: 'C:\Users\admin\secret.txt'`, comes out with no `admin`, `secret` or `Users`; a UNC path inside a sentence; text without anything to redact is unchanged.
3. Properties (`proptest`):
   - **(privacy)** for random paths built from random segments (3–12 characters, letters, digits, spaces, Unicode), no segment of 3 or more characters, or any substring of one, appears in the output of `path()` or of `text()` on a sentence holding the path. Compare case-insensitively; skip extensions;
   - `path()` and `text()` never panic on arbitrary strings;
   - the output token count equals the depth.
4. **Canary**: a `Redactor` with identity user `canary-user-7731`, computer `CANARY-PC-7731`, domain `CANARYDOM`, profile `C:\Users\canary-user-7731`. Feed 20 realistic log lines that hold these values and paths under the profile and on `\\canary-srv-7731\share`. The output must contain none of `canary`, `7731`, `CANARYDOM`, case-insensitively.

## Rules

- Stubs are `todo!()` only (types and `Debug` for `Salt` are real). One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p5-l1`. Delete any `proptest-regressions/` your stub runs create.
- `clippy::todo` is denied; lint the tests with `cargo clippy -p rusty-diag --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-diag --no-fail-fast 2>&1 | tail -30
```

The `redact` tests compile and fail with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
