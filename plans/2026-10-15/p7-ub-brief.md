# P7 · UB brief: `title_bar` (D36)

Role: `ui-builder-high` (Opus, high). Worktree: `<worktrees>/rusty-p7-ub`, branch `p7-ub` (from `p7-browse` after UA). Do not commit; the orchestrator does.

## Goal

The owner wants the window's top bar to look like the app, not like the native Windows caption. The native caption is black, has the default icon and says "Ferrite spike".

Ferrite draws its own title bar, merged with the header row of design B:
- left: the `fe_` app icon (D33) and the word "Ferrite";
- middle/right: the header's content, which is the search box "Find anywhere: files, folders, commands" with its `Ctrl+K` hint, as in `spikes/gpui-b/src/top_bar.rs`;
- far right: minimise, maximise/restore and close, in the theme's colours. Close turns red on hover, as Windows does.

Windows must keep its window behaviour:
- **Snap layouts** appear when the pointer hovers over maximise.
- Dragging the empty title bar moves the window.
- Double-clicking the empty title bar maximises or restores it.
- The resize edges work.

**Windows is the target** (owner, 2026-10-15). Linux only needs to compile and look acceptable.

## Read first

- `docs/decisions.md` D33 and D36; `plans/2026-10-14-p7-poc-browse.md`.
- `crates/rusty-ui/src/` (UA's `tokens` and `primitives`; use them).
- `spikes/gpui-b/src/top_bar.rs` and `spikes/gpui-b/screens/s2-*.png` for the header look.
- **`gpui-component` 0.7.3 `src/title_bar.rs`** (in `~/.cargo/registry/src/*/gpui-component-0.7.3/`). It already:
  - sets `WindowControlArea::{Drag, Min, Max, Close}` for Windows hit-testing and snap layouts;
  - provides `TitleBar::window_options()`.

  Wrap it; do not reimplement the Win32 side.
- `assets/brand/`, for the icon SVGs and PNGs.

## Decided

- Add a `title_bar` module in `rusty-ui` with `FerriteTitleBar`. Its props:
  - the window title;
  - a slot for header content;
  - an `on_close` hook.

  Build it on `gpui_kit` `TitleBar`, styled with our tokens in both themes.
- Add `rusty_ui::window_options()`, built on `TitleBar::window_options()`, which the app will use for every window.
- Embed the icon in the binary: the SVG or a 32 px PNG from `assets/brand/` through `include_bytes!` and GPUI's asset source, or the way the spike loads icons.
- Show the title bar in the gallery (UA), in both themes.

## Tests

1. **Headless:**
   - the title bar renders the title and the three buttons;
   - each button has its `WindowControlArea`;
   - the drag area is set.

   Use `test_support()` element snapshots as UA and the spike do.
2. **Screenshots** in headless cage only. **Never open a window on the owner's desktop and never add outputs.** Take light and dark at 1280×720 and save them as `design/screens/p7-titlebar-{light,dark}.png`. Look at them yourself.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/rusty-p7-ub
cargo nextest run -p rusty-ui -p rusty-ui-gallery --no-fail-fast 2>&1 | tail -15
cargo clippy --workspace --all-targets -- -D warnings 2>&1 | tail -3
```

D31 (no `unwrap`, `expect` or `panic` outside tests). Files ≤ 400 lines, functions ≤ 50. Run `cargo fmt`.

## Stop and report

Report:
- the files, the API, the test count and the check tails;
- the screenshot paths;
- what still needs a check on a real Windows desktop (snap layouts, drag, double-click), as a numbered list the owner can follow.
