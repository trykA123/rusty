# P7 · PoC 1: Browse

Status: drafting (briefs get exact `Read` ranges when G6 passes) · Branch: `p7-browse` · After: G6

## Goal

**PoC 1.** Rusty opens a design B window with two panes that browse real folders on Linux and Windows: tabs, path bar, virtual file list, keyboard navigation, Total Commander selection, light and dark themes. Closing and reopening restores the layout and the visible rows before any database opens.

## Decisions

- D25 (component layers on `gpui-kit`), D16 (themes), D15 (selection), D17 (session first frame).
- The app never imports `gpui-kit` outside `rusty-ui/src/primitives/`.
- Theme tokens come from variant 1 of the spike (D27), cleaned into `rusty-ui/src/tokens/`.
- Coverage floor `rusty-ui = 60` added in U1.

## Components

| Component | Layer | Contract | Test |
| --- | --- | --- | --- |
| `tokens` | ui | `Theme { colors, type, spacing, radii }`, light and dark, mapped onto the `gpui-kit` theme | unit: every token defined in both themes; contrast ≥ 4.5:1 for text pairs |
| `primitives` | ui | `Button`, `IconButton`, `Kbd`, `Tabs`, `VirtualList`, `Splitter`, `Tooltip` | headless tests per primitive |
| `file_list` | ui | rows + cursor + selection → render; key and mouse input → commands | headless: navigation, Space, Insert, right-click select, long right-click event |
| `pane_chrome` | ui | `PaneTabs`, `PathBar` | headless |
| `fkey_bar`, `status_bar` | ui | labels from the keymap; counts and sizes | headless |
| `pane_view` | ui (container) | owns listing tasks, generation counter, streams batches into `file_list` | integration with `fake_fs` |
| `window_view` | ui (container) | two panes in a split, rail placeholder, F-key bar | headless + screenshot |
| `gallery` | ui (bin) | every component in every state, both themes | runs; screenshots reviewed |
| `app_wiring` | app | start-up: session → first frame → open databases → list folders; save session on exit | start-up timing test |

## Atoms

| Atom | Component | Tier | Role | Effort | After | Check |
| --- | --- | --- | --- | --- | --- | --- |
| U1 | `tokens` Red | T2 | checker | medium | G6 | tests compile, fail |
| U2 | `tokens` Green | T2 | ui-builder | medium | U1 | `cargo nextest run -p rusty-ui tokens` |
| U3 | `primitives` | T2 | ui-builder | high | U2 | headless tests pass |
| U4 | `gallery` | T2 | ui-builder | medium | U3 | gallery runs; screenshots in both themes |
| U5 | `file_list` Red | T2 | checker | high | U3 | tests compile, fail |
| U6 | `file_list` Green | T4 | orchestrator | high | U5 | headless tests pass; 100k rows smooth |
| U7 | `pane_chrome`, `fkey_bar`, `status_bar` | T2 | ui-builder | medium | U3 | headless tests pass |
| U8 | `pane_view` | T4 | orchestrator | high | U6, U7 | integration with `fake_fs` passes; stale batches dropped |
| U9 | `window_view` | T2 | ui-builder | high | U8 | headless + screenshots at 1100 and 1440 px, both themes |
| U10 | `app_wiring` | T3 | api-builder | xhigh | U9 | start-up test: first frame from session only |
| U11 | PoC check on Windows | — | orchestrator | — | U10 | CI `.exe`; owner browses the work PC |
| G7 | gate | — | orchestrator + reviewer | high | U1–U11 | gate, CI on both OS, review, **PoC 1 demo** |

U5–U6 and U7 run in parallel after U3; U4 runs in parallel with them.

## Done when

- The owner opens `rusty.exe` on the work PC, browses with the keyboard, selects with Space and Insert, closes it, and on reopening sees the same layout immediately.
- Gallery screenshots in both themes match design B.
- `rusty-ui` coverage ≥ 60 %.
