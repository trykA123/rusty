# P5 · L7 brief: `memory_stats` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p5-l7`, branch `p5-l7` (from `p5-diag`). Do not commit; the orchestrator does.

## Goal

Write the API of `rusty-diag`'s `memory` module as stubs, and the tests that define it. L8 (api-builder, gpt-6.1-sol xhigh) makes them pass without changing them.

The diagnostic report shows:
- process memory: working set and private bytes, where private is the number that the G2 target uses;
- every cache's size against its budget;
- task counts per owner.

The Windows probe needs `unsafe` and lives in `rusty-app` later. This module has the trait, a Linux probe that reads `/proc/self/status`, a fake, and the registries.

## Read first

- `docs/architecture.md`, section "Diagnostics" (the Memory row) and the memory budget section (search "budget");
- `docs/spike/results.md`, section "Memory", which says private memory is the target metric;
- `plans/2026-10-14-p5-diagnostics.md`;
- `~/.agents/rules/rust.md` and `~/.agents/rules/code-quality.md`, section "Tests".

## Files you create

```text
crates/rusty-diag/src/memory/
├── mod.rs        ProcessMemory, MemoryProbe, FakeProbe, CacheRegistry, CacheHandle, TaskCounters, TaskGuard, MemoryReport, CacheUsage, memory_report; stubs
├── linux.rs      #[cfg(target_os = "linux")] ProcStatusProbe + parse_proc_status (stub)
└── tests.rs
```

Add `mod memory;` and the `pub use` of every pub item to `crates/rusty-diag/src/lib.rs`. Touch nothing else.

## The API (exact)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProcessMemory { pub resident_bytes: u64, pub private_bytes: u64 }

pub trait MemoryProbe: Send + Sync { fn sample(&self) -> std::io::Result<ProcessMemory>; }

pub struct FakeProbe(pub std::io::Result<ProcessMemory>);  // tests; returns a copy (errors cloned by kind and message)

#[cfg(target_os = "linux")] pub struct ProcStatusProbe;      // reads /proc/self/status
#[cfg(target_os = "linux")] pub fn parse_proc_status(text: &str) -> Option<ProcessMemory>;
// resident = VmRSS, private = RssAnon (both in kB in the file) × 1024; None if either line is missing or malformed

#[derive(Clone, Default)] pub struct CacheRegistry { /* Arc<Mutex<Vec<(name, budget, Arc<AtomicU64>)>>> */ }
impl CacheRegistry {
    pub fn register(&self, name: &str, budget_bytes: u64) -> CacheHandle;   // same name twice: two entries, both reported
}
#[derive(Clone)] pub struct CacheHandle { /* Arc<AtomicU64> */ }
impl CacheHandle { pub fn set(&self, bytes: u64); pub fn add(&self, bytes: u64); pub fn sub(&self, bytes: u64); }  // sub saturates at 0
// A cache whose handles are all dropped disappears from the report.

#[derive(Clone, Default)] pub struct TaskCounters { /* Arc<Mutex<BTreeMap<String, usize>>> or atomics */ }
impl TaskCounters { pub fn start(&self, owner: &str) -> TaskGuard; }
pub struct TaskGuard { /* decrements on drop */ }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CacheUsage { pub name: String, pub bytes: u64, pub budget: u64 }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MemoryReport {
    pub process: Option<ProcessMemory>,      // None when the probe fails
    pub probe_error: Option<String>,
    pub caches: Vec<CacheUsage>,             // registration order
    pub tasks: Vec<(String, usize)>,         // owners with a count above 0, by name
}

pub fn memory_report(probe: &dyn MemoryProbe, caches: &CacheRegistry, tasks: &TaskCounters) -> MemoryReport;
```

## Tests to write

1. `parse_proc_status`: a real sample (copy one from this machine with `cat /proc/self/status`, and replace the `Name:` line with `test`); missing `RssAnon`; a malformed number; extra spaces and tabs. `ProcStatusProbe` on Linux returns non-zero values.
2. Caches: set, add, sub with saturation; two caches; a dropped cache disappears; registration order.
3. Tasks: counts per owner; a guard drop decrements; an owner at 0 is not listed; 8 threads × 100 guards end at 0.
4. Report: with a fake probe; with a failing probe, giving `process == None` and the error text.
5. Thread safety: `CacheRegistry`, `CacheHandle`, `TaskCounters` and `TaskGuard` are `Send + Sync` (static assertion helper).

## Rules

- Stubs are `todo!()` only. One reason to fail per test. Files under 400 lines (tests exempt). `cargo fmt`.
- `export CARGO_TARGET_DIR=<targets>/rusty-p5-l7`.
- `clippy::todo` is denied; lint the tests with `cargo clippy -p rusty-diag --all-targets -- -A clippy::todo -A dead_code`.

## Check

```sh
cargo nextest run -p rusty-diag --no-fail-fast 2>&1 | tail -30
```

## Stop and report

Report: files, test count by group, the check output tail, and every ambiguity or error in this brief with the decision you took.
