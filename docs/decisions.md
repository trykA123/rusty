# Decisions

Newest last. “Proposed” items wait for the owner's review.

| # | Date | Decision | Status |
| --- | --- | --- | --- |
| D1 | 2026-10-13 | Design direction **B, Commander**: resizable sidebar, tab path copying, new tab from a path, drawer of add/remove views | Decided |
| D2 | 2026-10-13 | UI framework **GPUI** (with gpui-component), provided it can match the prototype's look; validate with a spike on B with 100k files, three panels and the drawer | Decided, spike pending |
| D3 | 2026-10-13 | Windows testing on the owner's work machine; CI produces a portable `.exe` per push to `main` | Decided |
| D4 | 2026-10-13 | Plugins are defined now: data-only packages and sandboxed WASM component extensions with permissions; see [plugins.md](plugins.md) | Decided |
| D5 | 2026-10-13 | Terminal is a provider: Windows Terminal by default, external command templates, embedded ConPTY after v1 | Decided |
| D6 | 2026-10-13 | One typed command system for shortcuts, palette, menus, drawer, macros and plugins | Proposed |
| D7 | 2026-10-13 | Delete goes to the Recycle Bin; permanent delete only with Shift+Del and a confirmation; plan-then-act for every file operation | Proposed |
| D8 | 2026-10-13 | No scripting language in v1; macros are sequences of commands | Proposed |
| D9 | 2026-10-13 | Global search uses Everything when installed; an own NTFS index comes later | Proposed |
| D10 | 2026-10-13 | Portable mode when `rusty.toml` sits next to the executable | Proposed |
