# P5 · L3 brief: `event_ring` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p5-l3`, branch `p5-l3` (from `p5-diag`). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-diag`'s `event_ring` module as stubs, and the tests that define it. L4 makes them pass without changing them.

The ring keeps the most recent structured events, already serialised and redacted, within a byte budget of about 2 MB. A crash report or a diagnostic report includes a snapshot of it. Many threads push; a snapshot must not block pushes for long.

## Read first

- `docs/architecture.md`, section "Diagnostics"; `plans/2026-10-14-p5-diagnostics.md`.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-diag/src/event_ring/
├── mod.rs     EventRing, RingStats; stubs
└── tests.rs
```

Add `mod event_ring;` and `pub use event_ring::{EventRing, RingStats};` to `crates/rusty-diag/src/lib.rs`. Touch nothing else.

## The API (exact)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct RingStats { pub events: usize, pub bytes: usize, pub dropped: u64, pub rejected: u64 }

pub struct EventRing { /* Mutex<VecDeque<Arc<str>>>, budget, counters */ }
impl EventRing {
    pub const DEFAULT_BUDGET: usize = 2 * 1024 * 1024;
    pub fn new(budget_bytes: usize) -> Self;
    pub fn push(&self, event: &str);
    pub fn snapshot(&self) -> Vec<Arc<str>>;   // oldest first
    pub fn stats(&self) -> RingStats;
    pub fn clear(&self);
}
// EventRing is Send + Sync.
```

## Behaviour

- `bytes` is the sum of the events' UTF-8 lengths.
- **push:** after pushing, the ring drops the oldest events until `bytes <= budget`, adding each drop to `dropped`. An event longer than the budget on its own is not stored, and `rejected` grows by one.
- **snapshot:** clones the `Arc`s under the lock; the lock is not held while the caller reads.
- **clear:** empties the ring and keeps the counters.

## Tests to write

1. push and snapshot order; bytes; dropping the oldest at the budget, by exact byte counts; a rejected event too large for the budget; an exactly-fitting event; clear keeps the counters; a zero budget rejects everything.
2. **Concurrency:** 8 threads × 1,000 pushes. Afterwards `events + dropped == 8,000` and `bytes <= budget`.
3. **Property** (`proptest`): random pushes (0–300 bytes) against random budgets (0–4 KB). After every push:
   - `bytes <= budget`;
   - the snapshot is a suffix of all accepted events;
   - `stats` agrees with the snapshot.
   Check this against a model in the test.

## Rules

- Stubs are `todo!()` only. One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p5-l3`. Delete any `proptest-regressions/` your stub runs create.
- `clippy::todo` is denied; lint the tests with `cargo clippy -p rusty-diag --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-diag --no-fail-fast 2>&1 | tail -30
```

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
