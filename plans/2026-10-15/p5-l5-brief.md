# P5 · L5 brief: `log_layer` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p5-l5`, branch `p5-l5` (from `p5-diag`). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-diag`'s `log_layer` module as stubs, and the tests that define it. L6 (api-builder, gpt-6.1-sol xhigh) makes them pass without changing them.

Every `tracing` event the app emits goes through one layer. The layer:
- redacts it;
- writes it as one JSON line into the `EventRing`;
- appends it to a rolling log file (3 × 10 MB).

Paths must never reach the log raw. A field named `path`, or ending in `_path`, is kept only when its value is already a redacted path. Otherwise the field is dropped and counted as a redaction miss.

## Read first

- `docs/architecture.md`, section "Diagnostics"; `plans/2026-10-14-p5-diagnostics.md` (L5/L6).
- `crates/rusty-diag/src/redact/mod.rs` (the `Redactor` and `RedactedPath` API) and `src/event_ring/mod.rs`.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Dependencies

`rusty-diag`:
- `tracing = "0.1.44"`;
- `tracing-subscriber = { version = "0.3.23", default-features = false, features = ["registry", "std"] }`;
- `serde_json = "1.0.154"`.

Dev-dependencies:
- `tempfile = "3.27.0"`;
- `tracing-subscriber`, the same version as above.

## Files you create

```text
crates/rusty-diag/src/log_layer/
├── mod.rs     LogLayer, LogConfig, RedactionMisses, is_redacted_path; stubs
└── tests.rs   (or tests/ with mod.rs)
```

Add `mod log_layer;` and `pub use log_layer::{LogConfig, LogLayer, RedactionMisses, is_redacted_path};` to `src/lib.rs`.

## The API (exact)

```rust
#[derive(Debug, Clone)]
pub struct LogConfig {
    pub dir: Option<PathBuf>,        // None: ring only (tests, or logging disabled)
    pub file_stem: String,           // "ferrite" -> ferrite.log, ferrite.1.log, ferrite.2.log
    pub max_file_bytes: u64,         // 10 MiB in the app; small in tests
    pub files: usize,                // 3
}

#[derive(Clone, Default)]
pub struct RedactionMisses { /* Arc<AtomicU64> */ }
impl RedactionMisses { pub fn count(&self) -> u64; }

pub struct LogLayer { /* Arc<Redactor>, Arc<EventRing>, file state in a Mutex, misses, clock */ }
impl LogLayer {
    pub fn new(config: LogConfig, redactor: Arc<Redactor>, ring: Arc<EventRing>) -> std::io::Result<Self>;
    pub fn misses(&self) -> RedactionMisses;
}
impl<S: tracing::Subscriber> tracing_subscriber::Layer<S> for LogLayer { /* on_event */ }

pub fn is_redacted_path(text: &str) -> bool;
```

## Behaviour

- **Line format:** `{"t":<ms since the layer was created>,"level":"INFO","target":"…","msg":"…","fields":{…}}`, one JSON object per line, with keys in that order and fields in the order recorded.
- **`msg`** and every string or Debug field pass through `Redactor::text`. Numbers and booleans are kept as JSON numbers and booleans.
- **Path fields:** a field named `path`, or ending in `_path`, is kept only when its value comes through Debug or Display (`path = %redacted`) **and** `is_redacted_path` accepts it. Otherwise the field is left out, and `RedactionMisses` grows by one. A raw `&str` value (`path = "C:\\x"`) is always a miss, even when it would pass the check.
- **`is_redacted_path`** accepts only text made of a root and segment tokens:
  - roots: `X:\`, `\\<server:N>\<share:N>`, `/`, `<user>`, or none;
  - tokens: `<d:hhhh>`, `<f:hhhh>` with an optional extension of 1–8 lowercase alphanumerics, and `<user>`;
  - separators: `\` or `/`.
  Anything else is rejected, including an empty string.
- **Rolling files:**
  - a line goes to `<stem>.log`;
  - when that file would go past `max_file_bytes`, `<stem>.{files-2}.log` … `<stem>.1.log` shift up, the oldest is deleted, and `<stem>.log` starts fresh;
  - at most `files` files ever exist;
  - a line longer than `max_file_bytes` is still written, alone, to a fresh file;
  - write errors are swallowed, so logging never breaks the app; L9 reports them later.
- **Ring:** every line is also pushed to the ring.

## Tests to write

Use `tracing::subscriber::with_default` with `Registry::default().with(layer)`.

1. A simple event becomes one JSON line in the ring, with every key; level and target are right; the message is redacted (identity user `canary-user` does not survive).
2. A field holding a raw `&str` path is dropped, `misses` is 1, and the other fields stay.
3. A field `path = %redactor.path(…)` is kept. A field `source_path = %redacted` is kept. A field `path = %"C:\\x"` (Display of a raw string) is dropped as a miss, because `is_redacted_path` refuses it.
4. Numbers and booleans keep their JSON types. A string field holding a Windows path is redacted through `text`.
5. `is_redacted_path`: about 12 positive and negative cases, among them `C:\<user>\<d:3fa2>\<f:07e1>.jpg`, `\\<server:1>\<share:1>\<d:0000>`, a raw `C:\Users`, a `<d:xyz1>` with non-hex characters, an extension with uppercase letters, and the empty string.
6. **Rolling**, with `max_file_bytes` 300 and `files` 3: after enough lines, exactly 3 files exist, each at most 300 bytes except for a single oversized line, the oldest lines are gone, and the order inside the files is kept.
7. `dir: None` writes no files.
8. **Canary:** emit 30 events across levels, with canary identity values in the message and in string fields, plus raw and redacted paths. Then neither the ring snapshot nor the files hold `canary` or `7731`, case-insensitively.

## Rules

- Stubs are `todo!()` only. One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p5-l5`. File tests use `tempfile::TempDir`.
- `clippy::todo` is denied; lint with `cargo clippy -p rusty-diag --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-diag --no-fail-fast 2>&1 | tail -30
```

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
