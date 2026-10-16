# Handoff 2026-10-16 10:35 (Europe/Bucharest)

The five-hour usage window is at 90%. The owner is at work, testing on a Windows laptop. Speak to the owner in Romanian and in features, never plan or atom codes.

Paths: `<worktrees>` = the `.crew` folder next to the repo; `<targets>` = `<worktrees>/targets`.

## Done today (on main)

- **origin/main = 634f4e4.** Windows CI on it is **red**: one Windows-only test, `send_to_fills_within_the_budget` (run 38863774532), took 8.2 s. The cause is that the submenu fill blocks past its budget. The fix is running (see below).
- **Local main = 747b2ad, 7 commits ahead of origin, not pushed.** It adds:
  - P19 L2+L3 (merge 143433a): cards on Mica, a drive pill with a dropdown, `+` and Ctrl+T, keycap F-key pills with modifier layers.
  - The A7c plan line (0f98eb9).
  - The gate passed locally on 143433a.
- **Merged and pushed today:**
  - A5b, A6, A5c, A8.
  - Owner test fixes.
  - P17 M1 spike, M2 model, M3 provider, M4 component.
  - P18 C1 cache, C2 cache in panes, C9 native Windows listing.
  - P15 A7 tree and table, with Markdown held back (634f4e4).
  - P19 L1 tokens.
- **Releases:**
  - alpha-2026-10-16, 16b, 16c (green CI).
  - **alpha-2026-10-16d, published by mistake from the red run 38863774532.** The binary built fine, and the failing test covers unwired code. The owner was told and asked whether to delete it; no answer yet. Lesson saved in memory (exe-releases).
- **Roadmap artifact** v13 published (48%): https://claude.ai/artifact/EMV6xF23ELbUZ7xU1einmY
- **Decisions recorded:** D44 (exe size free, CI guard 160 MiB), D45 (viewer picks), D46 (context menu), D47 (Markdown preview while editing), D48 (PDF: PDFium DLL in a helper process).
- **Prototypes** now live in `design/prototypes/`.
- **Known bugs:** `docs/bugs.md`. Follow on Windows is parked by the owner; Enter in an archive has not reproduced.

## In progress

| Agent id | Role | Worktree / branch | Doing |
| --- | --- | --- | --- |
| a24f78cde4549c642 | general-purpose, Opus high | `<worktrees>/rusty-p17-m3b`, p17-m3b (9278d35 at handoff) | Shell submenu fill answers within 250 ms (Loading) and finishes in the background. May push p17-m3b and run Windows CI twice. This makes main green again. |
| a1f6e2b2638faa9d5 | ui-builder-high | `<worktrees>/rusty-p15-a7c`, p15-a7c (from 747b2ad) | Own Markdown renderer: pulldown-cmark into flat blocks, a virtualised view, all old probes under 1 s. |

- No background shell jobs.
- `<worktrees>/rusty-p15-a7` (p15-a7, 3bbda58) is kept only as a reference for the old Markdown attempt. Do not merge it. Delete the branch and worktree after A7c merges.

## Open questions for the owner

1. Done: alpha-2026-10-16d deleted with its tag at the owner's request (10:40). The next release is 16e.
2. Enter in an archive showing "A folder…": the owner will test at the office and report.
3. Share timing and entry count against Explorer: the owner will report from the office (use 16e, since 16d is gone).

## Next steps, in order

1. **M3b report:**
   - check the diff and both Windows runs;
   - merge p17-m3b into main;
   - run the gate, then clippy and test unpiped;
   - push.
   - CI must be green, checked with `gh run view <id> --json conclusion -q .conclusion` = `success`.
   - Only then publish alpha-2026-10-16e (new look plus the fix).
2. **A7c report:**
   - run a reviewer (Opus high) with the five old probe lists;
   - merge on PASS;
   - then A7b (Markdown live preview, D47).
3. **P17 M5:** wire the context menu to the long right-click, the Menu key and Shift+F10. Use the Ferrite actions; the UI polls `Pending` with `wait_timeout`, restores focus, and calls `context_menu::bind_keys` in init.
4. **P18:**
   - C3 watchers;
   - C5 network offline state;
   - C6 disk cache;
   - C7 budgets and soak test;
   - C4 prefetch.
5. **P19:**
   - L4 copy card and pill;
   - L5 app menu tiles;
   - L6 settings sheet;
   - P15 A5d viewer chrome (D45).
6. **P15:**
   - A10 PDF (D48);
   - A4b rule lexer wiring;
   - A2b encoding picker;
   - xlsx/xls/ods as a table (proposed to the owner, not decided);
   - A9 review.
7. **After each finished piece:** a Sonnet medium agent updates `design/roadmap.html` in plain feature terms; review it, commit, republish to the roadmap URL.
