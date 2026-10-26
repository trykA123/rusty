# Rebase beta retention onto released alpha

Status: done · Repo: backend worktree · Branch: `backend/beta-retention-on-main` · Started: 2026-10-26

## Goal

Keep beta recovery and retention on current main, preserving FAT/exFAT rename fallback and drag behavior.
Remove machine-specific paths from public review reports and plans.

## Decisions

- D1 — Owner approved branching from `2294facb`; `backend/beta-recovery-retention` stays untouched.
- D2 — Replay only seven beta commits after `b75cd273` onto fetched `origin/main` at `e077fb5a`.
- D3 — Keep main's FAT/exFAT filesystem checks, fingerprint kind/size/time comparison, exact one-hour tolerance and journal v2. Keep native and Windows-index identity domains distinct.
- D4 — Share the identity type through core; construct fingerprints from size, optional modification time and folder kind without filesystem dependencies.
- D5 — Keep retained-copy ownership/recovery, V7 and the B1–B5 activation boundary. V8 stays parked.
- D6 — Preserve released alpha changelog, Navo roadmap priority, drag auto-scroll and hover-open behavior.
- D7 — Wait for other Cargo/rustc processes before every Cargo invocation. Use nice 10 and eight build jobs. Run affected checks, then the actual repository gate once.
- D8 — Implement directly; only the existing Sol 6.1 xhigh reviewer may review. No push or merge.

## Components

| Component | Layer | Contract | Change | Check |
| --- | --- | --- | --- | --- |
| identity | core | metadata fields → fingerprint | shared beta type plus alpha fingerprint | serialization and comparison tests |
| provider/rename | filesystem | missing stable ID → checked fallback | preserve main behavior | rename and FAT classification tests |
| identity journal | app | v1/v2 bytes → typed identity | keep v2 with reusable beta decoder | journal reopen/recovery tests |
| public notes | documentation | local notes → publishable notes | remove machine-specific paths | tracked-file scan |

## Atoms

| Atom | Component | Role | Effort | After | Check | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | rebase | main | high | — | seven beta commits on main, original ref unchanged | done |
| A2 | identity integration | main | high | A1 | affected checks and regressions | done |
| A3 | public notes | main | medium | A1 | no machine-specific paths in reports/plans | done |
| A4 | validation | main + reviewer | xhigh | A2–A3 | affected checks, full gate once | done |

## Done when

The new branch descends from fetched main and retains all beta commits. Main's rename and drag behavior remains present.
Affected checks and the full gate pass. Public notes contain no machine-specific paths. The original beta ref stays unchanged.

## Log

- 2026-10-26 — Created the new branch from `2294facb`, fetched main and rebased seven beta commits onto `e077fb5a`.
- 2026-10-26 — Resolved changelog, roadmap, provider operations and app identity decoder conflicts. Combined fingerprint fallback and journal v2 with the shared core identity and retained-copy APIs. Filesystem-name checks remain ahead of native-ID queries.
- 2026-10-26 — Removed machine-specific paths from sixteen public review/plan documents. Historical results remain recorded; evidence locations use plain wording.
- 2026-10-26 — Affected Clippy passed across six crates. All 744 selected identity, rename, retention, ownership, recovery and drag tests passed. Expanded a promotion-domain fixture for fingerprints after its two-domain match failed compilation. Shared serialization regression passed.
- 2026-10-26 — Sol 6.1 xhigh read-only review found no actionable rebase issue. Fingerprint fallback stays isolated from retained proofs; journal v1/v2 and one-hour tolerance remain intact. Reviewed drag files match fetched main.
- 2026-10-26 — Actual `cargo xtask gate` ran once and passed all ten steps in 245.5 seconds: 7,361 tests passed, 17 skipped, plus doc-tests. Three orchestration probes waited for another Cargo/Nextest process and then passed. The temporary guard excluded its own process tree and checked external builds before every Cargo invocation; nice 10 and eight build jobs applied throughout.
- 2026-10-26 — Final public-note scan has no machine-specific paths. Main drag implementation and tests match fetched main; original beta ref remains `2294facb`. Verification logs, range-diff and review evidence stay in the local evidence folder. Native Windows FAT/exFAT execution remains pending. No push or merge.
