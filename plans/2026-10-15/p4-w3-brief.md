# P4 · W3 brief: `settings` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p4-w3`, branch `p4-w3` (from `p4-storage`). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-store`'s `settings` module as stubs, and the tests that define it. W4 (Opus high) makes them pass without changing them.

Settings live in `ferrite.toml` (D29), are edited by hand, and must never be lost: an invalid file is reported and **never overwritten**, and the app keeps running on the last valid settings.

## Read first

- `plans/2026-10-14-p4-storage.md`; `docs/architecture.md` sections "No corruption" and the storage table (search "Settings and keymaps"); `docs/decisions.md` D10, D16, D17, D29.
- `crates/rusty-store/src/` (all): `write_atomic`, `backup_path`.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Dependencies

Add to `crates/rusty-store/Cargo.toml`: `serde = { version = "1.0.229", features = ["derive"] }`, `toml = "1.1.8"`, `serde_ignored = "0.1.14"`, `thiserror = "2.0.21"`; dev: `insta = "1.49.0"`.

## Files you create

```text
crates/rusty-store/src/settings/
├── mod.rs       SettingsStore, LoadReport, SettingsError, re-exports
├── model.rs     Settings and its sections, with serde derives and defaults (real, not stubs)
├── parse.rs     stubs: parse(), to_toml()
└── tests.rs     (or tests/ with mod.rs); snapshots in settings/snapshots/
```

Add `mod settings;` and `pub use settings::{…every pub item below…};` to `src/lib.rs`. Touch nothing else.

## The model (real code, written by you)

```rust
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default, rename_all = "kebab-case")]
pub struct Settings {
    pub appearance: Appearance,
    pub files: Files,
    pub selection: SelectionSettings,
    pub terminal: Terminal,
    pub experimental: BTreeMap<String, bool>,   // D: experimental flags
}
// Appearance { mode: ThemeMode (system|light|dark, default system), light-theme: String ("Ferrite Light"),
//              dark-theme: String ("Ferrite Dark"), font: String ("Inter"), font-size: u16 (13), density: Density (compact|normal|comfortable, default normal) }
// Files { show-hidden: bool (false), show-system: bool (false), folders-first: bool (true), sort: SortKey (name|size|date|kind, default name), sort-descending: bool (false) }
// SelectionSettings { space-measures-folders: bool (true), patterns-select-folders: bool (false) }
// Terminal { provider: String ("windows-terminal"), command: Option<String> (None) }
```

Every struct has `Default` with these values and `#[serde(default, rename_all = "kebab-case")]`; enums use `rename_all = "kebab-case"`.

## The API (stubs)

```rust
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum SettingsError {
    #[error(...)] Invalid { line: usize, column: usize, message: String },   // 1-based; from the TOML or type error span
    #[error(...)] Io { kind: std::io::ErrorKind, message: String },
    #[error(...)] FileInvalid,          // save refused: the file on disk does not parse, so the user's edit would be lost
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct LoadReport {
    pub unknown_keys: Vec<String>,      // dotted paths, e.g. "appearance.colour", in file order
    pub error: Option<SettingsError>,   // the file was not used
}

pub fn parse(text: &str) -> Result<(Settings, Vec<String>), SettingsError>;  // settings + unknown keys
pub fn to_toml(settings: &Settings) -> String;

pub struct SettingsStore { /* path, current */ }
impl SettingsStore {
    pub fn load(path: &Path) -> (Self, LoadReport);   // missing file: defaults, empty report; invalid file: defaults + error
    pub fn current(&self) -> &Settings;
    pub fn reload(&mut self) -> LoadReport;           // invalid: keeps current, reports the error
    pub fn save(&mut self, settings: Settings) -> Result<(), SettingsError>;
}
```

## Behaviour

- Unknown keys never fail the load; they are listed.
- A syntax error or a type error (`font-size = "big"`) is `Invalid` with the 1-based line and column of the offending value.
- `save` writes `to_toml(settings)` with `write_atomic` (so the previous file becomes `.bak`) and updates `current`. If the file exists and does not parse, `save` returns `FileInvalid` and writes nothing. A missing file is created.
- `to_toml(&Settings::default())` round-trips through `parse` to the defaults with no unknown keys.
- An empty file gives the defaults.

## Tests to write

1. Model: `Settings::default()` has the values above (one test per section).
2. Snapshot (`insta`): `to_toml(&Settings::default())`.
3. Parse: empty text; a partial file keeps defaults for the rest; every enum value; unknown keys at the top level and in a section, in file order; syntax error with line and column; type error with line and column.
4. Store: load of a missing, valid, invalid file; reload after a valid edit; reload after an invalid edit keeps the previous settings and reports; save creates the file; save keeps a `.bak` of the old file; save refuses an invalid file and leaves its bytes untouched; save of then load returns equal settings.
5. Property (`proptest`, 64 cases): a random `Settings` (strategy over every field; strings without control characters) survives `to_toml` then `parse` unchanged.

All file tests use `tempfile::TempDir`.

## Rules

- Stubs are `todo!()` only (the model is real). One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p4-w3`. Delete any `proptest-regressions/` and pending `.snap.new` files your stub runs create.
- `clippy::todo` is denied; lint the tests with `cargo clippy -p rusty-store --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-store --no-fail-fast 2>&1 | tail -30
```

`atomic_write` tests pass; the `settings` tests that need the stubs fail with `not yet implemented` (model-default tests may pass).

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
