# Decisions

Newest last. “Proposed” items wait for the owner's review.

| # | Date | Decision | Status |
| --- | --- | --- | --- |
| D1 | 2026-10-13 | Design direction **B, Commander**: resizable sidebar, tab path copying, new tab from a path, drawer of add/remove views | Decided |
| D2 | 2026-10-13 | UI framework **GPUI** (with gpui-component), provided it can match the prototype's look; validate with a spike on B with 100k files, three panels and the drawer | Decided, spike pending |
| D3 | 2026-10-13 | Windows testing on the owner's work machine; CI produces a portable `.exe` per push to `main` | Decided |
| D4 | 2026-10-13 | Plugins are defined now: data-only packages and sandboxed WASM component extensions with permissions; see [plugins.md](plugins.md) | Decided |
| D5 | 2026-10-13 | Terminal is a provider: Windows Terminal by default, external command templates, embedded ConPTY after v1 | Decided |
| D6 | 2026-10-13 | One typed command system: every action has one name and one implementation (`path.copy`, `files.recycle`); shortcuts, menus, the palette, macros and plugins all call those names | Accepted (explained 2026-10-13; reopen if needed) |
| D7 | 2026-10-13 | Delete goes to the Recycle Bin. **Shift+Del deletes permanently after a warning** that shows how many items, their total size and the first paths. Every file operation is planned before it runs | Decided |
| D8 | 2026-10-13 | No scripting language in v1; macros are sequences of commands. **Choose a scripting language after v1**; owner leans to **Lua** | Decided; Lua likely |
| D9 | 2026-10-13 | Global search uses Everything. If it is missing, Rusty offers to install it through an **Everything plugin** that downloads the official installer from voidtools with a checksum check, only after the user agrees. Bundling terms to confirm with voidtools' licence. Own NTFS index later | Decided |
| D10 | 2026-10-13 | Portable mode when `rusty.toml` sits next to the executable | Decided |
| D11 | 2026-10-13 | Global search without Everything: Rusty's own index. Fast path: an optional admin helper service reads the NTFS file table and change journal and serves the unelevated app over a local pipe (names only, no file access). Fallback: parallel drive walk saved to disk and kept current by watchers (also used for network drives). Optional extra source: Windows Search. Matching with `nucleo`; memory budget about 80–100 MB per 2 million files | Decided |
| D12 | 2026-10-13 | Code signing for builds used on the work PC; portable `.exe` plus an installer (installer details later) | Decided (owner: “Ok”) |
| D13 | 2026-10-14 | **Modular app: a small core, every other feature a module.** The core is always on: state and commands, panes, tabs, layout, workspaces, the file list, the job engine and its safety checks, settings, pins, the Ctrl+K palette, shortcuts and the module host. Modules are native (compiled in, can be turned off at runtime), WASM (third party, sandboxed) or data packages (themes, keymaps). One manifest and one registry for all three; modules talk only through commands, events and declared services. No third-party native DLLs | Decided |
| D14 | 2026-10-14 | **v1 is small, stable and light.** Scope and phases in [roadmap.md](roadmap.md). WASM plugins come after v1 (v2.0). English is the default and only language in v1; every string lives in Fluent files so other languages can follow | Decided |
| D15 | 2026-10-14 | **Total Commander selection model by default:** Space selects and sizes folders, Insert selects and moves down, a short right-click selects, right-drag selects a range, a long right-click (about 400 ms) opens the native Windows context menu with Rusty's actions on top. One setting switches to the Explorer model | Decided |
| D16 | 2026-10-14 | **Theming like Zed:** built-in light and dark that follow Windows; user colour themes in TOML (families with light and dark variants, live reload, contrast check); separate icon themes (SVG by extension, name and folder, with shell icons kept for `.exe`, `.lnk`, `.ico`). Themes and icon themes are data packages | Decided |
