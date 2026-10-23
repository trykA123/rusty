# Remaining alpha backend work

Status: running · Repo: `/mnt/Sabrent/homelab/rusty-backend` · Branch: `backend/rename-undo-safety` · Started: 2026-10-23

## Goal

Finish remaining backend work in the four-feature alpha before starting later roadmap features. Keep every change isolated from main and record which work still needs UI integration or Windows verification.

## Decisions

- D1 — Continue from `df756b9e` in this worktree. No merge, push or deployment.
- D2 — Use Codex only; any worker runs must use Sol 6.1 high or xhigh. No Claude agents.
- D3 — Alpha work: single-file rename through the journaled batch engine (P41 C1), optional rename log (P41 E7), Rich ELF/MAP sibling discovery and configured module prefixes (P38 D8/D9), then remaining external drag platform integration (P36 X2/X6). Sibling discovery is independent of the rename log.
- D4 — Preserve single-rename validation, cursor behavior, filter behavior and error reporting. Refuse overlapping rename jobs. Create file and create folder retain their existing paths.
- D5 — Existing naming tests encode the removed temporary-name format and wait only for listing I/O. Update those fixtures to the batch planner and wait for jobs too; retain their behavioral assertions.
- D6 — Add no new dependencies. Use the existing planner, journal, settings ledger, file hooks and background execution.
- D7 — Beyond alpha: database quarantine/salvage, delete retention and general undo, shared job pools and folder sizes, compare/Git/merge, and beta copy options. Do not claim alpha complete while its backend items or native verification remain open.

## Components

| Component | Layer | Contract (in → out) | New / change | Test |
| --- | --- | --- | --- | --- |
| Single rename | service | old and new names → validated journaled rename job | change | naming, undo and restart regressions |
| Rename log | adapter | completed rename batch → optional profile log | new | disabled, success, failure and restart cases |
| Sibling discovery | adapter | file and folder candidates → unambiguous companion file | change | same-stem priority, ambiguity, cancellation and bounds |
| Module prefixes | settings and model | configured prefixes → live grouping | change | settings round trip and grouping regressions |

## Atoms

| Atom | Component | Role | Effort | After | Check | Status | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N1 | Single rename plan and routing | self | high | — | failing journal/undo regression, naming tests | done | |
| N2 | Rename failure and cursor compatibility | self | high | N1 | naming and headless undo tests | done | |
| N3 | Docs and gate for single rename | self | high | N2 | full gate and diff review | done (Linux) | |
| L1 | Optional rename log backend | self | high | N3 | log adapter and job tests | ready | |
| R1 | Companion folder discovery | self | high | — | file hook and sibling tests | done (Linux) | |
| R2 | Configured module prefixes | self | high | R1 | store and model tests | blocked | |

## Done when

- Single-file rename offers journaled undo after a restart, with the batch engine's rollback and identity checks.
- Optional logging and Rich data gaps have explicit implementation and verification status.
- Available gates pass; native Windows and remaining UI work are reported separately.
- All work stays on this branch, with main untouched.

## Log

- 2026-10-23 — Rechecked code and plans. Alpha backend remains: C1, rename log, sole-companion fallback, module-prefix settings and external drag platform wiring. The previous commit completed identity verification only. Starting with C1.
- 2026-10-23 — Three new single-rename regressions failed first, including headless F2/Ctrl+Z and undo after reopening SQLite. Routing and compatibility changes passed all 52 targeted tests. Added case-insensitive provider and overlapping-job coverage for the full gate.
- 2026-10-23 — Seven companion regressions failed first: sole MDF/MAP lookup, cancellation, real folder enumeration, ambiguity and errors. Implemented a shared lazy scan, two retained candidates per extension, a 100,000-entry cap, head/body limits and provenance. The combined targeted suite passed 57 tests. The gate caught an overly nested test fixture; extracted its folder-name filter without relaxing lint rules.
- 2026-10-23 — Single rename and companion discovery passed `CARGO_BUILD_JOBS=8 nice -n 10 cargo xtask gate`: all 10 steps, 6,979 tests passed, 14 skipped, plus doc tests (167.8 seconds). Native Windows checks remain pending. Main is untouched; no merge, push, deployment or Claude use.
