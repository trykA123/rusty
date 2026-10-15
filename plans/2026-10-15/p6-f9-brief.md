# P6 · F9 brief: `io_queue` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p6-f9`, branch `p6-f9` (from `p6-fs`). Do not commit; the orchestrator does.

## Goal

Every disk and network share gets its own I/O queue in `rusty-fs`:
- **priorities:** visible work goes before prefetch, and prefetch before idle work;
- **a concurrency limit** per volume;
- **cancel by owner:** dropping the owner cancels its queued jobs.

Write the stubs and the tests that define them. F10 (orchestrator) makes them pass without changing the tests.

The design has two parts:
- **`Scheduler`:** a pure state machine. It has no threads, so its tests are deterministic and proptest can drive it.
- **`IoQueue`:** a thin runner around the scheduler. It starts threads per volume, lazily and never more than the limit, and runs closures.

## Read first

- `plans/2026-10-14-p6-locations-fs.md` (whole); `docs/architecture.md` "I/O queue per volume" and "Runtime and libraries" (no Tokio, D18); `docs/decisions.md` D18, D21.
- `crates/rusty-fs/src/provider/mod.rs` (`CancelToken`), `crates/rusty-core/src/location/` (`Location`, `ProviderPath`, `is_local`).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-fs/src/io_queue/
├── mod.rs        Priority, VolumeKind, VolumeId, OwnerId, JobId, volume_of; re-exports
├── scheduler.rs  Scheduler (stubs)
├── runner.rs     IoQueue, OwnerGuard (stubs)
└── tests/        mod.rs, volume.rs, scheduler.rs, props.rs, runner.rs
```

In `src/lib.rs`, add `mod io_queue;` and a `pub use` for every public item below. Add `crossbeam-channel = "0.5.15"` to `[dependencies]` only if your stubs need it; F10 may add it.

## The API (exact)

```rust
// mod.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Priority { Idle, Prefetch, Visible }            // Ord: Visible is highest

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum VolumeKind { Ssd, Hdd, Network, Removable, Unknown }
impl VolumeKind { pub fn limit(self) -> usize; }          // 8, 1, 4, 2, Unknown 1

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct VolumeId(/* String */);
impl VolumeId { pub fn as_str(&self) -> &str; }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OwnerId(pub u64);
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct JobId(/* u64 */);

pub fn volume_of(location: &Location) -> VolumeId;

// scheduler.rs
#[derive(Debug, Default)]
pub struct Scheduler { /* … */ }
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Cancelled { pub queued: Vec<JobId>, pub running: Vec<JobId> }   // each in push order
impl Scheduler {
    pub fn new() -> Self;
    pub fn set_volume(&mut self, volume: VolumeId, kind: VolumeKind);     // unknown volumes are Unknown
    pub fn push(&mut self, volume: VolumeId, priority: Priority, owner: OwnerId) -> JobId;
    pub fn start_next(&mut self) -> Option<(VolumeId, JobId)>;
    pub fn start_next_on(&mut self, volume: &VolumeId) -> Option<JobId>;
    pub fn finish(&mut self, job: JobId) -> bool;                         // false when not running
    pub fn reprioritise(&mut self, job: JobId, priority: Priority) -> bool; // queued jobs only
    pub fn cancel_owner(&mut self, owner: OwnerId) -> Cancelled;
    pub fn running(&self, volume: &VolumeId) -> usize;
    pub fn queued(&self, volume: &VolumeId) -> usize;
}

// runner.rs
pub type Job = Box<dyn FnOnce(&CancelToken) + Send + 'static>;
pub struct IoQueue { /* Arc<shared state>, Condvar */ }
pub struct OwnerGuard { /* queue handle + OwnerId */ }
impl IoQueue {
    pub fn new() -> Self;
    pub fn set_volume(&self, volume: VolumeId, kind: VolumeKind);
    pub fn owner(&self) -> OwnerGuard;                                     // a fresh OwnerId each call
    pub fn submit(&self, volume: VolumeId, priority: Priority, owner: OwnerId, job: Job) -> JobId;
    pub fn reprioritise(&self, job: JobId, priority: Priority) -> bool;
    pub fn cancel_owner(&self, owner: OwnerId);
    pub fn shutdown(self);                                                 // stops taking work, drops queued jobs unrun, cancels and joins running ones
}
impl OwnerGuard { pub fn id(&self) -> OwnerId; }
impl Drop for OwnerGuard { /* cancel_owner */ }
impl Drop for IoQueue { /* same as shutdown */ }
```

`IoQueue` and `OwnerGuard` are `Send + Sync`. `IoQueue::new` has no parameters, so `Default` is fine too.

## Behaviour

**`volume_of`:**
- a local `X:\…` or `X:` path gives `X:`, with the letter in upper case;
- a UNC path gives `\\server\share`, in lower case;
- a `\\?\X:\…` path gives `X:`, and `\\?\UNC\server\share\…` gives `\\server\share`;
- any other local path (Unix) gives `/`;
- another provider gives `<provider>://`.

**`Scheduler`:**
- **Order:** `start_next_on` takes the queued job with the highest priority, and among equal priorities the oldest. It returns `None` when the volume already runs `limit` jobs or has nothing queued.
- `start_next` does the same across volumes: the highest priority first, then the oldest by push order, skipping volumes at their limit.
- **Limits:** `set_volume` on a busy volume changes the limit for the next start. Running jobs are never stopped. A lower limit only blocks new starts until the count drops below it.
- **`cancel_owner`:**
  - removes that owner's queued jobs and lists them in `queued`;
  - lists its running jobs in `running`, which stay running until `finish`;
  - other owners are untouched.
- **`finish`:**
  - frees a slot;
  - returns `false` on a second call or on a job that is queued or unknown.
- **`reprioritise`:** moves a queued job to the new priority. Its age stays, so it keeps its place among jobs of the new priority by push order.

**`IoQueue`:**
- `submit` queues the job and wakes or spawns a worker for that volume when it is under its limit.
- A worker runs `start_next_on`, runs the job with its own `CancelToken`, calls `finish` and repeats. It exits when the volume has nothing queued.
- `cancel_owner` drops the owner's queued jobs without running them and cancels the tokens of its running jobs.
- Dropping an `OwnerGuard` does the same.
- A job that panics frees its slot. The worker survives, or a new one takes over, and other jobs still run. Use `catch_unwind` in F10; the test only checks the outcome.

## Tests to write

1. **`volume_of`:**
   - `C:\a`, `c:`, `\\Srv\Share\x`, `\\?\D:\x`, `\\?\UNC\srv\share\x`, `/home/admin` and `fake://a/b`;
   - two paths on the same share with different case give the same id.
2. **`Scheduler` unit tests:**
   - priority order;
   - FIFO within a priority;
   - the limit on HDD (1) and SSD (8);
   - `Unknown` by default;
   - `start_next` across two volumes picks the higher priority first;
   - a busy volume does not block another volume;
   - `finish` frees a slot and is `false` twice;
   - lowering the limit while busy;
   - `reprioritise` of a queued job (and `false` for a running one);
   - `cancel_owner` splits queued and running, and leaves other owners alone.
3. **Properties (`proptest`):** random sequences of push, start, finish, cancel, reprioritise and set_volume over 3 volumes and 3 owners. After every step:
   - running ≤ limit on every volume;
   - every started job was the best queued job of its volume at that moment;
   - no job starts twice;
   - a cancelled queued job never starts.
4. **`IoQueue`** (use channels and barriers, never `sleep` for ordering; put a 5 s timeout on every wait so a bug fails instead of hanging):
   - **limit:** an HDD volume with 4 jobs never runs 2 at once, checked with an `AtomicUsize` high-water mark;
   - **parallelism:** SSD runs up to 8 at once, checked with a barrier of 8;
   - **priority:** with the single HDD slot held by a blocking job, queue one idle, one prefetch and one visible job, then release; they run in the order visible, prefetch, idle;
   - **owner drop:** dropping the `OwnerGuard` stops its queued jobs from ever running and cancels the running job's token;
   - **panics:** a panicking job does not stop later jobs;
   - **shutdown:** queued jobs do not run and running jobs see their token cancelled, then `shutdown` returns;
   - `IoQueue: Send + Sync`.

## Rules

- Stubs are `todo!()` only; types are real. One reason to fail per test. Files under 400 lines; tests are exempt. Run `cargo fmt`.
- Run `export CARGO_TARGET_DIR=<targets>/rusty-p6-f9`. Delete any `proptest-regressions/` your runs create.
- `clippy::todo` is denied. Lint with `cargo clippy -p rusty-fs --all-targets -- -A clippy::todo -A dead_code`.
- Do not touch `fake/`, `provider/` or `hostile_names/`; another agent is adding `hostile_names` in parallel. Your `lib.rs` change is only the `io_queue` lines.

## Check

```sh
cargo nextest run -p rusty-fs io_queue --no-fail-fast 2>&1 | tail -30
```

The new tests fail with `not yet implemented`; the existing fake tests still pass.

## Stop and report

Report:
- the files, the test count by group, and the check output tail;
- every ambiguity or error in this brief, with the decision you took.
