# Handoff 2026-10-19 18:19 (usage at 90 % of the 5-hour window)

Supersedes handoff-1531. Chat with the owner in Romanian, docs in English, features not atom IDs. Model cap from the owner: at most Opus high and Sonnet high.

Agent and job ids are kept outside the repo (the typos gate flags hex ids): see the session scratchpad file `agent-ids-1819.md` named in the chat; if it is gone, ListAgents shows running agents.

## Done (on origin/main)

- 036212e main pushed: parallel Auto copy + one-step overwrite (A3/A7), three CI flakes fixed, PDF engine (p15-a10a), cache budgets + soak (p18-c7), right-click folder menu + New file Shift+F7 (p17-m8). Main CI green up to af90622; run 39274428497 (036212e) being watched.
- Release alpha-2026-10-19e published from dbb3137 (copy engine, placement, settings Default/Changed, preview browsing, prefetch).
- Roadmap artifact: https://claude.ai/artifact/L4sAzDwLP6vj3pCgGSyjFn (branch `roadmap-update` 4508830 not merged yet).
- Local main 890735a (plan update, not pushed).

## In progress

| Work | Where | State |
| --- | --- | --- |
| Merge p16-b2 (HEX/S-record view, Windows CI green) into main | main checkout | `git merge --no-ff --no-commit p16-b2` staged, keymap count resolved to 249; gate running. If the gate log ends `all 9 steps passed`, commit the merge; then clippy + `cargo test` (standalone), push |
| P33 V1 shared View menu (Alt+V), Ctrl+B/Ctrl+I, Display settings | .crew/rusty-p33-v1, p33-v1 | agent running (Opus high), uncommitted work |
| P15 A10b PDF viewer UI | .crew/rusty-p15-a10b, p15-a10b | agent running (Opus medium), uncommitted work |
| P30 A8 undo of overwrite | .crew/rusty-p30-a8, p30-a8 (3525c9b) | review said fix first (recovery could delete held files after a failed roll-back, missing volume, finish write, rollback order, folder targets, non-empty holding folder); agent applying fixes |
| P16 B3 ELF viewer | .crew/rusty-p16-b3, p16-b3 (9aa0d6c) | review fix first: RAM counted flash on RWX segments, wrong file:line near 0, ARM $t/$d symbols, typing n/p/1/3/5 left the view (decided: always type), Ctrl+G go to address, DWARF caps/cancel; agent applying |
| P16 B6 ASC trace viewer | .crew/rusty-p16-b6, p16-b6 (2d3e493) | review fix first: follow corrupting the partial last line, replaced file, retry loop, errors not in status line, ID cap; agent applying |
| P29 C3 release backtraces | .crew/rusty-api-builder-6h5d1, crew/api-builder-6h5d1 (293fe7f) | done + merged p15-a10a; needs push for Windows CI (checks `ferrite::crash_test` in the record), then merge |
| P30 A5 bench-copy | .crew/rusty-api-builder-6ibvd, crew/api-builder-6ibvd (72775c0) | committed and main merged in; needs push for Windows CI (robocopy numbers in the job summary), then merge |
| P30 A10 planner case twins | .crew/rusty-p30-a10, p30-a10 (1483f9b) | done, gate passed; merge into main after p16-b2 |

## Open questions for the owner

1. Which compiler writes the work `.map` (first lines of it)? `.mot` hints Renesas CC-RH.
2. What is the 389-byte `.mdf`?
3. Shell icons (Lucide vs Windows icons); PC tuning (swappiness) needs approval.
4. P31 owner check on Windows: second monitor at another scale, maximized, undock/redock.

## Next steps, in order

1. alpha-2026-10-19f is published from 036212e (folder zip with pdfium.dll). Finish the p16-b2 merge (above), push main, watch CI, then publish alpha-2026-10-19g with the HEX/S-record view.
2. Merge p30-a10 (gate on main), push.
3. Push C3 and A5 branches for Windows CI (commit first, then `cd <worktree> && ... cargo clippy` and `cargo test` standalone), merge when green.
4. On each agent report: check screenshots, verify against the review items, push branch for Windows CI, merge (merge --no-ff --no-commit, gate, commit). Order: A8 → then start A9 (move overwrite through hold-aside, Opus high); B3 and B6 after p16-b2 is on main; V1 then W1 (main window parts, after V1) and V2; A10b → PDF release.
5. After merges: Sonnet agent edits `design/roadmap.html` in `.crew/rusty-roadmap`; orchestrator republishes the artifact above.
6. Remaining plan items: P30 A4 (copy.mode setting), P22 S3b (upgrade notice + find a setting), P32 Fluent L1, P16 B4 maps (after the owner answers), nextest slow-timeout so a hanging UI test cannot hold the cargo lock for long.
