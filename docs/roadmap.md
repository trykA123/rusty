# Rusty roadmap

Updated 26 October 2026. The visual version is [`design/roadmap.html`](../design/roadmap.html). Scope rules are in [decisions.md](decisions.md) (D13, D14). Plain-language specs for the bigger features are in [features/](features/).

Kinds: **core** is always on; **module** can be turned off; **package** is data only (themes, keymaps); **infra** is build, CI and release work.

## v1.0 targets

| Measure | Target |
| --- | --- |
| Cold start to first usable frame | ≤ 400 ms |
| Warm start | ≤ 150 ms |
| Summon from tray (v1.2) | ≤ 50 ms |
| RAM, two panes, idle | < 80 MB |
| Portable `.exe` | no limit (D44); CI guard 160 MiB |

## Design · done

Product discussion, prototypes A–L (B chosen), architecture, plugin model, decisions D1–D26; plans P1–P8 in `plans/`.

## Foundation · v0.1 · done

Done 15 October 2026: P1–P8 passed their gates; PoC 1 and PoC 2 passed on the work PC.

Goal: prove the stack and build the factory.

- infra: foundation plan; Cargo workspace with the eleven crates; quality gate; Windows CI producing a portable `.exe` per push.
- infra: GPUI spike on design B with 100k entries, three panes and the drawer; `nucleo` against `frizbee` on 2 million names; built on `gpui-kit`, including its AccessKit support.
- core: storage layer with SQLite from day one (`ferrite.db`, `cache.db`, migrations) and the session snapshot (D17).
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

### Now in progress

- **Rename to Navo.** The app gets a new name and a new `n_` icon. Your existing profile (settings, tabs, history) moves once, safely, with crash recovery. Afterwards the old Ferrite folder is renamed to "Ferrite.migrated-to-navo". The installed index service is upgraded from a one-time notice. Done: profile folder names and temporary-file names. The move engine is built and in its review-fix round. Still to do: app start order, instance names, the index service, the program name, on-screen text, icons, CI and docs. This page says Ferrite until the rename lands.
- **Start-up splash.** A small native Windows window shows the `n_` icon and the "navo" wordmark. It appears only when start-up takes longer than 200 ms. It does not appear on Linux.
- **New right-click menu.** It shows the real Windows shell menu in Ferrite's style. The filter sits at the top. Submenus open in place, with a back row. You get the full classic menu, and Shift adds the extended items. If anything fails, the classic Windows menu opens instead. Two builds are being made side by side so the owner can compare quality.
- **Fonts.** Space Grotesk for the brand, Inter for the interface, JetBrains Mono for paths and viewers. Decided. Not built yet.

### After the backend merge

The delete safety net (1 to 7 days retention) has its own branch. Its retention engine, recovery, quarantine and crash-safe temporary-file cleanup are built and reviewed. All of it sits behind an experimental launch flag, so normal use does not change. The branch is being moved onto the current main.

After it merges, the safety net engine is in the app but still off by default. Still missing for users: turning it on in delete and overwrite jobs, its settings, a "Recently deleted" view, and general undo. A faster lookup for very large retention catalogs is parked.

Still open for alpha sign-off:

- Owner checks on the work PC: Explorer drag, the index service, and rename on a FAT or exFAT USB stick.
- Two weeks of daily use with no lost or damaged files.

The latest downloadable alpha is the pre-release alpha-2026-10-26. It has all four alpha features. The colour themes came after it. DBC/A2L viewer screens, automotive colours and viewer chrome are beta work (D75).

The foundation already includes two panes, tabs, history, session restore, file operations, virtual lists, themes, the viewer, selection and the activity strip. The beta and later phases below retain their existing scope.

Exit: two weeks of daily use on the work PC with no lost or damaged files.

## Right after the alpha

1. Rename to Navo (D78, D79): new name, new icon, a quiet start-up splash and the new fonts. Work has started (see Now in progress). The six built-in colour themes with Open sea as the default are already on main.
2. Delete safety net with 1 to 7 days retention (D65). It continues on its own branch. The engine is built behind an experimental flag (see After the backend merge).
3. Background work: job queues, folder sizes and speed tests, from ideas in Linux tools (planned; after the alpha).

## v1 Beta · v0.9

Goal: safe, configurable and pleasant; modules and theming arrive.

- core: workspaces (Alt+1…9); refresh mode per network location; undo for every job from the UI (journal and recovery already built; each step reversible, compensable or final; undo offers only what it can do).
- core: module registry with runtime on/off and safe mode; settings window generated from module schemas.
- core: per-case confirmations, date and size formats, ignore list.
- core: Parallel and Large files copy modes, copy options, profiles and rules by destination; accessibility basics.
- package: custom colour themes and icon themes (D16). Idea, not decided: an optional colourful icon theme based on Material Icon Theme (MIT).
- module: copy path, terminal (Windows Terminal and templates), folder search, external viewer and editor (F3/F4; done; hex view and large files done; viewer foundation done; extra grammars and content detection done; rule lexer and Notepad++ UDL import done; search counts, marks and history (model and store) done), notifications for long operations.
- module: spreadsheets in F3 (one item; after 1.0 if it grows).
- core: every shortcut changeable.
- core: responsive layout (D80): minimum window size, columns aligned under their headers with names cut by an ellipsis, columns that drop in order on narrow windows, one pane below a set width, tab overflow, and layout tests at fixed widths in the gate.
- core: more than two panes, tiled like Hyprland (D80): split, move and resize panes from the keyboard. Needs a design round and a plan first.
- infra: soak test; start-up and memory benchmark in CI (done; baseline in [perf.md](perf.md)).

Exit: no open data-safety bugs; start-up and memory targets met in CI.

## v1.0

Replaces Total Commander for daily work (D39). Parity features are built to beat TC, not copy it.

- core: find files by content and attributes, with results as a pane you can work on; saved searches.
- core: virtual collections: a pane can hold search results, recent changes or files picked from many folders.
- core: archives as folders (zip, 7z, tar with gz, xz and zst): browse, extract and pack through the job engine; safe extraction.
- core: compare and sync, better than Beyond Compare where it counts (D40): folder compare in the panes, a calm full-window look with a change map on each scroller (chosen; after the alpha), sync as a plan with undo, cached BLAKE3 hashes, syntax-aware text diff, paged diff for huge and binary files (planned for the first version), image compare; engine in the shared `rusty-compare` crate.
- core: checksums (BLAKE3, SHA-256, SHA-1, MD5) with verify; properties drawer for attributes, timestamps and permissions; images in F3.
- infra: signed portable `.exe` and installer; user guide.
- core: optional default file manager (Win+E).
- package: Total Commander keymap.

Exit: every target is met on a clean Windows 11 machine, and a week of work runs without opening Total Commander.

## v1.1 · See and find

- module: preview pane, thumbnails, auto switch view.
- package: language packages for the F3 viewer (D38).
- core: saved column sets.

## v1.2 · Power tools

- module: Git, duplicates and disk usage, clipboard history and notes, summon hotkey and tray.
- package: import of Zed and VS Code colour themes.
- Native editing for each kind: A table edits like a spreadsheet. A tree edits keys and values in place.

Exit: each module turns off without a restart and costs nothing while off.

## Connect and automate · after v1

- Jenkins links to network folders: paste a Jenkins link and jump to the matching network folder, using rules you set once.
- Built-in web view: optional.
- Workflows and automations: chain actions so Ferrite does repeat work for you.
- Visual builder: build workflows by drawing them, like n8n.

## v2.0 · Open platform

- core: WASM plugins (versioned WIT API, permissions, sandbox); Lua scripting.
- infra: plugin SDK, template, dev mode with hot reload.
- core: new slots for metadata providers, view modes, transforms, automation rules and status badges; module packs (D24).
- module: Everything (optional), embedded terminal (ConPTY), SFTP/S3/rclone.
- package: more languages, Romanian first.

Exit: a third-party plugin is built, installed and updated without touching Rusty's code.
