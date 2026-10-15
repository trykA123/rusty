# P15 · A5b brief: search count, Find All, colour marks, scrollbar ticks, bookmarks, line endings, follow (D7 UI)

Role: `ui-builder-high` (Opus 5.5, high). Worktree: `<worktrees>/rusty-p15-a5b`, branch `p15-a5b` (from `main`). Commit on this branch after the gate passes; never push, never merge.

## Goal

D7 in `plans/2026-10-15-p15-viewer.md`, on top of the model and store that A5 merged:
- `rusty_core::paging::{count, ordinal, Counted}`;
- `rusty_core::marks::{MarkSet, Bookmarks, SearchHistory, ticks, MARK_COLOURS}`;
- `rusty_store::Db::{viewer_memory, save_viewer_memory, search_history, remember_search, prune_viewer_memory}`.

The owner asked explicitly for colours, history and scrollbar ticks. Both viewer bodies get the features:
- the paged view (hex, and text over 16 MB);
- the editor body (text up to 16 MB, read-only by default; Ctrl+E edits).

The look must be modern and polished, not a Total Commander clone (decision D41). Use the existing tokens and primitives. No flashing.

## Decided behaviour

- **Count.**
  - The find bar shows "3 of 1,248" while a search is active.
  - Counting runs on the background executor with `count(…, keep = 100_000, …)`.
  - While counting it shows "… of 1,248" with the running total.
  - Past `keep`, or when the current hit is not a kept start, it shows "of 1,248" without the ordinal.
  - A new query or file cancels the running count.
  - Editor body: count over the text's bytes (`[u8]` is a `ByteSource`).
- **History.**
  - Every executed search is pushed to `SearchHistory` and saved through the hooks.
  - Up and Down in the find field walk the history (newest first), as in a shell.
  - History is shared across files and needle kinds; hex searches only offer hex entries in hex mode, text only text.
- **Find All.**
  - Alt+Enter in the find bar opens a panel under the content that lists every match: line number and line preview in text, offset and hex preview in hex.
  - It is virtualised and capped at the kept starts.
  - Up/Down move, Enter jumps there and keeps the panel, Esc closes the panel.
- **Marks.**
  - Ctrl+1…Ctrl+8 marks the current search (the find field's text, or the last search when the bar is closed) with colour 1–8.
  - The same colour again on the same needle removes the mark. Ctrl+0 clears all marks.
  - Marks are drawn as filled highlights:
    - paged rows: extend the existing `with_highlights` path in `paged/draw.rs`;
    - editor: `RangeDecoration` with `RangeDecorationStyle::Fill` and a colour.
  - Mark positions come from `count` per mark, in the background, cached per file and re-run when the file changes.
  - 8 mark colours become new tokens in `rusty-ui/src/tokens`, for light and dark. Generate them with `node ~/.agents/rules/tools/palette.mjs` and check text contrast over each fill with `node ~/.agents/rules/tools/contrast.mjs` (AA for body text).
  - The current find hit keeps its own, stronger style.
- **Scrollbar ticks.**
  - A thin overview strip next to the scrollbar shows ticks from `marks::ticks` for every mark colour, the current search's hits (accent colour) and bookmarks (neutral).
  - It works in both bodies, and clicking a tick jumps there.
- **Bookmarks.**
  - Ctrl+F2 toggles a bookmark at the current line: the cursor line in the editor, the top visible row start in the paged view.
  - F2 goes to the next bookmark and Shift+F2 to the previous one, with wrap.
  - Bookmarked lines show a gutter dot.
- **Line endings.** Alt+L shows line endings (CRLF and LF as faint glyphs) in read-only text, in both bodies. It is a per-viewer toggle.
- **Follow.**
  - Alt+F toggles Follow for paged text: poll the file about once per second through the existing `PagedFile` change detection, and keep the view pinned to the end while it grows.
  - Any manual scroll up pauses Follow, and the header shows "Following" or "Paused".
- **Keys bar.** The viewer's bottom keys bar lists the new keys (`viewer/keys_bar.rs`).
- **Persistence through hooks.** `rusty-ui` must not depend on `rusty-store`. Add to `FileHooks`, using `rusty_core` types and the existing `FileStamp`:
  - `memory: load(&Location, FileStamp) -> Option<(MarkSet, Bookmarks)>`;
  - `save_memory(&Location, FileStamp, &MarkSet, &Bookmarks)`;
  - `history() -> SearchHistory`;
  - `remember(&Needle)`.

  They run on the background executor. `FileHooks::none()` gives no-op versions, and the test hooks record calls. Marks and bookmarks load when a file opens and save when they change (debounced) and on close.

  The app-side wiring to `Db` (`crates/rusty-app`) is **not** part of this atom: leave `rusty-app`'s `hooks()` on the no-op versions. The orchestrator wires `Db` afterwards.

## Read first

- `plans/2026-10-15-p15-viewer.md` (D1–D3, D7, D41 in `docs/decisions.md`), and `plans/2026-10-15/p15-a5-red-brief.md` (the model API).
- `crates/rusty-ui/src/window_view/viewer/`:
  - `mod.rs`, `body.rs` (the `ViewerBody` trait), `files.rs` (`FileHooks`), `lister.rs`, `keys_bar.rs`;
  - `paged/` (find.rs, jobs.rs, draw.rs, view.rs, moves.rs, rows.rs);
  - `editor/` (body.rs `find_in_editor`, mod.rs).
- `crates/rusty-core/src/paging/count.rs`, `crates/rusty-core/src/marks/mod.rs`.
- gpui-base's editor decorations: `~/.cargo/registry/src/index.crates.io-*/gpui-base-0.7.3/src/input/editor/decorations.rs` (`RangeDecoration`, how to set decorations on `EditorState`), and the editor search API used in `find_in_editor`.
- `crates/rusty-ui/src/tokens/`, `primitives/`, and the viewer tests (`viewer/tests/*.rs`) for the headless test pattern.
- `~/.agents/rules/rust.md`, `code-quality.md`, `web-ui.md`. Memory pitfalls:
  - register GPUI window callbacks in constructors, never in render;
  - pane-level keys are actions in a deeper key context;
  - no file I/O on the UI thread (D3).

## Tests (headless, written first)

1. **Count:**
   - "3 of N" appears after a search in hex and in text;
   - a new query cancels the old count;
   - a count past `keep` shows "of N" only.
2. **History:** Up and Down walk it, and an executed search is remembered through the hooks.
3. **Find All:** the panel lists matches; Enter jumps; Esc closes.
4. **Marks:**
   - Ctrl+3 marks the search (paged highlights include the mark ranges; editor decorations include them);
   - Ctrl+3 again removes the mark; Ctrl+0 clears all marks;
   - marks reload from the hooks when the file reopens.
5. **Ticks:** the overview strip gets the expected (row, colour) pairs for a known file and height.
6. **Bookmarks:** Ctrl+F2 toggles; F2 and Shift+F2 move with wrap.
7. **Line endings:** Alt+L toggles the glyphs.
8. **Follow:** appending to the fake file moves the view to the end; scrolling up pauses Follow.
9. **No I/O on the UI thread:** the hooks are only called from background tasks (follow the existing pattern in the open/paged tests).

Screenshots: render the viewer in the gallery or the headless window test harness, in light and dark, with three marks and the Find All panel open. Save them as `design/screens/p15-marks-{light,dark}.png` and look at them. Headless only, **never on the owner's desktop** (no Hyprland outputs or windows).

## Do not touch

- `crates/rusty-core`, `crates/rusty-store` (use their APIs).
- `crates/rusty-app` beyond the minimum to compile with the new `FileHooks` fields.
- Language detection and grammars (A3), `rusty-syntax` (A4), encodings (A2): other worktrees own them.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/p15-a5b
cargo xtask gate > <scratch>/a5b-gate.log 2>&1; echo "gate exit $?"; tail -1 <scratch>/a5b-gate.log
```

It must print `gate exit 0`, and the last line must read `gate: all 9 steps passed`. Never pipe the gate. Then commit: stage files explicitly, and end the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` only. No absolute local paths in committed files.

## Stop if

- `EditorState` offers no way to set range decorations from outside, and no reasonable workaround exists (report what you found);
- the change needs edits in `rusty-core` or `rusty-store`;
- an existing test's intent would have to change.

## Report

Commit hash, keys added, files with line counts, tests added, the screenshots' paths (and what they show), the gate result, deviations, and what the app wiring (`Db` hooks) must provide.
