# P8 · O3 brief: `job_journal` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p8-o3`, branch `p8-o3` (from `p8-operate`). Do not commit; the orchestrator does.

## Goal

The job journal records every copy, move, recycle and delete, one committed row per step. After a crash, the next start finds unfinished jobs and resumes or rolls them back.

It lives in `ferrite.db` (the `rusty-store` `Db`, tables `job` and `job_step`, which exist since migration V1). Write the stubs and the tests that define it. O4 (orchestrator) makes them pass without changing them.

## Read first

- `plans/2026-10-14-p8-poc-operate.md`; `docs/architecture.md` "No corruption" (the job journal row).
- `crates/rusty-store/src/db/` (`Db::open`, `open_in_memory`, migrations V1: `job`, `job_step`), `src/lib.rs`.
- `~/.agents/rules/rust.md`, `code-quality.md` "Tests".

## Files

```text
crates/rusty-store/src/journal/
├── mod.rs     JobJournal and types (stubs)
└── tests.rs   (or tests/ with mod.rs)
```

Add `mod journal;` and `pub use journal::{…}` to `src/lib.rs`.

## The API (exact)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct JobId(pub i64);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JobState { Running, Done, Failed, Cancelled, RolledBack }   // stored as lower-case text

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StepState { Pending, Done, Failed, Skipped }                // stored as lower-case text

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JournalStep { pub seq: u32, pub state: StepState, pub detail: Option<Vec<u8>> }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnfinishedJob { pub id: JobId, pub kind: String, pub plan: Vec<u8>, pub created_at: i64, pub steps: Vec<JournalStep> }

#[derive(Debug, thiserror::Error)]
pub enum JournalError {
    #[error(transparent)] Db(#[from] DbError),
    #[error(transparent)] Sqlite(#[from] rusqlite::Error),
    #[error("unknown job {0:?}")] UnknownJob(JobId),
    #[error("unknown step {seq} of job {job:?}")] UnknownStep { job: JobId, seq: u32 },
    #[error("bad state text {0:?}")] BadState(String),
}

pub struct JobJournal { /* owns a Db */ }
impl JobJournal {
    pub fn new(db: Db) -> Result<Self, JournalError>;      // sets PRAGMA synchronous = FULL on its connection
    pub fn create_job(&mut self, kind: &str, plan: &[u8], steps: u32, created_at: i64) -> Result<JobId, JournalError>;
        // one transaction: the job row (state running) and `steps` step rows 0..steps (state pending)
    pub fn mark_step(&mut self, job: JobId, seq: u32, state: StepState, detail: Option<&[u8]>) -> Result<(), JournalError>;
        // one committed transaction per call
    pub fn finish(&mut self, job: JobId, state: JobState) -> Result<(), JournalError>;
    pub fn unfinished(&self) -> Result<Vec<UnfinishedJob>, JournalError>;   // jobs still `running`, oldest first, steps by seq
    pub fn prune(&mut self, keep_finished: u32) -> Result<u32, JournalError>; // delete finished jobs beyond the newest N; returns how many were deleted; never deletes running jobs
}
```

## Behaviour

- Each write is **committed** before it returns.
- A job that is not `running` is never listed by `unfinished`.
- Marking a step of an unknown job gives `UnknownJob`; an out-of-range seq gives `UnknownStep`. Neither writes anything.
- Marking a step more than once keeps the last state and detail.
- An unknown state text in the database gives `BadState`. Insert one by hand through `Db::connection()` in the test.
- `prune` deletes the steps with their job (`ON DELETE CASCADE`). Enable `PRAGMA foreign_keys = ON` in `new`, and test that it is on.

## Tests to write

1. **Create:**
   - the job and its steps exist;
   - the steps are `pending`;
   - the job is `running`;
   - the plan bytes come back unchanged;
   - two jobs get different ids.
2. **Mark:**
   - `done`, `failed` and `skipped` with detail;
   - marking twice;
   - an unknown job;
   - an unknown step.
3. **Finish:** `unfinished` lists only running jobs, oldest first, with their steps in order.
4. **Crash fixture**, with a real file in `tempfile::tempdir()`:
   1. create a job with 5 steps;
   2. mark 3 of them done;
   3. drop the journal without a clean close, using `std::mem::forget` on it;
   4. reopen the file with `Db::open(path, true)`, which also runs the integrity check, and `JobJournal::new`;
   5. `unfinished` shows the job with exactly 3 done and 2 pending steps.
5. **Prune:**
   - keeps the newest N finished jobs;
   - never touches running jobs;
   - the step rows of pruned jobs are gone.
6. **Settings:**
   - `PRAGMA synchronous` reads 2 (FULL);
   - `PRAGMA foreign_keys` reads 1;
   - a `BadState` row is reported.

## Rules

- Stubs are `todo!()` only; the types are real. One reason to fail per test. Files under 400 lines; tests are exempt. Run `cargo fmt`.
- Run `export CARGO_TARGET_DIR=<targets>/rusty-p8-o3`.
- Lint with `cargo clippy -p rusty-store --all-targets -- -A clippy::todo -A dead_code`.
- `typos` runs in the gate. Change any flagged test string; never add exceptions.

## Check

```sh
cargo nextest run -p rusty-store journal --no-fail-fast 2>&1 | tail -20
```

## Stop and report

Report:
- the files, the test count by group and the check tail;
- every ambiguity, with the decision you took.
