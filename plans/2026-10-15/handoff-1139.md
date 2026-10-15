# Handoff · 2026-10-15 11:39 (Europe/Bucharest)

The owner is compacting the context. This file replaces `handoff-0825.md`. **No agents are running.** One CI run is in progress: `main` at `96d837a`, run 38707104637. It builds the `ferrite.exe` that includes folder sizing.

## Rules in force (owner)

- **Reply in Romanian.** Docs and code stay in English. Plain, short answers. When the owner must download or run something, give numbered steps with direct links.
- **Windows only for now** ("muta tot focusul pe windows acum, linux poate sa ramana mai tarziu").
  - CI `gate-linux` and `build-linux` run only on manual `workflow_dispatch`.
  - A Linux failure never blocks.
  - The local gate still runs on the Linux dev box.
- **Continuous work.**
  - Run plans in parallel where the code allows.
  - Merge to `main` only after a gate (reviewer PASS).
  - Delete branches once merged: only `main` and active branches stay on GitHub.
- **Models**
  - D34: Red atoms run on `checker`, Opus medium.
  - D35: Claude only. No Sol, Codex, Gemini or `mcp__crew__run`.
  - Backend Green atoms go to a `general-purpose` agent on Opus medium.
  - Core and data-safety Green atoms are the orchestrator's (Opus high).
  - Hard UI goes to `ui-builder-high` (Opus high).
  - Reviewers run on Opus high.
- **Push hook.** Before `git push`, run these two as separate commands, with no pipe and no edits after them:
  - `cargo clippy --all-targets -- -D warnings`
  - `cargo test`

  Piping their output does not count.
- **Commits.** Commit only after checking the gate's exit status on its own. Never chain `git commit` after a piped gate: that committed twice on a failed gate today.
- **GUI.** Never open windows or add outputs on the owner's Hyprland desktop. Run headless cage only:

  ```
  env -u WAYLAND_DISPLAY -u DISPLAY WLR_BACKENDS=headless WLR_LIBINPUT_NO_DEVICES=1 cage -s -- <script>
  ```

  The script starts the app, sleeps, then runs `grim`.
- **Paths and targets.**
  - Coverage: `LLVM_COV=/usr/bin/llvm-cov LLVM_PROFDATA=/usr/bin/llvm-profdata`.
  - One `CARGO_TARGET_DIR=<targets>/<name>` per worktree.
  - No Windows Rust target is installed locally, so Windows code is checked only by CI.

## State

- **`main` is at `96d837a`, pushed.** The only branch on GitHub is `main`. The only worktree is the main checkout.
  - It holds P1–P7.
  - 1537 tests; the local gate is green.
  - Coverage: core 99 %, fs 96 %, store 94 %, diag 96 %, ui 95 %.
- **P5 (diagnostics) is done.** G5 took five review rounds.
  - Known accepted limit: free-text redaction is heuristic. Names reach logs only through path fields.
- **P6 (locations and file systems) is done; G6 passed.**
  - `LocalFs` is built on `std::fs`, with no unsafe code.
  - The I/O queue, the hostile-name corpus and the escape-quoting fix are in.
- **P7 (PoC 1, browse) is done.**
  - G7 passed after fixes.
  - **The owner tested the Windows exe at work: everything works.** The one remark was "Marcat nu a zis exact cat are folder-ul respectiv". That is now done in `96d837a`: Space sizes marked folders.
  - The `.exe` the owner tested came from run 38700966030.
- **G2 passed: GO on GPUI (D2).** Narrator reads nothing on the list; the owner does not need a screen reader now.
- **D36: custom title bar.** It is built on gpui-kit's `TitleBar`. The owner confirmed it works on Windows: snap layouts, drag, double-click.

## Architecture notes (new today)

- **`rusty-ui`** is the only crate that depends on GPUI. It holds:
  - tokens, primitives, title bar, file list, pane chrome, the F-key and status bars;
  - `browser::Browser`, the controller;
  - `window_view` (`run(StartOptions)`).
- **`rusty-app`**:
  - `ferrite` without arguments opens the window;
  - `--version` and `--diag-report` attach to the parent console;
  - release builds use the Windows GUI subsystem.
- **Session:** `%LOCALAPPDATA%\Ferrite\session.bin`; config goes in `%APPDATA%\Ferrite` (`StoreDirs`).
- **Listing data:**
  - The core `Entry` holds only the name (lossless text form) and `is_folder`.
  - Display details (`FsEntry`) live row-aligned in `Browser.details`.
- **Vendored backend:** `vendor/gpui-pre-windows` carries the low-power GPU patch. It is excluded from the workspace, `typos` and `taplo`.
- **`deny.toml`:**
  - allows `0BSD`;
  - ignores five *unmaintained* advisories reached only through gpui-kit (instant, paste, rustls-pemfile, rustybuzz, ttf-parser). Recheck them on every gpui-kit update.
- **GPUI pitfall:** never register window callbacks during render (`on_window_should_close` and similar). On Wayland it panics with a RefCell re-borrow. Register them once, in the view constructor.
- **Tab** is a `FileList` action, because gpui-kit's Root binds `tab` globally.

## Next steps (suggested order)

1. **When run 38707104637 is green,** give the owner the exe link (Artifacts section) and ask them to check that Space sizes a folder.
2. **P7 deferred items** (recorded in the P7 plan Log):
   1. The first frame does not yet show the session's cached rows (D17).
   2. A symlink that points to a file is treated as openable. Fix it by resolving link targets in `LocalFs`.
   3. A superseded listing is never cancelled. Fix: one owner per request.
   4. The stale-answer browser test needs a gated fake.
   5. The Linux close button is checked by hand only.
   6. Long paths clip at the end of the path bar; it should show the tail.
   7. Dragging the scrollbar sends no `PaneScroll`.
3. **Next plan: P8.** Read `plans/` for P8, file operations and the job engine. That is data-safety work, so the orchestrator builds it on Opus high. Also pick up the deferred P4 items:
   - the job journal with `synchronous = FULL`;
   - stale temp-file cleanup;
   - Windows retry on sharing violations;
   - the unclean-exit marker and the single-instance mutex.
4. **G2 follow-ups:**
   - a resident tray mode for warm start;
   - measure Windows private bytes;
   - a longer Intel scroll run;
   - Narrator support.
5. **Owner action still open:** `/crew sync`.

## Owner downloads

- PoC 1 exe, tested OK: https://github.com/trykA123/rusty/actions/runs/38700966030
- With folder sizing (pending): https://github.com/trykA123/rusty/actions/runs/38707104637
