# P14 A3 · Drive bar, drive menu, typed paths and the waiting state (UI)

Role: `ui-builder-high` (Opus, high). Worktree `<worktrees>/rusty-p14`, branch `p14-drives`. Commit on this branch when the gate passes (stage files explicitly). Do not push.

Build with `CARGO_TARGET_DIR=<targets>/p14` on every cargo command. Never use another target dir: the disk is shared.

## Goal

The owner switches drives the Total Commander way, reconnects mapped network drives, types any path with Ctrl+L, and never sees a frozen pane on a dead network share. Plan: `plans/2026-10-15-p14-drives.md`; decisions D1–D8 are final.

## Read first

- `plans/2026-10-15-p14-drives.md`
- `crates/rusty-core/src/location/{parent.rs,typed.rs}`: `Location::root` and `typed_location`. They are done and tested; use them and do not change them.
- `Command::PaneGoDrive { root }` in `crates/rusty-core/src/apply/pane.rs` (done).
- `crates/rusty-ui/src/window_view/{mod.rs,pane.rs,editor.rs,prompt.rs}`: how hooks are passed in `StartOptions`, how the pane is drawn, and how prompts work.
- `crates/rusty-ui/src/pane_chrome/` (`PathBar`, `PaneTabs`) and `crates/rusty-ui/src/browser/mod.rs`: listing requests, `focus_after_load`, errors.
- `crates/rusty-ui/src/window_view/viewer/paged/jobs.rs`: the background task and throttling pattern from P13.
- `crates/rusty-ui/src/assets.rs` and the Lucide icons already embedded. Add `hard-drive`, `usb`, `network` (or `server`), `disc`, `memory-stick` the same way.
- `~/.agents/rules/code-quality.md` and `rust.md`. Repo rules: files ≤ 400 lines, functions ≤ 50 lines, ≤ 4 parameters, no `unwrap`/`expect`/`panic` outside tests, no explanatory comments.
- Memory notes:
  - gpui-kit's Root binds `tab` globally, so pane-level keys must be actions in a deeper key context.
  - Register window callbacks in constructors, never during render.

## Hooks (rusty-ui must not depend on rusty-shell; the app maps shell data, atom A4)

```rust
pub enum DriveIcon { Fixed, Removable, Network, Optical, Ram, Unknown }

pub struct DriveInfo {
    pub root: Location,
    pub letter: Option<char>,
    pub icon: DriveIcon,
    pub label: Option<String>,
    pub remote: Option<String>,
    pub connected: bool,
    pub space: Option<(u64, u64)>, // (total, free)
}

pub struct DriveHooks {
    pub refresh: Arc<dyn Fn() -> Vec<DriveInfo> + Send + Sync>,
    pub reconnect: Arc<dyn Fn(char, &str) -> Result<(), String> + Send + Sync>,
}
```

- Export these from `window_view` and add `drives: DriveHooks` to `StartOptions`.
- `DriveHooks::none()` returns an empty list and an error.
- Fix every `StartOptions` literal, including the gallery and tests. `rusty-app` gets a temporary `DriveHooks::none()` in the same commit, so the workspace builds. I replace it in A4.

## Behaviour

1. **Drive list.** At start and then every 2 s, run `refresh` on the background executor. Replace the stored list only when it changed, then notify. `refresh` may take seconds; never call it on the UI thread.
2. **Drive bar (D1).** A slim row above each pane's path bar, one button per drive.
   - Label: the letter (`C`), or the label for drives without a letter (Linux mounts; `/` shows as `/`).
   - Icon by `DriveIcon`. The drive holding the pane's current location is accented (compare `location.root().same_place(&drive.root)`). Disconnected drives are dimmed.
   - Under each button, a 2 px usage bar (used / total) when `space` is known. It turns to the warning colour above 90 % full.
   - Tooltip: label, kind, "N free of M" with the app's size format, and the UNC remote when known.
   - Clicking focuses that pane, then dispatches `pane.go-drive` with the drive's root.
   - Clicking a disconnected drive runs `reconnect(letter, remote)` in the background. The bar shows a busy state on that button. On Ok it dispatches go-drive; on Err the message shows in that pane's status or error line.
   - The bar must look right with 2 and with 12 drives. When the pane is narrow, the bar scrolls sideways; it never wraps.
3. **Drive menu (D3).** Alt+F1 opens it for the first pane, Alt+F2 for the second (in layout order; with one pane, both keys open it for that pane).
   - It is a small popover under that pane's drive bar. Each row shows icon, letter, label, a free-space bar and "N free of M"; disconnected rows say "Disconnected · \\server\share".
   - Up/Down move, typing a letter selects that drive, Enter opens it (same as a click), Esc closes. The current drive is preselected.
4. **Typed paths (D7).** Ctrl+L, or a click on the path bar's empty area, turns that pane's path bar into an input with the full path selected.
   - Enter runs `typed_location(input, current, env)`, with `env` reading `std::env::var`. An `Err` shows inline under the input, which stays open.
   - On `Ok(location)`, decide folder or file without blocking the UI thread: ask the provider's `metadata` on the background executor (or through the browser's I/O queue). A folder navigates there. A file navigates to its parent with the cursor on that file (use the existing `focus_after_load`). If it does not exist, show "Not found" inline.
   - If `metadata` takes longer than 2 s, close the input and navigate anyway. The waiting state (5) then covers it.
   - Esc cancels and returns focus to the file list.
5. **Waiting state (D8).** When a pane's listing request is still pending 2 s after it started, the file list area shows a quiet line: "Waiting for <path>…" and below it "Esc goes back".
   - Esc in that state dispatches `pane.back`. The old request is superseded, as the browser already ignores stale requests.
   - When the listing arrives, the line disappears.
   - Nothing blocks the UI thread while waiting.

## Tests (gpui-kit headless; new files beside the code; each file ≤ 400 lines)

Use test `DriveHooks` with a fixed list, for example C: Fixed, D: Removable, Z: Network disconnected, and the fake file system the window tests already use.

- The drive bar shows one button per drive. The current drive is marked. A disconnected drive is marked dimmed (assert through test ids or labels).
- Clicking D dispatches go-drive. The pane's location becomes D's root, or its last folder when history has one.
- Clicking the disconnected Z calls `reconnect` once with `('Z', remote)`. On Ok the pane opens Z; on Err the message is shown.
- Alt+F1 opens the menu for the first pane; typing `d` then Enter opens D in that pane. Alt+F2 targets the second pane. Esc closes the menu without navigating.
- Ctrl+L opens the path input with the current path.
  - A typed folder navigates.
  - A typed file opens its folder with the cursor on the file.
  - A bad path (`%NOPE%`) keeps the input open with the error.
  - Esc closes it.
- A provider whose `list` blocks for a folder shows "Waiting for" after the 2 s timer. Drive the timer with the test executor; do not sleep for real. Esc goes back to the previous folder.
- Every existing test keeps passing.

## Screenshots

Add the drive bar and the open drive menu to `rusty-ui-gallery`. Use about 6 sample drives: C fixed at 35 %, D fixed at 93 %, E removable, Z network, Y network disconnected, R optical.

Capture only in headless cage, never on the owner's desktop:

```
env -u WAYLAND_DISPLAY -u DISPLAY WLR_BACKENDS=headless WLR_LIBINPUT_NO_DEVICES=1 cage -s -- <script>
```

Save `design/screens/p14-drives-{light,dark}.png` (two panes with drive bars, one menu open) and `design/screens/p14-path-{light,dark}.png` (path input open with an inline error). Look at them before reporting.

## Check

`cargo xtask gate > <log> 2>&1; echo $?` must print 0. Never pipe the gate. Then commit.

## Stop if

- a core function behaves against the plan;
- the change needs edits outside `crates/rusty-ui`, `crates/rusty-ui-gallery`, `design/screens`, and the one-line `DriveHooks::none()` in `crates/rusty-app`;
- an existing test's intent would have to change.

## Report

Commit hash, files with line counts, tests added, the gate result, the screenshot paths with a line each, and anything deferred.
