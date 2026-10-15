# P8 · O5 brief: `job_engine` Red (with the provider write contract)

Role: `checker` (Opus, high). Worktree: `<worktrees>/rusty-p8-o5`, branch `p8-o5` (from `p8-operate`). Do not commit; the orchestrator does.

## Goal

The job engine runs an `OperationPlan` (P8 O2, `rusty_core::op_plan`) step by step through a provider. While it runs, it:

- reports progress;
- honours cancel;
- records every step in a job log;
- **never leaves a partial file at a target**, even if the process dies mid-copy.

After a crash, the job **resumes** (redo what is not done) or **rolls back** (remove what it copied). Either way it first cleans up its temporary files.

This atom writes the stubs and the tests that define the engine. It also defines the provider **write** contract and the `FakeFs` write side with faults. O6 (orchestrator) makes everything pass without changing the tests. O7 then implements the same write contract for `LocalFs`.

## Read first

- `plans/2026-10-14-p8-poc-operate.md`.
- `docs/architecture.md`:
  - "Safety" → "Destructive operations": temporary name, verify, rename, links never followed;
  - "No corruption": the job journal;
  - "Copy engine".
- `crates/rusty-core/src/op_plan/`: `OperationPlan`, `Step`, `Resolution`, `Conflict`, `Totals`. `crates/rusty-core/src/fs_error/`.
- `crates/rusty-fs/src/`:
  - `provider/`: `Provider`, `CancelToken`, `FsEntry`;
  - `fake/` and its tests: the tree, `FakeOp`, `Fault`, call counters.
- `crates/rusty-store/src/journal/`: the real journal the app will plug in; the engine itself only sees the `JobLog` trait below.
- `~/.agents/rules/rust.md`, `code-quality.md`.

## The API (exact)

```rust
// rusty-fs/src/provider/ops.rs — the write contract (a new trait; Provider stays read-only)
pub trait ProviderOps: Provider {
    fn create_folder(&self, location: &Location) -> Result<(), FsError>;            // fails if anything exists there
    fn copy_file(&self, source: &Location, target: &Location, progress: &mut dyn FnMut(u64), cancel: &CancelToken) -> Result<u64, FsError>;
        // target must not exist; writes it, calling progress(bytes_so_far) at least once per chunk; returns bytes written;
        // on error or cancel the target may be left partial — the engine copies to a temporary name, so this is fine
    fn rename(&self, source: &Location, target: &Location) -> Result<(), FsError>;   // fails if target exists
    fn remove_file(&self, location: &Location) -> Result<(), FsError>;
    fn remove_link(&self, location: &Location) -> Result<(), FsError>;               // removes the link itself, never its target
    fn remove_empty_folder(&self, location: &Location) -> Result<(), FsError>;      // fails if not empty
    fn recycle(&self, location: &Location) -> Result<(), FsError>;
}

// rusty-fs/src/job/mod.rs
pub const TEMP_SUFFIX: &str = ".ferrite-part";          // temporary name = target name + TEMP_SUFFIX, in the target's folder

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StepOutcome { Done, Skipped, Failed }

pub trait JobLog {                                         // the app adapts rusty_store::JobJournal to this
    fn step(&mut self, seq: u32, outcome: StepOutcome) -> Result<(), FsError>;   // must be durable before it returns
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Progress { pub bytes_done: u64, pub bytes_total: u64, pub files_done: u64, pub files_total: u64, pub current: Option<Location> }

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JobOutcome { Done, Cancelled, Failed { seq: u32, error: FsError } }

pub struct JobContext<'a> {
    pub ops: &'a dyn ProviderOps,
    pub log: &'a mut dyn JobLog,
    pub cancel: &'a CancelToken,
    pub progress: &'a mut dyn FnMut(&Progress),
}

pub fn run_job(plan: &OperationPlan, done: &[u32], ctx: &mut JobContext<'_>) -> JobOutcome;
    // runs every step whose seq (its index in plan.steps) is not in `done`; resume = call again with the done seqs
pub fn roll_back(plan: &OperationPlan, done: &[u32], ctx: &mut JobContext<'_>) -> JobOutcome;
    // undoes the done steps it can, in reverse: removes copied targets (CopyFile) and made folders (MakeFolder, if empty),
    // renames Rename steps back; never re-creates removed or recycled sources (logs them as Skipped)
pub fn clean_up(plan: &OperationPlan, done: &[u32], ops: &dyn ProviderOps) -> Result<u32, FsError>;
    // removes the temporary file of every CopyFile step not in `done`, if it exists; returns how many were removed
```

## Behaviour

- **Steps and seq.** A step's seq is its index in `plan.steps`. The engine logs each step through `JobLog::step` immediately after it succeeds (`Done`) or fails (`Failed`), before it starts the next one.
- **`CopyFile`:**
  1. remove a leftover temporary file, if one exists;
  2. `copy_file` from the source to the temporary file;
  3. verify that the temporary file's size (from `metadata`) equals the bytes written and the step's size;
  4. for an overwrite (the target exists), `remove_file` the target, then `rename` the temporary file to the target;
  5. log `Done`.

  If any part fails or is cancelled, remove the temporary file, log `Failed` (cancel logs nothing), and stop. **No step ever leaves a temporary file behind or a partial target.**
- **Conflicts with `Resolution::Ask`.** A step whose target exists when it runs is treated as `Skipped`. It is logged as `Skipped`, and the engine moves on; the ask UI comes in O11. That is the only "target exists" case the engine resolves by itself. For `Overwrite`, the plan already chose and the engine overwrites.
- **Other steps:**
  - `MakeFolder` → `create_folder`; a folder that already exists counts as done (a merge);
  - `Rename` → `rename`;
  - `RemoveFile` → `remove_file`;
  - `RemoveLink` → `remove_link`;
  - `RemoveFolder` → `remove_empty_folder`;
  - `Recycle` → `recycle`.
- **Cancel.** Check the token before each step and during copies (pass it to `copy_file`). When cancelled, return `Cancelled`. The step in progress is not logged and its temporary file is removed.
- **Failure.** The first failing step stops the job with `Failed { seq, error }`. Later steps stay unlogged. That matters for moves: sources are removed only after their copies are done, because the plan orders them that way. Test it.
- **Progress:**
  - report after every step;
  - report during copies with `bytes_done` growing;
  - `bytes_total` and `files_total` come from `plan.totals`;
  - `current` is the step's source or location.
- **`roll_back`.** Undo the `done` steps in reverse order:
  - `CopyFile` → remove the target;
  - `MakeFolder` → remove the folder if it is empty;
  - `Rename` → rename back.

  Recycle and remove steps cannot be undone; log them as `Skipped`.

## `FakeFs` write side (part of this atom)

- `impl ProviderOps for FakeFs`. It works on the in-memory tree and keeps the same rules as the contract: fail when the target exists, links are removed as links, a folder must be empty to be removed.
  - `copy_file` copies the size in chunks of 4 KiB, calling `progress`.
  - **Recycle** moves the entry to a `recycled()` list the tests can read.
- **New fault operations.** Extend `FakeOp` with `Create`, `Copy`, `Rename`, `Remove` and `Recycle`. All write faults use the existing `fault(path, op, on_call, fault)`.
- **New `Fault` variant:** `FailAfterBytes { kind: FsErrorKind, bytes: u64 }`, for `Copy` only. It writes that many bytes to the target, so the target is **partial**, then fails. This is how "disk full mid-copy" and "network lost mid-copy" are simulated.
- **Crash simulation.** A test helper wraps `FakeFs` in an ops object. On a chosen `(path, op)`, it **writes partial data and then returns** a special error the test treats as "the process died". The test then drops the engine state and calls `clean_up` and `run_job` again with the `done` seqs it recorded. Write this helper in the tests; do not put it in product code.
- A test-only `JobLog` that records `(seq, outcome)` and can be told to fail on a chosen seq, to simulate a journal write failure. When the log fails, the job stops with `Failed`.

## Tests to write (`rusty-fs/src/job/tests/`)

1. **Copy:**
   - a file is copied;
   - the progress grows and ends at the totals;
   - every step is logged `Done` in order;
   - no `.ferrite-part` file is left.
2. **Folder tree copy:** the folders are made, the files copied and every step logged.
3. **Faults:** run the job, then check that no temporary file or partial target is left, and that `Failed` names the right seq. Cover each of:
   - `FailAfterBytes(DiskFull)`;
   - `FailAfterBytes(NetworkLost)`;
   - `Fail(Locked)` on the source copy;
   - `Fail(AccessDenied)` on `create_folder`.
4. **Cancel:**
   - cancel before the start;
   - cancel mid-copy, using a progress callback that cancels after the first chunk.

   Both end `Cancelled`, with no temporary file and no partial target.
5. **Overwrite:** the old target is replaced only after the new copy is complete. Fail the copy and check that the old target is intact.
6. **Ask:** a target that exists when the step runs → `Skipped`, and the job continues.
7. **Move across volumes:**
   - when it fails in the middle of the copy part, no source is removed;
   - when it succeeds, every source is removed and links stay (they are not in the plan).
8. **Crash mid-copy and resume:**
   1. the "crash" leaves a partial temporary file;
   2. `clean_up` removes it and returns 1;
   3. `run_job` with the recorded `done` seqs finishes, and the result equals a clean run.
9. **Crash and roll back:** `roll_back` removes the copied targets and the empty made folders, leaving the target folder as it was before.
10. **Journal write failure:** the job stops with `Failed` at that seq.
11. **`FakeFs` ops contract:**
    - each operation succeeds;
    - each fails when the target exists or the folder is not empty;
    - `remove_link` does not touch the link's target;
    - each new fault works.

## Rules

- Stubs are `todo!()` only; the types are real.
- Keep `#![forbid(unsafe_code)]`.
- D31: no panics outside tests.
- Files under 400 lines; tests are exempt. Run `cargo fmt`.
- Run `export CARGO_TARGET_DIR=<targets>/rusty-p8-o5`.
- Lint with `cargo clippy -p rusty-fs --all-targets -- -A clippy::todo -A dead_code`.
- The `FakeFs` write side may be real code instead of stubs, since O6 needs it working to test the engine. If you implement it, its own tests (group 11) must pass. Then say so in the report.
- `typos` must pass on your files.

## Check

```sh
cargo nextest run -p rusty-fs --no-fail-fast 2>&1 | tail -25
```

## Stop and report

Report:
- the files, the test count by group and the check tail;
- whether the `FakeFs` write side is real or stubbed;
- every ambiguity, with the decision you took.
