# Handoff 2026-10-16 21:14 (Europe/Bucharest)

The five-hour usage window is at 90%. Speak to the owner in Romanian, in plain feature terms, never in plan or atom codes.

Paths: `<worktrees>` is the `.crew` folder next to the repo; `<targets>` is `<worktrees>/targets`.

## Done since handoff-1703

main = de48a30, pushed. Windows CI is green on 36d4aec (run 38941935149); de48a30 adds only a roadmap commit and a cache race fix on top.

- **Merged:**
  - P17 M7b: viewer copy and go-to actions.
  - P17 M6: review and fixes (p17-m6-fixes; CI 38937246695 green):
    - the Windows menu refuses names Win32 would rewrite;
    - viewer right-click targets the clicked row or cell;
    - Retry resends a failed submenu;
    - dropped opens are cancelled;
    - Linux shows only Ferrite actions;
    - long-press marks the pressed row;
    - Copy value is bounded.
  - Confirm and prompt dialog keyboard focus.
  - Diagnostics log layer: logs in `<data>/logs`, `FERRITE_LOG`.
  - P19 L4b: pause and resume; review PASS.
  - P18 C6: disk listing cache for open-tab folders; review fixes in.
  - fix-c6-flush-race (d36aa7d): the writer marks itself loaded only after its file opens; this removed a flaky test.
- **Releases (all green, zip HTTP 200):** alpha-2026-10-16k, l and m. **16m** is the latest (36d4aec).
- **Roadmap:** v16, 63%, at https://claude.ai/artifact/EMV6xF23ELbUZ7xU1einmY (commit ec1491d).
- **Linux local binary:** reinstalled from 0e8f951 at `~/.local/opt/ferrite/ferrite`. It does not contain C6 or the menu fixes yet.
- **Memory:** the MEMORY.md index line now says the roadmap uses Sonnet.

## In progress

| Agent id | Role | Worktree / branch | Doing |
| --- | --- | --- | --- |
| a3fb5133e0b7b5249 | ui-builder-high, Opus high | `<worktrees>/rusty-p19-l6`, p19-l6 (78771a5) | **L6 settings sheet, review fixes.** Done so far: the toml_edit in-place save (decision B) and the sheet, Ctrl+,. Being fixed now: CRLF/BOM kept; Sort/Descending/Folders first/Show system live; other rows "Not applied yet"; failed saves never lost; Ctrl+, in the viewer does nothing; undo of an absent key removes it; drive menu and path editor closed; F3 waits for the save; `.bak` once per session; stale comment; tests. The fade under reduced motion is accepted. |
| a6d0644ac39850639 | ui-builder-high, Opus high | `<worktrees>/rusty-p15-a7b`, p15-a7b (4c16a15) | **A7b Markdown live preview** in the editor (split, Ctrl+Shift+V, remembered per extension in session storage, not ferrite.toml), and the table column fix (min-content, sideways scroll, a wider text column). |
| a8ec5cabde2fcd20a | reviewer, Opus high | read-only on p18-c5 (be707d5) | **Reviewing C5**, the offline state. It is asked to judge the worker's choices (a) no stacked retries, (b) network errors keep a tab offline, and (c) an early network error uses the old error path (I lean towards showing cached as Offline when a cache exists). |

- C5 itself is finished: be707d5, gate green, not merged. Send the review fixes back to agent aeeb96a5e54a3e633 (SendMessage), then merge.
- There are no background shell jobs. main has no uncommitted work.
- Stale target dirs from older days (`a7-review`, `p15-a2-probe`, `p15-a4-udlcount`, `p15-a5-mut`, `p15-a7`, `p15-a7-probe`, `gate.err`, `gate2.txt`, `main-gate.log`) were not created this session. Check them before removing.

## Open questions for the owner

1. Test alpha-16m on Windows: pause/resume on a large copy (also on the share), dialog Tab/arrows, the F3 right-click per kind, start-up from cache.
2. Earlier ones are still open: 16h auto refresh after Extract here; 16g context menu Windows items; preview performance on the share; Enter-in-archive steps.

## Next steps, in order

1. When the C5 review arrives: send the fixes to the C5 agent, verify them, merge and push.
2. When the L6 fixes arrive: verify them (screenshots, gate), optionally run a short re-review of the store patch, merge and push. Mark P19 L6 done. Then L7, the P19 review.
3. When A7b arrives: run a reviewer (Opus high), apply the fixes, merge. Mark A7b done in P15, and the markdown table bug in docs/bugs.md fixed.
4. Watch Windows CI on main after each push. Release alpha-2026-10-16n (or 17a) in one `&&` chain gated on `conclusion == success`, then verify the zip returns 200.
5. Rebuild and reinstall the Linux binary: `CARGO_TARGET_DIR=<targets>/linux-release cargo build --release -p rusty-app`, then install it atomically into `~/.local/opt/ferrite/ferrite`.
6. Roadmap: Sonnet medium after the next merges, then republish.
7. P20: K2 command names → K3 keymap as data → K4 user keymap.toml → K5 shortcuts page → K6 review. Start after L6 merges, since L6 added Ctrl+,.
8. P18: C4 prefetch, then C7 budgets and the soak test, then C8 review.
9. P15: A5d viewer chrome, A10 PDF, A4b, A2b. In P19, L7 review.
10. Bugs: Follow on Windows (parked), Enter in archive (waiting on the owner), the editor built on the UI thread, Find selection and Copy path:line in the paged view (from the M6 review), and the pause tests re-checking the part size (L4b review nice-to-have).
