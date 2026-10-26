# Rusty roadmap

Updated 26 October 2026. The visual version is [`design/roadmap.html`](../design/roadmap.html). Scope rules are in [decisions.md](decisions.md) (D13, D14). Plain-language specs for the bigger features are in [features/](features/).

Kinds: **core** is always on; **module** can be turned off; **package** is data only (themes, keymaps); **infra** is build, CI and release work.

## v1.0 targets

| Measure | Target |
| --- | --- |
| Cold start to first usable frame | ≤ 400 ms |
| Warm start | ≤ 150 ms |
| Summon from tray (beta) | ≤ 50 ms |
| RAM, two panes, idle | < 80 MB |
| Portable `.exe` | no limit (D44); CI guard 160 MiB |

## Design · done

Product discussion, prototypes A–L (B chosen), architecture, plugin model, decisions D1–D26; plans P1–P8 in `plans/`.

## Foundation · v0.1 · done

Done 15 October 2026: P1–P8 passed their gates; PoC 1 and PoC 2 passed on the work PC.

Goal: prove the stack and build the factory.

- infra: foundation plan; Cargo workspace with the eleven crates; quality gate; Windows CI producing a portable `.exe` per push.
- infra: GPUI spike on design B with 100k entries, three panes and the drawer; `nucleo` against `frizbee` on 2 million names; built on `gpui-kit`, including its AccessKit support.
- core: storage layer with SQLite from day one (`navo.db`, `cache.db`, migrations) and the session snapshot (D17).
- core: diagnostics with redacted logs, memory and performance statistics and a hand-saved report (D20).
- core: serialisable commands, layout tree, multi-window state and `apply()` with property tests.
- core: locations and providers, record and replay, one error model, I/O queues per volume, experimental flags (D21).
- infra: fake file system with fault injection and a hostile-name corpus.

Exit: the spike meets the targets on Linux and the work PC, otherwise D2 is reopened.

## v1 Alpha · v0.5 · now

Goal: a file manager the owner can use every day on Windows.

All four alpha features are built. They are in the pre-release alpha-2026-10-26. Status is shown instead of percentages, because the old percentages mixed building with release checks.

| Feature | Built | Still open |
| --- | --- | --- |
| Multi-select and drag and drop | Marking, drops between panes, folders, tabs, path crumbs and drives, Alt-drop shortcuts, drag to and from Explorer, right-button drop choices, auto-scroll near list edges, and folders, tabs and drives that open on hover | Owner check of Explorer drag on the work PC. Linux external drops are Copy-only. |
| Rich ELF and MAP | Rich views, memory models, companion discovery and live module prefixes | Final review and work-PC checks |
| Ctrl+K command center | Commands, recent files, tabs, folder and path sources, disk index, Search settings and the optional Windows service | Owner check of the index service on the work PC |
| Multi-rename | Journaled rename with safe undo and crash recovery; edited, imported, pasted and copied names; sorting, ordering and folder counters; optional rename log. Rename works on FAT and exFAT drives; undo there checks size and time first. | Owner check of rename on a FAT or exFAT USB stick |

Windows CI is green: 7,118 tests passed. Linux passed all 10 gate steps.

Merged after that release: six built-in colour themes. They are Open sea (the default), Red bill, Black cap, Fine mesh, Grain, and Ink and amber. Each has a light and a dark form. Pick one in Settings > Appearance > Colour theme. It applies at once.

### Merged since that release

- **Navo.** The app has a new name and the `n_` icon. Your Ferrite profile (settings, tabs, history) moves to Navo once, safely, with crash recovery. The old folder is renamed to "Ferrite.migrated-to-navo". An installed Ferrite Index service is upgraded from a one-time notice.
- **Start-up splash.** A small native Windows window with the `n_` icon and the "navo" wordmark. It shows only when start-up takes longer than half a second, and fades out. It does not appear on Linux.
- **New right-click menu.** The real Windows shell menu in Navo's style. The filter sits at the top. Submenus open in place, with a back row. Shift adds the extended items. If anything fails, the classic Windows menu opens instead.
- **Fixes from the final reviews** of the Ctrl+K index service and of Rich ELF and MAP.

### Now in progress

- **Record performance.** A menu command records frame times, CPU, memory and the latency of opening folders and Ctrl+K while you use the app, then saves a `navo-performance-*.zip` to send. It is built and waiting for Windows CI.
- **Delete safety net (1 to 7 days retention).** The retention engine, recovery, quarantine and crash-safe temporary-file cleanup are built and reviewed. All of it sits behind an experimental launch flag, so normal use does not change. The last review fixes and the move onto the Navo names are being made now. After it merges, still missing for users: turning it on in delete and overwrite jobs, its settings, a "Recently deleted" view, and general undo.
- **Fonts.** Space Grotesk for the brand, Inter for the interface, JetBrains Mono for paths and viewers. Decided. Not built yet.

Still open for alpha sign-off:

- Owner checks on the work PC: Explorer drag, the index service, rename on a FAT or exFAT USB stick, the Rich ELF and MAP views, the profile move to Navo, and the splash.
- A heavy benchmark: millions of indexed files, search latency, long lists, memory, and animation smoothness recorded on the work PC.
- Two weeks of daily use with no lost or damaged files.

The latest downloadable alpha is the pre-release alpha-2026-10-26d. It has all four alpha features, the colour themes, the splash and the new right-click menu. The Navo rename comes in the next build. DBC/A2L viewer screens, automotive colours and viewer chrome are beta work (D75).

The foundation already includes two panes, tabs, history, session restore, file operations, virtual lists, themes, the viewer, selection and the activity strip. The beta and later phases below retain their existing scope.

Exit: two weeks of daily use on the work PC with no lost or damaged files.

## Right after the alpha

1. Delete safety net turned on for users (D65): delete and overwrite jobs, its settings and a "Recently deleted" view.
2. The new fonts (D78).
3. Background work: job queues, folder sizes and speed tests, from ideas in Linux tools.
4. Raw/Pretty formatting in F3: format JSON, XML and similar on open.

## v1 Beta · v0.9

Goal: safe, configurable and pleasant; modules and theming arrive.

The owner set the beta order on 26 October 2026 (D81). Items marked **priority** are built first. The items moved in from v1.0 and later versions come next. Everything else in the beta follows.

Built first (priority):

- core: workspaces (Alt+1…9). **priority**
- core: accessibility basics: Narrator reads lists and dialogs, focus visible everywhere, reduced motion, high contrast, UI scale. **priority**
- core: responsive layout (D80): minimum window size, columns aligned under their headers with names cut by an ellipsis, columns that drop in order on narrow windows, one pane below a set width, tab overflow, and layout tests at fixed widths in the gate. Built, being merged. **priority**
- core: more than two panes, tiled like Hyprland (D80): split, move and resize panes from the keyboard. Needs a design round and a plan first. **priority**
- core: clone a tab into the other pane. **priority**
- core: cache sizes in diagnostics, with a long stress test. **priority**
- module: open a terminal here (Windows Terminal and templates); copy path (F9) and folder search (Ctrl+K) are already in. **priority**
- module: DBC and A2L viewer in F3. **priority**
- module: viewer chrome and pins. **priority**
- module: rich map, deeper: a picked tile keeps its colour; the map can show one module so its files fill the space. **priority**
- module: Follow on Windows (Alt+F), a known bug. **priority**

Moved in from v1.0 and later:

- core: find files by content and attributes, with results as a pane you can work in.
- core: virtual collections: a pane can hold search results, recent changes or files picked from many folders.
- core: archives as folders (zip, 7z, tar with gz, xz and zst): browse, extract and pack through the job engine; safe extraction.
- core: properties drawer for attributes, timestamps and permissions.
- module: preview pane and thumbnails.
- core: saved column sets.
- module: clipboard history and notes; summon hotkey and tray.

After these:

- core: refresh mode per network location; undo for every job from the UI (journal and recovery already built; each step reversible, compensable or final; undo offers only what it can do).
- core: module registry with runtime on/off and safe mode; settings window generated from module schemas.
- core: per-case confirmations, date and size formats, ignore list.
- core: Parallel and Large files copy modes, copy options, profiles and rules by destination.
- package: custom colour themes and icon themes (D16). Idea, not decided: an optional colourful icon theme based on Material Icon Theme (MIT).
- module: external viewer and editor (F3/F4; done; hex view and large files done; viewer foundation done; extra grammars and content detection done; rule lexer and Notepad++ UDL import done; search counts, marks and history (model and store) done), notifications for long operations.
- module: spreadsheets in F3 (one item; after 1.0 if it grows); colouring for m4, OIL and DCM files.
- core: every shortcut changeable.
- infra: Windows installer (NSIS); steadier Windows tests; soak test; start-up and memory benchmark in CI (done; baseline in [perf.md](perf.md)).

Exit: no open data-safety bugs; start-up and memory targets met in CI.

## v1.0

Replaces Total Commander for daily work (D39). Parity features are built to beat TC, not copy it.

- core: saved searches.
- core: compare and sync, better than Beyond Compare where it counts (D40): folder compare in the panes, a calm full-window look with a change map on each scroller (chosen; after the alpha), sync as a plan with undo, cached BLAKE3 hashes, syntax-aware text diff, paged diff for huge and binary files (planned for the first version), image compare; engine in the shared `rusty-compare` crate.
- core: checksums (BLAKE3, SHA-256, SHA-1, MD5) with verify; images in F3.
- infra: signed portable `.exe` and installer; user guide.
- core: optional default file manager (Win+E).
- package: Total Commander keymap.

Exit: every target is met on a clean Windows 11 machine, and a week of work runs without opening Total Commander.

## v1.1 · See and find

- module: auto switch view.
- package: language packages for the F3 viewer (D38).

## v1.2 · Power tools

- module: Git, duplicates and disk usage.
- package: import of Zed and VS Code colour themes.
- Native editing for each kind: A table edits like a spreadsheet. A tree edits keys and values in place.

Exit: each module turns off without a restart and costs nothing while off.

## Connect and automate · after v1

- Jenkins links to network folders: paste a Jenkins link and jump to the matching network folder, using rules you set once.
- Built-in web view: optional.
- Workflows and automations: chain actions so Navo does repeat work for you.
- Visual builder: build workflows by drawing them, like n8n.

## v2.0 · Open platform

- core: WASM plugins (versioned WIT API, permissions, sandbox); Lua scripting.
- infra: plugin SDK, template, dev mode with hot reload.
- core: new slots for metadata providers, view modes, transforms, automation rules and status badges; module packs (D24).
- module: Everything (optional), embedded terminal (ConPTY), SFTP/S3/rclone.
- package: more languages, Romanian first.

Exit: a third-party plugin is built, installed and updated without touching Rusty's code.
