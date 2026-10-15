# P5 · L9 brief: `report` and canary Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p5-l9`, branch `p5-l9` (from `p5-diag`). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-diag`'s `report` module as stubs, and the tests that define it, including the **canary test** that guards the whole of P5. L10 (Claude agent, Opus medium; D35) makes them pass without changing them.

The user saves a diagnostic report by hand (Help, or `ferrite --diag-report <file>` until the UI exists). It is a zip with:
- a readable `report.json`;
- a `summary.txt` that lists what the report contains, so the user can check it before sharing.

Nothing in it may identify the user.

## Read first

- `docs/architecture.md` "Diagnostics" (the "What a report holds" table); `plans/2026-10-14-p5-diagnostics.md`.
- `crates/rusty-diag/src/`: `redact`, `event_ring`, `log_layer`, `memory` (public APIs).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Dependencies

- `rusty-diag`: `zip = { version = "9.0.3", default-features = false, features = ["deflate"] }`; `serde = { version = "1.0.229", features = ["derive"] }`; `serde_json` (already there).
- Check that `cargo deny check licenses` still passes; report it if it does not.

## Files you create

```text
crates/rusty-diag/src/report/
├── mod.rs     ReportInput, BuildInfo, SystemInfo, ErrorRecord, ReportSummary, write_report; stubs
└── tests/     mod.rs, report.rs, canary.rs
```

Add `mod report;` and the `pub use` of every pub item to `src/lib.rs`.

## The API (exact)

```rust
#[derive(Debug, Clone, Default, Serialize)]
pub struct BuildInfo { pub version: String, pub commit: String }
#[derive(Debug, Clone, Default, Serialize)]
pub struct SystemInfo { pub os: String, pub cpu_count: usize, pub ram_bytes: u64, pub gpu: String, pub scale: f32 }
#[derive(Debug, Clone, Serialize)]
pub struct ErrorRecord { pub kind: String, pub os_code: Option<i32>, pub operation: String, pub detail: String }

#[derive(Debug, Clone, Default)]
pub struct ReportInput {
    pub build: BuildInfo,
    pub system: SystemInfo,
    pub settings_changed: Vec<(String, String)>,   // key, value; values may hold paths
    pub errors: Vec<ErrorRecord>,
    pub events: Vec<Arc<str>>,                     // from EventRing::snapshot (already redacted lines)
    pub memory: Option<MemoryReport>,
    pub startup_ms: Vec<(String, f64)>,            // start-up marks
    pub redaction_misses: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReportSummary { pub sections: Vec<String>, pub events: usize, pub errors: usize, pub bytes: u64 }

pub fn write_report(path: &Path, input: &ReportInput, redactor: &Redactor) -> std::io::Result<ReportSummary>;
```

## Behaviour

- **The zip** holds exactly `report.json` and `summary.txt`. It is written through a temp file and a rename, so a failed write leaves no partial zip at `path`.
- **`report.json`** is pretty JSON with the sections `build`, `system`, `configuration`, `errors`, `recent_events`, `memory` and `performance`, plus `redaction_misses`.
  - `recent_events` holds the event lines parsed back into JSON values; an event line that is not valid JSON is kept as a string.
  - `memory` is `null` when absent.
- **Redaction:** every string that comes from the input passes through `Redactor::text`. This covers the os, the gpu, settings keys and values, error operations and details, and event lines (a second pass is harmless). Numbers stay numbers.
- **`summary.txt`:** a few plain-English lines naming each section and its counts, ending with "This report holds no file names, user or computer names; paths are replaced by tokens like `<d:3fa2>`."
- **`ReportSummary`:**
  - `sections`: the section names in order;
  - `events` and `errors`: the counts;
  - `bytes`: the zip size.

## Tests to write

1. **Report:**
   - the zip has exactly the two entries;
   - `report.json` parses, has every section in order and keeps numbers as numbers;
   - `memory: null` when absent;
   - events are parsed as JSON, and a bad line is kept as a string;
   - `summary.txt` names the sections;
   - `ReportSummary` counts and bytes match the file;
   - a write into a missing folder fails and leaves nothing behind.
2. **Canary**, end to end, the test that must never be removed:
   1. Build a `Redactor` with user `canary-user-7731`, computer `CANARY-PC-7731`, domain `CANARYDOM` and profile `C:\Users\canary-user-7731`.
   2. Install a `LogLayer` (`log_layer`) with a temp `dir`, feeding an `EventRing`.
   3. Emit about 25 events, through `tracing`, that hold the canary values:
      - in messages;
      - in string fields;
      - in raw path fields;
      - in paths under the profile;
      - in `\\canary-srv-7731\share` paths;
      - in a search query: `query = "canary secret plan"`.
   4. Build a `ReportInput` whose settings, errors, os, gpu and memory cache names also hold canary values, and write the report.
   5. Unzip it and read every log file. None of `canary`, `7731`, `CANARYDOM` or `secret plan` may appear in any byte, case-insensitively.
   - The search query must never be logged in clear. Assume it is passed as a normal string field; `Redactor::text` will not catch `canary secret plan` because it is not a path or an identity name. If you find that the canary cannot pass for that reason, **do not weaken the test**. Mark it `#[ignore = "needs query redaction (L10)"]` and report it. The orchestrator then decides the rule: a field named `query` or `search` is replaced by its length.
3. **Property** (`proptest`, 32 cases): for random `ReportInput` strings drawn from a pool holding canary values, the zip never contains a canary value.

## Rules

- Stubs are `todo!()` only. One reason to fail per test (the canary test may check several haystacks in one loop). Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p5-l9`. File tests use `tempfile::TempDir`.
- `clippy::todo` is denied; lint with `cargo clippy -p rusty-diag --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-diag --no-fail-fast 2>&1 | tail -30
```

## Stop and report

Report: files, test count by group, the check output tail, the `cargo deny` result, and every ambiguity or error in this brief with the decision you took.
