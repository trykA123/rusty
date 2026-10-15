# P15 A1 · Viewer kinds, read-only by default, Lister keys, no file I/O on the UI thread

Role: `ui-builder-high` (Opus, high). Worktree `<worktrees>/rusty-p15`, branch `p15-viewer`. Commit on this branch when the gate passes (stage files explicitly; the commit message ends with exactly one trailer line: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`). Do not push.

Build with `CARGO_TARGET_DIR=<targets>/p15` on every cargo command (the orchestrator gives you the absolute path). Never use another target dir.

## Goal

F3 becomes a real viewer, the base for many viewer kinds (P15 A3–A8, P16):
- it opens read-only;
- it uses Total Commander Lister keys;
- it never touches the disk on the UI thread;
- it picks a viewer kind from a registry that later atoms extend.

Plan: `plans/2026-10-15-p15-viewer.md`. D1, D2, D3 and D4 are final; D4 (real paths) is already done in `rusty-app` by the orchestrator.

## Read first

- `plans/2026-10-15-p15-viewer.md` and `plans/2026-10-15-audit.md` (findings 4, 6 and the UX notes on F3).
- `crates/rusty-ui/src/window_view/viewer/**`: the P12 editor mode, the P13 paged and hex view, `modes.rs`, `files.rs` (hooks), `keys_bar.rs` (bottom-bar keys), and the tests.
- `crates/rusty-app/src/files/{mod.rs,paged.rs}`: the real hooks.
- gpui-component's input and editor sources in the cargo registry (`gpui-component-0.7.3/src/input/{state.rs,search.rs,mod.rs}`): read-only mode, its search panel, and how to trigger "find next" from outside.
- `~/.agents/rules/code-quality.md`, `rust.md`. Repo rules: files ≤ 400 lines, functions ≤ 50 lines, ≤ 4 parameters, no `unwrap`/`expect`/`panic` outside tests, no explanatory comments. The pitfall notes on key contexts (gpui-kit Root binds `tab`) and on registering window callbacks only in constructors also apply.

## Changes

1. **Hooks move off the UI thread.** In `viewer/files.rs`:
   - Every hook becomes `Arc<dyn Fn … + Send + Sync>`.
   - `pick` is replaced by `head: Arc<dyn Fn(&Location) -> Result<Head, String> + Send + Sync>`, where `Head { bytes: Vec<u8> /* at most 8 KiB */, len: u64 }`.
   - Keep `read`, `write` and `paged`.
   - Every call runs on the background executor. Opening shows the viewer at once with "Opening…", then the content.
   - A read that takes longer than 2 s keeps "Opening… (Esc closes)". Esc closes and drops the result when it arrives.
   - Ctrl+S saves in the background. The header shows "Saving…", then "Saved." or the error, and edits stay possible.
   - Update `rusty-app/src/files` to the new hook types. That is the one allowed edit outside `rusty-ui`; keep it minimal: `head` reads the first 8 KiB and the length through the existing `path_of`.
2. **Viewer kinds registry** (`viewer/kinds.rs`).
   - A `ViewerKind` (trait or struct of fns) has: `id`, `name`, `slot` (`Text = 1`, `Hex = 3`, `Rich = 5`), and `score(&Sniff) -> u8`, where `Sniff { head, name, len }`.
   - `Kinds::choose(&Sniff)` returns the accepting kinds, best first.
   - Register two kinds now:
     - **Text:** high score for text without NUL. Files up to 16 MB open in the editor, larger ones in paged text.
     - **Hex:** accepts everything, scores high for binary data.
   - The app's current rules (NUL or UTF-16 BOM means hex, over 16 MB means paged) become the scores. UTF-16 handling itself comes in A2.
   - Design the registry so A3–A8 and P16 only add a kind. One file per kind, no edits to a central `match`.
3. **Read-only by default** (D2).
   - The editor opens with `readonly(true)`. Ctrl+E switches to editing (text ≤ 16 MB only); the header shows "Editing".
   - In read-only mode, Ctrl+S does nothing. Esc never warns, because there is nothing unsaved.
4. **Lister keys in the Viewer context.**
   - In read-only mode, `1` and `3` switch slots (`5` is reserved for rich kinds and does nothing yet).
   - Alt+1, Alt+3 and Alt+5 always work, including while editing.
   - F3 finds the next match of the last search. Shift+F3 finds the previous one. With no search yet, F3 opens Ctrl+F.
   - In the editor, drive its own search from outside if gpui-component allows it. If it does not, report exactly what is missing and make F3 open its search panel.
   - `n` and `p` open the next or previous file in the active pane's listing, skipping folders, without closing the viewer. The cursor in the pane follows.
   - Esc closes. While editing, Esc warns about unsaved changes, as today.
   - The bottom bar (`keys_bar.rs`) shows the keys for the current state, including Ctrl+E Edit, 1 Text, 3 Hex, F3 Next and n/p.
5. **Paged rows never read on the UI thread.**
   - Rows for the screen (`top`, row count, kind) are computed by a background task into a row cache. `draw` reads only the cache. A row not yet loaded draws as an empty, muted line.
   - Scrolling queues a new fill and cancels or ignores stale fills.
   - Keep the existing tests passing, and adapt them to wait with `run_until_parked`.

## Tests (headless gpui-kit)

- The registry picks Text for UTF-8 text, Hex for a NUL head, and paged text for text over 16 MB. A test kind with a higher score wins (proves the extension point).
- Opening shows "Opening…" before the background read completes, then the content. A blocked `head` hook plus Esc closes the viewer, and a late result is ignored.
- The viewer opens read-only: typing changes nothing, Ctrl+S writes nothing, Esc closes without a warning. Ctrl+E, typing, then Esc warns.
- `1` and `3` switch Text and Hex in read-only mode. In editing mode, `3` types a "3".
- F3 with a previous search moves to the next match in paged text and in hex. Shift+F3 goes back.
- `n` opens the next file and moves the pane cursor; `p` goes back. Folders are skipped.
- Saving runs in the background: a write hook that blocks until released shows "Saving…" first.
- Every existing viewer test keeps passing.

## Check

`cargo xtask gate > <log> 2>&1; echo $?` must print 0. Never pipe the gate. Then commit.

## Stop if

- gpui-component's editor cannot be read-only or searched from outside, and no reasonable workaround exists (report what you found);
- the change needs edits outside `crates/rusty-ui` and the minimal hook update in `crates/rusty-app/src/files`;
- an existing test's intent would have to change.

## Report

Commit hash, files with line counts, tests added, the gate result, deviations, and what later atoms must know about the registry API.
