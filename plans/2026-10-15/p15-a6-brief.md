# P15 · A6 brief: images in F3 (D8)

Role: `ui-builder-high` (Opus 5.5, high). Worktree: `<worktrees>/rusty-p15-a6`, branch `p15-a6` (from `main`). Commit on this branch after the gate passes; never push, never merge.

## Goal

D8 in `plans/2026-10-15-p15-viewer.md`: an Image viewer kind in the Rich slot (key 5). It must feel modern and fast. Ferrite is not a visual clone of Total Commander (D41).

- **Formats:**
  - PNG, JPEG, GIF (first frame is enough; animation is welcome if GPUI plays it cheaply), WebP, BMP, ICO, TIFF;
  - SVG, rendered with `resvg`, which GPUI already uses.
- **Viewing:**
  - Fit to window by default. `0` or `Ctrl+0` fits, `1` shows 100 %, `+`/`-` and Ctrl+wheel zoom around the pointer, arrows or drag pan.
  - Shown on a neutral checkerboard for transparency, which respects the theme.
- **Navigation:** `n`/`p` (already Lister keys) and Space/Backspace move to the next or previous image in the folder. Skip non-images.
- **Info:**
  - The header shows name, dimensions, format, file size and zoom %.
  - `i` toggles a side panel with basic EXIF from `kamadak-exif` (pure Rust, small): camera, lens, date taken, exposure, ISO, focal length, GPS as text, orientation.
  - Apply the EXIF orientation when drawing.
- **Large images:**
  - Decode on the background executor (D3) through a new `FileHooks` entry, `bytes: Fn(&Location, limit) -> Result<Vec<u8>, String>` with a 256 MB cap.
  - If another worktree (A8) adds the same hook, keep the same name and signature so the merge is trivial.
  - Downscale for display when the image is far larger than the window, and keep memory bounded (one full image at a time).
  - Show "Opening…" past 2 s, as the other kinds do.

## Decided rules

- **Code layout:**
  - The kind goes in `viewer/kinds/image.rs` (plus a small `viewer/image/` module for the view if it grows), with one line in `Kinds::builtin()`.
  - The sniff scores high for image magic bytes and extensions, and stays below Text for text files. Hex stays reachable with key 3.
- **Decoding:** use what is already in the dependency tree where possible: GPUI's image support, `image` 0.25.10 and `resvg` 0.45.1 are already in `Cargo.lock`.
- **Exe size:** the Windows exe is about 81.8 MB against an 83.9 MB (80 MiB) CI limit, and raising the limit is the owner's decision.
  - Measure the release `ferrite` binary before and after with `cargo xtask binsize <path>` (Linux build), and report the delta.
  - Avoid new heavy decoders.
- **Tokens, motion, photosensitivity:** use the existing tokens and primitives. Zoom may animate briefly, with reduced-motion respected. No flashing.

## Read first

- `plans/2026-10-15-p15-viewer.md` (D1, D3, D8), `docs/decisions.md` (D41).
- `crates/rusty-ui/src/window_view/viewer/`: `kinds.rs`, `kinds/{text,hex}.rs`, `body.rs`, `files.rs`, `mod.rs`, `lister.rs` (n/p), `keys_bar.rs`, `tests/`.
- `crates/rusty-app/src/files/` (hooks wiring).
- GPUI's image element and `ImageSource`/`RenderImage` APIs in `vendor/gpui-pre-windows` and gpui-kit.
- `~/.agents/rules/rust.md`, `code-quality.md`, `web-ui.md`.
- The strict clippy config: excessive_nesting, too_many_arguments (max 4), too_many_lines, no unwrap/expect/panic outside tests.
- Memory pitfalls:
  - register GPUI window callbacks in constructors, never in render;
  - pane-level keys are actions in a deeper key context.

## Tests (headless, written first)

1. Sniff: every format picks Image; text and binary files do not.
2. Opening a PNG through the hooks shows its dimensions and format in the header. Decoding happens off the UI thread.
3. Fit, 100 %, zoom in and out change the zoom %; panning clamps at the edges.
4. `n`/`p` skip non-images and wrap or stop at the ends (pick one and document it).
5. The EXIF panel lists fields from a small JPEG fixture made in the test (or a tiny committed fixture under 20 KB), and the orientation is applied.
6. A corrupt image shows a clear message, not a panic.
7. Screenshots: headless only, never on the owner's desktop. Save `design/screens/p15-image-{light,dark}.png` (with the EXIF panel open in one) and look at them.

## Do not touch

The paged and editor bodies (A5b), the archive and font kinds (A8, another worktree), encodings (A2), `rusty-core` and `rusty-store`.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/p15-a6
cargo xtask gate > <scratch>/a6-gate.log 2>&1; echo "gate exit $?"; tail -1 <scratch>/a6-gate.log
```

It must print `gate exit 0`, and the last line must read `gate: all 9 steps passed`. Never pipe the gate. Then commit: stage files explicitly, and end the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` only. No absolute local paths in committed files.

## Stop if

- GPUI cannot show a decoded image from memory (report what you found);
- the work needs a C library;
- an existing test's intent would have to change.

## Report

Commit hash, keys, crates added and their size impact, the exe size before and after, files with line counts, tests, screenshot paths, gate result, and deviations.
