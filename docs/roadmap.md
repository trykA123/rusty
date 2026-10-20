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

Progress: 63% (155 of 248 items done, 3 being finished counted as half, 90 still to do: (155 + 1.5) ÷ 248). The drop from 67% is because the plans for Ctrl+K and multi-rename list their real parts instead of one item each. Each part of the plans P36 (multi-select and drag and drop), P37 (PDF links), P38 (Rich ELF and MAP), P40 (Ctrl+K) and P41 (multi-rename) counts once; review-only parts are not counted. Moving the remaining texts into translation files is out of the count (after 1.0, D59).

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
- PDF links follow on click with a back stack; PDF outline tab (faster, with a note for an unreadable outline); only http, https and mailto links open outside Ferrite;
- F-key bar off by default;
- ELF symbols table with resizable columns and names that keep their prefix;
- HEX and S-record rows of 32 bytes, with padding gaps folded;
- memory regions from TASKING `.mdf` files; linker fill counted apart from real data (model);
- drag and drop groundwork: drop rule, drop into a folder, volume check;
- built, not switched on: Ctrl+K groundwork (command list, ranking, the look of the box, the file name index table); multi-rename engine parts (masks with the Total Commander tokens, row checks, rename job type, case-insensitive test file system); ELF owners (who uses each byte).

Still open in the alpha, in this order:

- multi-select (done) and drag and drop (next: the mouse part);
- PDF links and outline (done; waits for your check with a real PDF);
- Rich ELF and MAP views, direction "address space first" (D66; tables, rows, `.mdf` regions and owners are built; the map screens come next);
- Ctrl+K command center with global search (D60, D61, D63; groundwork built, the box comes next);
- multi-rename, Ctrl+M (Total Commander parity plus extras: field tokens from EXIF and audio tags, clean-up toggles, edit names, undo history after a restart, conflict preview, all or nothing; engine parts built, the screen comes next);
- DBC and A2L viewer in F3;
- automotive syntax colours (m4, OIL, DCM, UDL) wired into the text viewer;
- viewer chrome; pins;
- spreadsheets in F3 (one item; after 1.0 if it grows);
- every shortcut changeable;
- the Follow bug on Windows (last); steadier Windows CI.

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

In this order:

1. Activity strip replacing the F-key bar, which is now off by default (D67, being built now).
2. Delete safety net with 1 to 7 days retention (D65).

## v1 Beta · v0.9

Goal: safe, configurable and pleasant; modules and theming arrive.

- core: workspaces (Alt+1…9); refresh mode per network location; drag and drop with Explorer; crash-safe job journal and undo (each step reversible, compensable or final; undo offers only what it can do).
- core: module registry with runtime on/off and safe mode; settings window generated from module schemas.
- core: per-case confirmations, date and size formats, ignore list.
- core: Parallel and Large files copy modes, copy options, profiles and rules by destination; accessibility basics.
- package: custom colour themes and icon themes (D16). Idea, not decided: an optional colourful icon theme based on Material Icon Theme (MIT).
- module: copy path, terminal (Windows Terminal and templates), folder search, frecency jump, external viewer and editor (F3/F4; done, from plan P12; hex view and large files done, from plan P13; viewer foundation done, from plan P15; extra grammars and content detection done, from plan P15 (A3); rule lexer and Notepad++ UDL import done, from plan P15 (A4, viewer wiring next); search counts, marks and history (model and store) done, from plan P15 (A5)), notifications for long operations.
- infra: soak test; start-up and memory benchmark in CI (done, from plan P23; baseline in [perf.md](perf.md)).

Exit: no open data-safety bugs; start-up and memory targets met in CI.

## v1.0

Replaces Total Commander for daily work (D39). Parity features are built to beat TC, not copy it.

- core: find files by name, content and attributes, with results as a pane you can work on; saved searches.
- core: virtual collections: a pane can hold search results, recent changes or files picked from many folders.
- core: archives as folders (zip, 7z, tar with gz, xz and zst): browse, extract and pack through the job engine; safe extraction.
- core: compare and sync, better than Beyond Compare where it counts (D40): folder compare in the panes, sync as a plan with undo, cached BLAKE3 hashes, syntax-aware text diff, paged diff for huge and binary files, image compare; engine in the shared `rusty-compare` crate.
- core: checksums (BLAKE3, SHA-256, SHA-1, MD5) with verify; properties drawer for attributes, timestamps and permissions; images in F3.
- infra: signed portable `.exe` and installer; user guide.
- core: optional default file manager (Win+E).
- package: Total Commander keymap.

Exit: every target is met on a clean Windows 11 machine, and a week of work runs without opening Total Commander.

## v1.1 · See and find

- module: preview pane, thumbnails, global search with Rusty's own index and `rusty-indexd` (D23; engine built alongside Alpha, may ship in Beta), auto switch view.
- package: language packages for the F3 viewer (D38).
- core: saved column sets.

Exit: global search answers in under 50 ms on 2 million files.

## v1.2 · Power tools

- module: Git, duplicates and disk usage, clipboard history and notes, summon hotkey and tray.
- package: import of Zed and VS Code colour themes.

Exit: each module turns off without a restart and costs nothing while off.

## v2.0 · Open platform

- core: WASM plugins (versioned WIT API, permissions, sandbox); Lua scripting.
- infra: plugin SDK, template, dev mode with hot reload.
- core: new slots for metadata providers, view modes, transforms, automation rules and status badges; module packs (D24).
- module: Everything (optional), embedded terminal (ConPTY), SFTP/S3/rclone.
- package: more languages, Romanian first.

Exit: a third-party plugin is built, installed and updated without touching Rusty's code.
