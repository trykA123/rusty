# Remaining alpha backend work

Status: partial — rename and Rich backend changes verified on Linux; alpha integration and Windows checks remain · Repo: `/mnt/Sabrent/homelab/rusty-backend` · Branch: `backend/rename-undo-safety` · Started: 2026-10-23

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
- D8 — Module prefixes use the existing list setting control and live settings delivery. Keep the model's prefix snapshot through regrouping and selection; reject results built for an older prefix list.
- D9 — Rename logging is off by default. Capture the flag when starting a forward rename. Append one completed batch to `config/rename.log` on the job worker, collapse staging moves into original-to-final pairs, quote paths, and lock the file during append. A logging error reports a warning without changing a completed rename or its undo journal. Failed, cancelled and undo jobs do not append.

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
| L1 | Optional rename log backend | self | high | N3 | log adapter and job tests | done (Linux) | |
| R1 | Companion folder discovery | self | high | — | file hook and sibling tests | done (Linux) | |
| R2 | Configured module prefixes | self | high | R1 | store and model tests | done (Linux) | |

## Done when

- Single-file rename offers journaled undo after a restart, with the batch engine's rollback and identity checks.
- Optional logging and Rich data gaps have explicit implementation and verification status.
- Available gates pass; native Windows and remaining UI work are reported separately.
- All work stays on this branch, with main untouched.

## Backend still open

The current alpha follows D75's four-feature scope. Work below stays unmerged on this branch.

| Phase | Remaining work |
| --- | --- |
| Alpha | P36 X2/X6: incoming external-drop bridge and outgoing drag wiring. X3's right-button drop menu remains integration work. The shell drag adapter and vendored platform hooks already exist. |
| Alpha parity | P41 E4/E5: editable/imported/pasted name lists and copy export, preview row reordering/sorting, and counters per folder for multi-folder sources. The form currently has no edited-name overrides and the preview uses one ordinal across all rows; these need model work as well as command integration. |
| Alpha verification | Native Windows checks for rename/recovery, drag, SCM/UAC/ACL and NTFS/USN; Ctrl+K final review, docs and work-PC measurements. |
| Optional alpha tooling | P43 B1–B3: informational listing, walk and index benchmark harness. These do not block alpha. |
| After alpha | P35: quarantine damaged `ferrite.db` with WAL/SHM and salvage trusted state. Current degraded-mode handling does not implement quarantine. |
| After alpha | D65: retained deletions, 1–7 day expiry, volume quotas, low-space purge, restore, and general copy/move/delete undo. Current hold-aside files live only through a job. |
| After alpha | P43: shared worker pools, cancellation races, per-tab size ownership, volume-aware queues, allocated-size totals, hard-link deduplication and opt-in automatic sizes. Existing I/O priority queues and cache soak tests remain in place. |
| Beta and before 1.0 | P42: folder/content compare and hash cache, text/large/binary diff, read-only Git engines and refs, journaled file/hunk writes, and three-way merge. Folder sync depends on D65 and general undo. |
| Beta | Explicit parallel/large-file copy modes, verification, bandwidth limits, copy profiles and destination rules; terminal providers, network refresh policies and portable-profile detection. Auto copy already supports parallel work. |
| Before 1.0 | Content/attribute search and saved collections, archive operation providers with safe extraction/packing, checksums, properties/ACLs and default-file-manager integration. Archive viewing already exists. |
| Later | Module lifecycle, WASM/Lua extensions, remote providers and automation. |

## Log

- 2026-10-23 — Rechecked code and plans. Alpha backend remains: C1, rename log, sole-companion fallback, module-prefix settings and external drag platform wiring. The previous commit completed identity verification only. Starting with C1.
- 2026-10-23 — Three new single-rename regressions failed first, including headless F2/Ctrl+Z and undo after reopening SQLite. Routing and compatibility changes passed all 52 targeted tests. Added case-insensitive provider and overlapping-job coverage for the full gate.
- 2026-10-23 — Seven companion regressions failed first: sole MDF/MAP lookup, cancellation, real folder enumeration, ambiguity and errors. Implemented a shared lazy scan, two retained candidates per extension, a 100,000-entry cap, head/body limits and provenance. The combined targeted suite passed 57 tests. The gate caught an overly nested test fixture; extracted its folder-name filter without relaxing lint rules.
- 2026-10-23 — Single rename and companion discovery passed `CARGO_BUILD_JOBS=8 nice -n 10 cargo xtask gate`: all 10 steps, 6,979 tests passed, 14 skipped, plus doc tests (167.8 seconds). Native Windows checks remain pending. Main is untouched; no merge, push, deployment or Claude use.
- 2026-10-23 — The new typed-prefix regression and headless live ELF regression failed first. Module settings now reach model builds, regrouping and selection; ELF and MAP update live and name matched configured modules. Updated settings snapshots and completion fixtures for the two new keys without weakening the comment-preservation assertions.
- 2026-10-23 — Both new log behavior regressions failed first. Added the optional profile adapter and worker callback, with nonfatal activity feedback. All 613 targeted settings, Rich model, rename and activity tests pass, including actual append/reopen/concurrent-file tests and live settings-file reload. Full gate and isolated light/dark settings screenshots are running.
- 2026-10-23 — Inspected the Files and module-prefix controls in native Linux gallery screenshots at 1280×720, light and dark, using an isolated headless Cage display. The gate required grouping rename settings, moving profile-hook assembly into its adapter, and separating general setting rows from the field contract. No lint or size limits were relaxed. Windows verification remains pending.
- 2026-10-23 — Logging and module prefixes passed `CARGO_BUILD_JOBS=8 nice -n 10 cargo xtask gate`: all 10 steps, 6,996 tests passed, 14 skipped, plus doc tests (180.1 seconds). No post-alpha feature was started because alpha integration and parity gaps remain. Main stays at ce5af5c9; no merge, push or deployment.
