# P8 · PoC 2: Operate

Status: drafting (briefs get exact `Read` ranges when G7 passes) · Branch: `p8-operate` · After: G7

## Goal

**PoC 2.** Rusty changes files safely: F5 copy, F6 move, F8 to the Recycle Bin and Shift+Del with a warning, each planned first, run in the background with progress and cancel, and recorded in a journal that survives a crash.

## Decisions

- D7 (Recycle Bin, Shift+Del warning), D22 (copy engine; this plan ships Standard and Auto), architecture "Safety" and "Copy engine".
- Plans are pure data built in `rusty-core`; the job engine in `rusty-fs` executes them through providers.
- Copies go to a temporary name, are verified by size, then renamed. A same-volume move is a rename.
- The journal lives in `rusty.db` tables `job` and `job_step`, one committed row per step.

## Components

| Component | Layer | Contract | Test |
| --- | --- | --- | --- |
| `op_plan` | lib (core) | sources, target, conflict policy → `OperationPlan` (steps, totals, conflicts, risk flags) | unit + proptest: totals match steps; protected locations flagged |
| `job_journal` | adapter (store) | append step, mark done, list unfinished | unit + crash fixture |
| `job_engine` | service (fs) | run a plan on the I/O queue; progress events; cancel; resume from the journal | integration on `fake_fs` with faults |
| `copy_standard` | adapter (fs) | one file: `CopyFile2` on Windows, `std::fs::copy` with temp name on Linux | integration; Windows job |
| `copy_auto` | service (fs) | parallel by drive type, unbuffered above the threshold | integration; benchmark |
| `recycle` | adapter (shell) | `IFileOperation` with recycle flags; Linux `trash` crate for development | integration on Windows CI |
| `confirm_dialog`, `job_row` | ui | permanent-delete warning (count, size, first paths, Enter not default); progress row | headless |
| `op_wiring` | app | F5, F6, F8, Shift+Del → commands → plan → confirm → job | end-to-end on `fake_fs` |

## Atoms

| Atom | Component | Tier | Role | Effort | After | Check |
| --- | --- | --- | --- | --- | --- | --- |
| O1 | `op_plan` Red | T2 | checker | high | G7 | tests compile, fail |
| O2 | `op_plan` Green | T4 | orchestrator | high | O1 | `cargo nextest run -p rusty-core op_plan` |
| O3 | `job_journal` Red | T2 | checker | high | G7 | tests compile, fail |
| O4 | `job_journal` Green | T3 | api-builder | xhigh | O3 | `… journal` |
| O5 | `job_engine` Red | T2 | checker | high | O2, O4 | tests compile, fail (faults: disk full, locked, network lost, crash mid-copy) |
| O6 | `job_engine` Green | T4 | orchestrator | high | O5 | `… job_engine`; no partial target after any fault |
| O7 | `copy_standard` | T3 | api-builder | xhigh | O6 | integration on Linux and Windows CI |
| O8 | `copy_auto` | T3 | api-builder | xhigh | O7 | integration + first benchmark numbers |
| O9 | `recycle` | T3 | api-builder | xhigh | O6 | Windows CI: file lands in the Recycle Bin |
| O10 | `confirm_dialog`, `job_row` | T2 | ui-builder | high | G7 | headless tests pass |
| O11 | `op_wiring` | T3 | api-builder | xhigh | O8, O9, O10 | end-to-end tests pass |
| O12 | PoC check on Windows | — | orchestrator | — | O11 | owner copies, moves and recycles on the work PC |
| G8 | gate | — | orchestrator + reviewer | high | O1–O12 | gate, CI on both OS, review, **PoC 2 demo** |

O1–O2, O3–O4 and O10 run in parallel.

## Done when

- A copy killed halfway leaves no partial file at the target and resumes or rolls back on the next start.
- Shift+Del shows the warning and nothing is deleted when it is dismissed.
- The owner copies, moves and recycles files on the work PC with progress and cancel.
