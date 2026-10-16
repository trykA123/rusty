# P17 · Context menu drawn by Ferrite

Status: ready · Repo: `<repo>` · Branch: `p17-mN` per atom · Started: —

## Goal

A long right-click, the Menu key or Shift+F10 opens the Windows context menu for the selection, drawn in Ferrite's own style (D46). Typing filters every command, including submenu items. Ferrite's actions sit on top. Shell extensions (7-Zip, Notepad++, Git, Defender) work as in Explorer.

## Decisions

- **D1 — Shape (D46).** Variant 1 filter list; section headers (Ferrite, then Windows groups) when the filter is empty; a "More" fold for rare verbs; cascading submenus; a "Classic menu" entry falls back to the native menu.
- **D2 — Opening (D15).** Long right-click (about 400 ms), the Menu key, Shift+F10. A short right-click still selects.
- **D3 — One STA thread owns the shell.** All COM calls (`IContextMenu`, `IContextMenu2/3`, `IExplorerCommand`, invoke) run on one dedicated single-threaded-apartment thread with a hidden message window. The UI never blocks on it; requests and results cross by channel.
- **D4 — A plain model in between.** The provider returns a `ShellMenu` tree: id, text, access key, icon as RGBA, state (enabled, checked, default), submenu (filled or lazy), group hint. The UI filters and draws only this model, so the component is tested headless with a fake.
- **D5 — Lazy submenus.** Build the menu with `CMF_SYNCCASCADEMENU` so "Send to" and similar fill during `WM_INITMENUPOPUP` (54–134 ms in M1); without it they fill on a shell thread while messages are pumped. An unfilled submenu is one item with blank text: treat it as Loading. Fill in the background when the menu opens, with a 250 ms budget per submenu; a slow handler is skipped quietly and its items appear when it answers. Extended verbs (Shift set) stay off for the default view.
- **D6 — Owner-drawn items.** Items that only draw themselves show their text if any; otherwise they are reachable through "Classic menu".
- **D7 — Windows 11 commands.** Packaged commands already appear in the classic `IContextMenu` (M1: Windows Terminal, with its CLSID as the verb), so there is no separate path. Explorer-only commands are unverified on the CI runner; the owner checks on the work PC.
- **D9 — Keep the menu object alive.** Item ids work only on the `IContextMenu` that produced them: the STA thread keeps it while Ferrite's menu is open and invokes by canonical verb when there is one, by id otherwise. The STA thread is warmed at start (the first menu in a process takes 58–300 ms, later ones 10–30 ms).
- **D8 — Linux.** The provider returns only Ferrite's actions (D30).

## Components

| Component | Layer | Contract (in → out) | New / change | Test |
| --- | --- | --- | --- | --- |
| `ShellMenu` model + filter | rusty-ui (or rusty-core if shared) | `ShellMenu, query → rows` | new | unit, headless |
| `shell_menu` provider | rusty-shell (`windows`) | `paths → ShellMenu`; `id → invoke`; `lazy id → items`; `classic(paths, point)` | new | Windows CI tests on temp files |
| `ContextMenu` component | rusty-ui | model + keys → rendered menu, chosen action | new | headless UI tests, gallery page, screenshots |
| wiring | rusty-ui, rusty-app | long right-click, Menu key, Shift+F10 → menu; Ferrite actions | change | UI tests with the fake provider |

## Atoms

| Atom | Component | Role | Effort | After | Check | Status |
| --- | --- | --- | --- | --- | --- | --- |
| M1 | spike: provider on Windows | api-builder (Opus high) | high | — | Windows CI job prints the menu tree for a `.zip`, a folder and 3 files; reachable Windows 11 commands listed | running |
| M2 | `ShellMenu` model + filter | Red checker, Green orchestrator | medium | — | `cargo test` model tests | done |
| M3 | `shell_menu` provider (STA thread, lazy submenus, icons, invoke, classic) | api-builder (Opus high) | high | M1, M2 | Windows CI tests | done |
| M4 | `ContextMenu` component per D46 | ui-builder-high | high | M2 | headless UI tests, gallery screenshots both themes | done |
| M5 | wiring and Ferrite actions | ui-builder | medium | M3, M4 | UI tests with the fake provider; owner tries it on Windows | done |
| M7 | F3 and F4 context menu per kind (D51), on the M4 component | ui-builder | medium | M5 | UI tests per kind: right-click, Menu key, Shift+F10, each item dispatches its action | done |
| M7b | Missing viewer actions for D51 items: Find selection, Copy path:line, tree Copy value and Copy key, table Copy column, Markdown Copy and Copy link, image Copy image and Copy path; then add them to the viewer menu | ui-builder | medium | M7 | UI tests per action and per menu item | done (92f1000) |
| M6 | review | reviewer (Opus high) | high | M5, M7 | verdict | done |

## Done when

- A long right-click on a `.zip` shows 7-Zip's submenu in Ferrite's style; "Extract Here" works.
- Typing "send" shows the "Send to" targets; Enter on one runs it.
- "Classic menu" opens the native menu at the same place.
- The gate and Windows CI are green; the reviewer passes the branch; the owner confirms on the work PC.

## Log

- 2026-10-16 — Plan written after the owner picked the designer's recommendation (D46). Prototype: https://claude.ai/artifact/3yRKtiJ1xaYjnW45Dqz6xL
- 2026-10-16 — M2 (8373238) in `rusty_core::shell_menu`; review PASS WITH FIXES (disabled parents, selection kept by path, empty text skipped, `set_submenu`, Classic menu action) fixed in dbbd4f2; merged. M1 spike running on Windows CI.
- 2026-10-16 — M1 spike done (cc04f67, run 38851289858): 38–70 items, 36–48 with verbs; 7-Zip submenu complete; invoke by id works (Extract Here, copy → CF_HDROP); icons are 32-bit bitmaps, converted to RGBA; 0 owner-drawn; Send to needs `CMF_SYNCCASCADEMENU`. D5 and D7 updated, D9 added; merged.
- 2026-10-16 — M4 (88d5579, review fixes 306d3f3) and M3 (499874b, review fixes 3a75452; Windows run 38855214205 green) merged. M3 timings on the runner: open 350–780 ms, Send to fill ~436 ms (the fill blocks past the 250 ms budget and still returns Filled; revisit in M5 with an async fill). M5 contract: the UI polls `Pending` with `wait_timeout`, never blocks; restore focus via `ContextMenuInput.restore`; call `context_menu::bind_keys` in init.
- 2026-10-16 — M7 added: the owner asked for a context menu in the F3 viewer (D51).
- 2026-10-16 — M7 (06cc311) built: viewer menu per kind on existing actions only. Deferred to M7b because no action exists yet: Find selection, Copy path:line, tree Copy value and key, table Copy column, Markdown Copy and Copy link, image Copy image and Copy path. A Markdown file with no link under the pointer has no menu until M7b. Review PASS WITH FIXES; fixes running.
- 2026-10-16 — M7 review fixes (f06bf3a) merged: stale Markdown link cleared in capture phase, build_action errors assert and show a header note, a re-entrant update panic on window-handled items fixed with window.defer, 16 viewer menu tests. M5 was merged earlier (d798384).
- 2026-10-16 — M7b merged (92f1000): Find selection, Copy path:line, tree Copy value (refuses shortened values) and Copy key, table Copy column, Markdown Copy and Copy link, image Copy image (PNG only on Windows) and Copy path. Released in alpha-2026-10-16k with M7 and L4. Open: Ctrl+C image inside the preview drawer is unchecked. Next: M6 review of M5 and M7.
- 2026-10-16 — M6 review PASS WITH FIXES; fixes merged (p17-m6-fixes, CI 38937246695 green): the Windows menu refuses names Win32 would rewrite (trailing dot or space, device names) so a shell verb can never hit another file; viewer right-click targets the clicked tree row or table cell; Retry resends a failed submenu; dropped prefetch opens are cancelled before the shell builds them; Linux shows only working Ferrite actions; long-press marks the pressed row; tree Copy value walk is bounded by the cap. Deferred: Find selection and Copy path:line in the paged large-file view.
