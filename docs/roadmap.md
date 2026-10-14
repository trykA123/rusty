# Rusty roadmap

Draft, 14 October 2026. The visual version is [`design/roadmap.html`](../design/roadmap.html). Scope rules are in [decisions.md](decisions.md) (D13, D14).

Kinds: **core** is always on; **module** can be turned off; **package** is data only (themes, keymaps); **infra** is build, CI and release work.

## v1.0 targets

| Measure | Target |
| --- | --- |
| Cold start to first usable frame | ≤ 400 ms |
| Warm start | ≤ 150 ms |
| Summon from tray (v1.2) | ≤ 50 ms |
| RAM, two panes, idle | < 80 MB |
| Portable `.exe` | < 30 MB |

## Design · done

Product discussion, prototypes A–L (B chosen), architecture, plugin model, decisions D1–D20.

## Foundation · v0.1 · next

Goal: prove the stack and build the factory.

- infra: foundation plan; Cargo workspace with the eleven crates; quality gate; Windows CI producing a portable `.exe` per push.
- infra: GPUI spike on design B with 100k entries, three panes and the drawer; `nucleo` against `frizbee` on 2 million names.
- core: storage layer with SQLite from day one (`rusty.db`, `cache.db`, migrations) and the session snapshot (D17).
- core: diagnostics with redacted logs, memory and performance statistics and a hand-saved report (D20).
- core: command system, layout tree, state and `apply()` with property tests.

Exit: the spike meets the targets on Linux and the work PC, otherwise D2 is reopened.

## v1 Alpha · v0.5

Goal: a file manager the owner can use every day on Windows.

- core: tiled panes and tabs with history; session restore; virtualised file list with sorting, quick filter and shell icons.
- core: Total Commander selection (D15); native context menu on a long right-click.
- core: drive bar with mapped network drives, reconnect, Alt+F1, UNC paths and an offline state (D19).
- core: copy, move, rename, new folder, Recycle Bin, Shift+Del with a warning; plan before acting; background job queue.
- core: pins, Ctrl+K palette, shortcuts in TOML, F-key bar; every string in Fluent files (English only).
- package: built-in light and dark themes following Windows.

Exit: two weeks of daily use on the work PC with no lost or damaged files.

## v1 Beta · v0.9

Goal: safe, configurable and pleasant; modules and theming arrive.

- core: workspaces (Alt+1…9); refresh mode per network location; drag and drop with Explorer; crash-safe job journal and undo.
- core: module registry with runtime on/off and safe mode; settings window generated from module schemas.
- core: per-case confirmations, date and size formats, ignore list.
- package: custom colour themes and icon themes (D16).
- module: copy path, terminal (Windows Terminal and templates), folder search, frecency jump, external viewer and editor (F3/F4), notifications for long operations.
- infra: soak test and start-up benchmark in CI.

Exit: no open data-safety bugs; start-up and memory targets met in CI.

## v1.0

- infra: signed portable `.exe` and installer; user guide.
- package: Total Commander keymap.

Exit: every target is met on a clean Windows 11 machine.

## v1.1 · See and find

- module: preview pane, thumbnails, archives as folders, global search with Rusty's own index (D11), auto switch view.
- core: saved column sets.

Exit: global search answers in under 50 ms on 2 million files.

## v1.2 · Power tools

- module: Git, compare and sync, batch rename, duplicates and disk usage, clipboard history and notes, summon hotkey and tray.
- package: import of Zed and VS Code colour themes.

Exit: each module turns off without a restart and costs nothing while off.

## v2.0 · Open platform

- core: WASM plugins (versioned WIT API, permissions, sandbox); Lua scripting.
- infra: plugin SDK, template, dev mode with hot reload.
- module: Everything, embedded terminal (ConPTY), SFTP/S3/rclone.
- package: more languages, Romanian first.

Exit: a third-party plugin is built, installed and updated without touching Rusty's code.
