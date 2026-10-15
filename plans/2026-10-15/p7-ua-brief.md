# P7 · UA brief: `tokens`, `primitives` and `gallery` (U1–U4 as one atom)

Role: `ui-builder-high` (Opus, high). Worktree: `<worktrees>/rusty-p7-ui`, branch `p7-ui` (from `p7-browse`). Do not commit; the orchestrator does.

## Why one atom

The owner wants a testable PoC 1 today. U1–U4 merge into one atom. Work test-first inside it: write each module's tests, see them fail, then make them pass.

## Goal

`crates/rusty-ui` gets:

1. **`tokens`:** the design B theme (spike variant 1, D27) for light and dark, as `Theme { colors, type, spacing, radii }`. It is applied to the `gpui-kit` theme (`ThemeRegistry` / `Theme::change`, as the spike does).
2. **`primitives`:** `Button`, `IconButton`, `Kbd`, `Tabs`, `VirtualList` (fixed-height rows over `uniform_list`), `Splitter` (two panes, draggable) and `Tooltip`. Each is a thin wrapper over `gpui-kit` with our tokens.
3. **`gallery`:** `crates/rusty-ui-gallery` shows every primitive in every state, with a light/dark toggle.

Later atoms build the title bar, the file list, the pane chrome and the window on top of these. Keep the public API small and obvious.

## Read first

- `plans/2026-10-14-p7-poc-browse.md` (whole) and `docs/decisions.md` D16, D25, D27, D32 (Lucide icons) and D36.
- The spike, which is the visual source of truth:
  - `spikes/gpui-b/src/tokens/` (`mod.rs`, `faithful.rs`, `kit.rs`), `primitives.rs` and `top_bar.rs`;
  - `spikes/gpui-b/src/tests.rs` for the headless test pattern (`#[gpui_kit::test]`, the `test-support` feature);
  - `docs/spike/gpui-kit-notes.md`;
  - the screenshots `spikes/gpui-b/screens/s2-*.png`.
- `design/` for the prototype, if a value is unclear.
- `~/.agents/rules/rust.md`, `code-quality.md` and `web-ui.md` (colour and contrast rules: OKLCH, text pairs ≥ 4.5:1).

## Decided

- `rusty-ui` is the only crate that depends on `gpui-kit`. `rusty-app` uses `rusty-ui`'s API, and `rusty-ui` re-exports what the app needs.
- Port the spike's values faithfully: the same colours and the same Inter/mono font choices. Do not invent a new look.
- Lucide icons (D32). Use the icon set `gpui-kit` ships, if it is Lucide, as the spike does.
- Dev-dependency: `gpui-kit = { version = "=0.7.3", features = ["test-support"] }`.
- Coverage floor: add `rusty-ui = 60` to `xtask/coverage-floors.toml`.
- Lints: `rusty-ui` keeps `#![forbid(unsafe_code)]` and follows D31 (no `unwrap`, `expect` or `panic` outside tests). Files ≤ 400 lines, functions ≤ 50, ≤ 4 parameters (use a props struct).

## Tests (write them first)

1. **Tokens:**
   - every token is defined in both themes;
   - every text/background pair the theme uses meets 4.5:1 contrast, computed in code (the WCAG relative-luminance formula; add a small helper with its own unit tests);
   - the light and dark themes differ;
   - applying a theme sets the `gpui-kit` theme mode.
2. **Primitives** (headless): each renders, and its main interaction works:
   - `Button` click fires;
   - `Tabs` selection changes the active tab;
   - `VirtualList` with 100,000 rows renders only the visible rows and `scroll_to` reaches the last one;
   - `Splitter` keeps its ratio within 0.1–0.9;
   - `Kbd` shows its text.
3. **Gallery:**
   - it builds and opens a window in a headless test;
   - add a `--screenshot <dir>` mode that renders both themes and exits.

## Screenshots

Run only in headless cage. **Never open a window on the owner's desktop and never add Hyprland outputs.**

```sh
env -u WAYLAND_DISPLAY -u DISPLAY WLR_BACKENDS=headless WLR_LIBINPUT_NO_DEVICES=1 cage -s -- sh -c '<start the gallery>; sleep 3; grim <file>.png'
```

The output is 1280×720. Save `design/screens/p7-gallery-light.png` and `p7-gallery-dark.png`. Look at both screenshots yourself before reporting, and compare them with the spike's.

## Rules

- Run `export CARGO_TARGET_DIR=<targets>/rusty-p7-ui`.
- Run `cargo fmt`. `cargo clippy --workspace --all-targets -- -D warnings` must be clean.
- Do not touch `rusty-core`, `rusty-fs`, `rusty-store`, `rusty-diag` or `rusty-app`.

## Check

```sh
cargo nextest run -p rusty-ui -p rusty-ui-gallery --no-fail-fast 2>&1 | tail -15
cargo clippy --workspace --all-targets -- -D warnings 2>&1 | tail -3
```

## Stop and report

Report:
- the files and the public API, one line per type;
- the test count by module and the check output tails;
- the screenshot paths, with one sentence on how they compare with the spike;
- every decision you took that the brief left open.
