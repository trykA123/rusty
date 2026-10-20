# Rusty roadmap

Updated 20 October 2026. The visual version is [`design/roadmap.html`](../design/roadmap.html). Scope rules are in [decisions.md](decisions.md) (D13, D14).

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

Progress: 75% (183 of 247 items done, 3 being finished counted as half, 61 still to do: (183 + 1.5) ÷ 247). Each part of multi-select and drag and drop, PDF links, Rich ELF and MAP, Ctrl+K and multi-rename counts once; review-only parts are not counted. Moving the remaining texts into translation files is out of the count (after 1.0, D59).

Done so far:

- component library and gallery; two panes with tabs and history; session restore; virtualised list with quick filter;
- copy, move, rename and new folder, Recycle Bin and Shift+Del with plans, progress, cancel and a crash-safe journal; light and dark themes;
- Oxidised iron syntax colours (D64);
- CAN traces in TRC and Vector BLF; DBC and A2L readers (the F3 viewer for them is not done);
- TASKING map wrapped rows, map part headers, `.mdf` memory definition reader;
- Alt+M opens the context menu;
- safer session and database store after a crash;
- multi-select: keys, Shift and Ctrl click, right-drag ranges, left-drag lasso; marks survive the filter, `/` restores them, the footer counts marked files the filter hides;
- file-type icons per extension (PDF, Office, audio, video, code families, automotive);
- PDF links follow on click with a back stack; PDF outline tab (faster, with a note for an unreadable outline); only http, https and mailto links open outside Ferrite; waits for your check with a real PDF;
- activity strip: one line at the bottom shows what is running; Alt+J opens the drawer with every job;
- F-key bar off by default;
- ELF symbols table with resizable columns and names that keep their prefix;
- HEX and S-record rows of 32 bytes, with padding gaps folded;
- memory regions from TASKING `.mdf` files; linker fill counted apart from real data (model);
- drag and drop groundwork: drop rule, drop into a folder, volume check, drag badge, setting, shortcut planning and drag from the file list;
- built, not switched on: Ctrl+K file index engine (name table, parallel search, saved index, folder walker); multi-rename engine (Total Commander masks, clean-up, file, photo and audio fields, safe put-back; reviewed); ELF owners (who uses each byte).

Still open in the alpha, in this order:

- right-click on empty space: a folder menu with New file (Shift+F7) and the Windows background menu (done, waiting for Windows CI);
- cache sizes in diagnostics: the diagnostic report shows how much disk each cache uses, backed by a long stress test (in progress);
- multi-select (done) and drag and drop (built: rules, badge, setting, shortcut planning and drag from the file list; next: dropping in the window, on tabs, crumbs and drives, and drag and drop with Explorer in both directions);
- Rich ELF and MAP views, direction "address space first" (D66; the model, owners, groups, strip, treemap and colours are built; the map screens come next);
- Ctrl+K command center (D60, D61, D63): the box works for commands; the file index engine is built (name table, parallel search, saved index, folder walker); recent files, tabs and folders as sources and the background index service come next (target: global search answers in under 50 ms on 2 million files);
- multi-rename, Ctrl+M: Total Commander parity plus extras (field tokens from EXIF and audio tags, clean-up toggles, edit names, undo history after a restart, conflict preview, all or nothing); engine done and reviewed, dialog next;
- DBC and A2L viewer in F3;
- automotive syntax colours (m4, OIL, DCM, UDL) wired into the text viewer;
- viewer chrome; pins;
- steadier Windows CI (in progress);
- the Follow bug on Windows (last).

Scope:

- core: tiled panes and tabs with history; session restore; virtualised file list with sorting, quick filter and shell icons.
- core: component library in `rusty-ui` (primitives and Rusty components) with the component gallery and headless UI tests (D25).
- core: Total Commander selection (D15); native context menu on a long right-click.
- core: drive bar with mapped network drives, reconnect, Alt+F1, UNC paths and an offline state (D19) (done, from plan P14).
- core: copy, move, rename, new folder, Recycle Bin, Shift+Del with a warning; plan before acting; background job queue.
- core: copy engine in Auto and Standard modes (D22); Explorer clipboard; lock owner in errors; command line; key contexts; per-monitor DPI.
- infra: copy benchmark against Explorer, `robocopy /MT` and TeraCopy.
- core: pins, shortcuts in TOML; new UI text goes into Fluent files (English only); moving the old texts is after 1.0 (D59).
- package: built-in light and dark themes following Windows.

Exit: two weeks of daily use on the work PC with no lost or damaged files.

## Right after the alpha

1. Delete safety net with 1 to 7 days retention (D65).

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
- infra: soak test; start-up and memory benchmark in CI (done; baseline in [perf.md](perf.md)).

Exit: no open data-safety bugs; start-up and memory targets met in CI.

## v1.0

Replaces Total Commander for daily work (D39). Parity features are built to beat TC, not copy it.

- core: find files by content and attributes, with results as a pane you can work on; saved searches.
- core: virtual collections: a pane can hold search results, recent changes or files picked from many folders.
- core: archives as folders (zip, 7z, tar with gz, xz and zst): browse, extract and pack through the job engine; safe extraction.
- core: compare and sync, better than Beyond Compare where it counts (D40): folder compare in the panes, sync as a plan with undo, cached BLAKE3 hashes, syntax-aware text diff, paged diff for huge and binary files, image compare; engine in the shared `rusty-compare` crate.
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
