# Handoff 2026-10-20 01:35 (usage at 90 % of the 5-hour window)

Supersedes handoff-1819. Chat with the owner in Romanian, docs in English, features not atom IDs. Model cap from the owner: at most Opus high and Sonnet high; implementers on Sonnet medium/high, reviews on Opus. Agent ids stay out of the repo (the typos gate flags hex ids); they are in the session scratchpad file `agent-ids-1819.md`, and ListAgents shows running agents.

## Done (on origin/main, 3544551)

- Merged and pushed since handoff-1819: ELF view (p16-b3), CAN trace ASC view (p16-b6), crash file:line (p29-c3), TASKING map reader (p16-b4a), PDF viewer (p15-a10b), View menu Alt+V and shared Ctrl+B/Ctrl+I drawers (p33-v1), bench-copy (p30-a5), undo of an overwrite (p30-a8, five review rounds), move over a file through hold-aside (p30-a9), copy.mode setting with Auto in parallel in the app (p30-a4), TASKING linker map view (p16-b4b).
- Releases: alpha-2026-10-19h (107ada1, ELF), alpha-2026-10-19i (b591839, PDF + ASC), alpha-2026-10-20a (55b0a71, View menu + undo of overwrite), alpha-2026-10-20b (377af49, copy mode + move with overwrite). The zip now holds ferrite.exe, pdfium.dll, ferrite.pdb and licenses.
- Roadmap artifact republished (version 2): https://claude.ai/artifact/L4sAzDwLP6vj3pCgGSyjFn (branch `roadmap-update` 3bba6d8, not merged; docs only).
- Merged worktrees, branches (local and remote) and their `.crew/targets/<id>` caches removed; disk 516 GB free.

## In progress

| Work | Where | State |
| --- | --- | --- |
| Main CI for 3544551 (map view) | GitHub Actions | green; alpha-2026-10-20c published (download checked, 200) |
| P33 W1 main window parts (`[window.view]`, window View menu, Display Window group) | .crew/rusty-p33-w1, branch p33-w1 (from 55b0a71) | Agent done: committed 064d5de, gate passed (4975 tests). Window View menu on Alt+V and a View button in the title bar; hidden Ext/Size/Date sort shows "Name by Size ↓"; also fixed settings scroll-to-row with group headings. Screens `design/screens/p33-w1-*.png`; older gallery screenshots now stale (View button). Next: look at screenshots, Opus medium review, fixes, merge main in, gate, push for Windows CI, merge |
| P15 A2b encoding picker, paged single-byte/UTF-16 rows, mixed line endings editable | .crew/rusty-p15-a2b, branch p15-a2b (from 377af49) | Agent done: committed 3ef45b2, gate passed (5018 tests). Picker on the header button, Ctrl+Shift+E and Alt+V → "Encoding…"; big UTF-16/cp125x open as paged text; mixed endings editable with per-line endings kept. Risks: large-file detection reads 64 KB only; multi-byte paged cuts may show �; UTF-16 search folds ASCII only. Screens `design/screens/p15-a2b-*.png`. Same next steps as W1 (both touch the View menu, so merge one, then merge main into the other) |

## Open questions for the owner

1. Copy safety vs speed: every copied file is flushed to disk before it is journaled, so robocopy is about 20× faster on 200 × 5 MiB in CI (P30 Log, 2026-10-19). Keep the per-file flush, flush in batches, or flush only at the end of the job?
2. The work `.map` (TASKING) and `.mdf`: try the map view in alpha-2026-10-20c; the files must not be committed (public repo).
3. Earlier: shell icons, PC tuning approval, P31 second-monitor check.

## Next steps, in order

1. Done: alpha-2026-10-20c published from 3544551.
2. On each agent report (W1, A2b): look at the screenshots, Opus medium review, fixes by a fresh narrow Sonnet agent, merge main in, gate, standalone clippy + `cargo test`, push for Windows CI, merge, clean worktree/branch/target, release.
3. Roadmap: a Sonnet agent updates `design/roadmap.html` in `.crew/rusty-roadmap` (map view done; copy mode; move with overwrite; W1/A2b when merged); the orchestrator republishes the artifact.
4. Next atoms: P22 S3b (upgrade notice + find a setting), P33 V2 (markdown/preview parts), P32 Fluent L1, P16 B5/B6b/B7 after the owner's files.
5. Owner's real map: validate the parser on it locally (never commit it), fix what it shows.
