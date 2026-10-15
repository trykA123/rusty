# P3 · C11 brief: `replay` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p3-c11`, branch `p3-c11` (from `p3-core` after C10). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-core`'s `replay` module as stubs, and the tests that define it. C12 (Opus high) makes them pass without changing them.

A `CommandLog` records what happened to an `AppState` (commands and runtime events, with relative times) in a versioned, human-readable text form. Replaying a log from its start gives the same state (D21). Diagnostics (P5) attach logs to bug reports, so the text must be readable and must not grow without bound.

## Read first

- `plans/2026-10-14-p3-core-model.md`; `docs/decisions.md` D21; `docs/architecture.md` sections on diagnostics and record and replay (search "replay").
- `crates/rusty-core/src/` public API: `command/mod.rs` (`Command`, its text form), `apply/mod.rs` (`apply`, `apply_event`, `Event`, `Effect`), `state/` readers, `state/listing.rs`.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-core/src/replay/
├── mod.rs     CommandLog, Record, LogEntry, LogError, Recorder; stubs
├── text.rs    stubs for the text form
└── tests.rs   (or tests/ with mod.rs); snapshots in replay/snapshots/
```

Add `mod replay;` and `pub use replay::{CommandLog, LogEntry, LogError, Record, Recorder};` to `src/lib.rs`. Touch nothing else.

## The API (exact)

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LogEntry { Command(Command), Event(Event) }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Record { pub after_ms: u64, pub entry: LogEntry }   // time since the previous record

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CommandLog { /* private: home, records */ }

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum LogError {
    TooNew { found: u32, supported: u32 },
    BadHeader,
    Line { line: usize, message: String },   // 1-based line of the text
}

impl CommandLog {
    pub const VERSION: u32 = 1;
    pub const LIMIT: usize = 10_000;                 // records kept; older ones are dropped with their state folded in (see below)
    pub fn new(home: Location) -> Self;
    pub fn home(&self) -> &Location;
    pub fn records(&self) -> &[Record];
    pub fn push(&mut self, after_ms: u64, entry: LogEntry);
    pub fn replay(&self) -> AppState;                 // AppState::new(home), then apply / apply_event each record; errors are ignored (they changed nothing when recorded)
    pub fn to_text(&self) -> String;
    pub fn parse(text: &str) -> Result<Self, LogError>;
}

pub struct Recorder { /* state, log, clock of the last record */ }
impl Recorder {
    pub fn new(home: Location) -> Self;
    pub fn state(&self) -> &AppState;
    pub fn log(&self) -> &CommandLog;
    pub fn command(&mut self, at_ms: u64, command: Command) -> Result<Vec<Effect>, CommandError>;  // applies and records (also failed commands)
    pub fn event(&mut self, at_ms: u64, event: Event) -> Vec<Effect>;                              // applies and records
}
```

`at_ms` is an absolute clock in milliseconds; the recorder stores the difference to the previous record (0 for the first, and 0 if the clock goes backwards).

## Text form

```text
ferrite-log 1
home "/home/admin"
+0 pane.navigate { location: "/home/admin/src" }
+12 !listing-loaded { tab: 3, location: "/home/admin/src", entries: 2 }
  folder "lib"
  file "main.rs"
+250 !page-rows { pane: 2, rows: 30 }
+40 selection.toggle
```

- Line 1 is `ferrite-log <version>`; a higher version is `TooNew`; anything else is `BadHeader`.
- Line 2 is `home <string>` with the command string escapes.
- Each record starts with `+<after_ms> `, then a command in its canonical text form, or an event: `!` and the event name in kebab case with fields in the command field syntax.
- `!listing-loaded` has `entries: <n>` followed by exactly `n` lines, each two spaces, `folder` or `file`, a space and the quoted name.
- Every parse error names the 1-based line.
- `LIMIT`: when a push would exceed it, the log drops the oldest records. To keep replay exact, a log that has dropped records cannot replay from `home` alone; for P3, `push` beyond `LIMIT` drops the oldest and `replay` then starts from `AppState::new(home)` anyway — the test only checks the count and that the newest records are kept. (Folding state into a snapshot comes with P4's session snapshot.)

## Tests to write

1. Text: a snapshot (`insta`) of a small hand-built log with every command kind and both events; parse of that text gives the same log.
2. Errors: wrong header, higher version (`TooNew`), a bad command line, a bad event line, a listing with fewer entry lines than announced, each with its line number.
3. Recorder: records failed commands too; `after_ms` deltas, including a clock going backwards; the effects returned equal those of `apply`.
4. Properties (`proptest`):
   - for random sequences (up to 80) of commands and events fed to a `Recorder`, `recorder.log().replay() == *recorder.state()`;
   - `CommandLog::parse(&log.to_text()) == Ok(log)` for those logs (names and locations with quotes, backslashes, control characters and non-ASCII);
   - `parse` never panics on arbitrary text.
5. `LIMIT`: pushing `LIMIT + 5` records keeps `LIMIT`, the newest.

## Rules

- Stubs are `todo!()` only. One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p3-c11`. Delete any `proptest-regressions/` and pending `.snap.new` files your stub runs create.
- `clippy::todo` is denied; lint the tests with `cargo clippy -p rusty-core --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-core --no-fail-fast 2>&1 | tail -40
```

The earlier modules' tests pass; the `replay` tests fail with `not yet implemented`.

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
