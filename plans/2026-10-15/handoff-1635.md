# Handoff · 2026-10-15 16:35 (Europe/Bucharest)

Replaces `handoff-1225.md` and `handoff-1139.md` (their rules still hold). Auto-compact now triggers at 600K tokens (`autoCompactWindow` in the user settings, owner request).

## Where things are

- **`main` at `52cad02`, pushed.** Holds P1–P11 plus docs:
  - P8 PoC 2 (copy, move, recycle, Shift+Del, job journal) — owner tested OK on the work PC.
  - P9: quick filter as you type, mouse side buttons and Alt+←/→, finished job rows hide (failed rows have Dismiss), links to files are not opened as folders.
  - P10: F2 / Shift+F6 rename, F7 new folder, `check_name` in the core.
  - P11: Num+ / Num− select by pattern, Num* inverts, sort by column (header click, Ctrl+F3 name, F4 ext, F5 date, F6 size).
  - D38 (users add viewer languages as WASM tree-sitter packages) and the roadmap item.
  - CI for `52cad02` is run 38742814494; its artifact is the exe to give the owner for P9–P11.
- **`p12-view-edit` at `561f5eb`, pushed** (round 2 fixes included; this handoff is committed on top) (worktree `<worktrees>/rusty-p12`, target dir `<targets>/p10`):
  - F4 opens files in the editor the owner picks (saved as `[editor] path` in `ferrite.toml`); Shift+F4 changes it.
  - F3 built-in viewer/editor (gpui-kit code editor, 34 tree-sitter grammars, Ctrl+F find and replace, Ctrl+S safe save). D37: exe limit 60 MB.
  - `ferrite --view <file>` opens the viewer directly.
  - Review round 1 FAIL, round 2 PASS WITH FIXES; all fixed (see `plans/2026-10-15-p12-view-edit.md`). Windows CI on `561f5eb` was running at compaction (background watcher). When it passes: merge into `main` (merge commit; `main` has docs commits), push, delete the branch and worktree, delete `targets/p10`, then run the Haiku roadmap brief "F3 viewer and F4 editor are done, from plan P12" (Beta item "External viewer and editor").
- The main checkout is write-protected for this background session (bgIsolation): edit files in a worktree; git commands in the main checkout still work.

## Owner preferences learned today (also in memory)

- Roadmap: after each finished piece, a Haiku 5.5 agent (`isolation: worktree`) updates `design/roadmap.html` and `docs/roadmap.md` from a one-line brief "X is done, from plan Y"; cherry-pick its commit onto `main` and republish https://claude.ai/artifact/EMV6xF23ELbUZ7xU1einmY (memory `roadmap-haiku-updates`).
- Free/open-source cross-platform dependencies are welcome; the exe may grow; a portable folder with `ferrite.toml` next to the exe is fine (memory `deps-welcome`).
- Disk: `<disk>` filled to 100 % from Rust caches today; delete a worktree's target dir when its branch closes (memory `rusty-workflow-pitfalls`).

## Next (suggested order)

1. Finish P12 and send the owner the exe link with F2–F4, sorting and Num keys to test.
2. Owner asked why binary and large files are refused in F3: offered a hex viewer for binaries and a large-file read-only mode (only the visible part loaded, with search). Waiting for the owner's go.
3. Remaining Alpha items (roadmap at 40 %): drive bar and network drives, native context menu, pins, Ctrl+K palette, keymap in TOML, Explorer clipboard, "who locks the file", command line, copy Auto mode, shell icons, right-drag selection, free pane splitting, Fluent strings.
4. Deferred: settings writes through `toml_edit` (keep comments); no-replace rename in `LocalFs` (`MoveFileExW` without replace); a confirm dialog over a prompt drops typed text; dead keys / IME in the quick filter; closing mid-job blocks the UI up to 10 s; overwrite in copies needs an atomic replace first (P8 G8 #5, #6).
