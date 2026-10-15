# P8 · O10 brief: `confirm_dialog` and `job_row`

Role: `ui-builder` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p8-o10`, branch `p8-o10` (from `p8-operate`). Do not commit; the orchestrator does.

## Goal

Two pure view components in `rusty-ui`, built test-first. Both take props and send callbacks; neither holds any I/O or state of its own.

1. **`confirm_dialog`:** shown before a risky operation. Before a permanent delete (Shift+Del), the warning lists the count, the total size and the first paths. **Enter is never the default action there.**
2. **`job_row`:** one running or finished job, with a progress bar and a cancel button. It sits in a jobs strip, at the bottom or in the drawer (Transfers), as in the spike's drawer.

## Read first

- `plans/2026-10-14-p8-poc-operate.md`; `docs/architecture.md` "Safety" → "Destructive operations" (the Shift+Del warning, typed confirmation for protected locations, keyboard guards); `docs/decisions.md` D7, D25.
- `crates/rusty-ui/src/` (`tokens`, `primitives` (Button, ButtonVariant, Kbd, icons), `file_list` for the props-in/callbacks-out pattern and headless tests, `test_window.rs`).
- The spike drawer and Transfers look: `spikes/gpui-b/src/drawer.rs`, `spikes/gpui-b/screens/s2-*.png`.
- `~/.agents/rules/rust.md`, `code-quality.md`, `web-ui.md` (contrast; no flashing).

## Decided API (adjust names if a better one fits, and report it)

```rust
// confirm_dialog
pub struct ConfirmProps {
    pub title: SharedString,            // "Delete 3 items permanently?"
    pub lines: Vec<SharedString>,        // first paths, max 5 shown, then "and N more"
    pub more: u64,                      // count beyond the shown lines
    pub summary: SharedString,          // "3 files, 1 folder · 12,345 B"
    pub confirm_label: SharedString,    // "Delete permanently"
    pub danger: bool,                   // permanent or protected: red confirm button, focus starts on Cancel
    pub typed: Option<SharedString>,    // when Some(word), Confirm stays disabled until that exact word is typed (protected locations)
}
pub struct ConfirmDialog::new(id, props).on_confirm(Fn(&mut Window,&mut App)).on_cancel(Fn(&mut Window,&mut App))

// job_row
pub enum JobRowState { Running, Done, Failed(SharedString), Cancelled }
pub struct JobRowProps {
    pub title: SharedString,            // "Copying 12 files to D:\Backup"
    pub current: Option<SharedString>,  // the file in progress
    pub bytes_done: u64, pub bytes_total: u64,
    pub files_done: u64, pub files_total: u64,
    pub state: JobRowState,
}
pub struct JobRow::new(id, props).on_cancel(Fn(&mut Window,&mut App))
```

- **Keys in the dialog:**
  - Esc cancels.
  - Tab moves between Cancel and Confirm.
  - Enter activates the **focused** button.
  - With `danger`, focus starts on **Cancel**, so Enter alone never confirms. Without `danger`, focus starts on Confirm.
- **Typed confirmation:** a text field shows `Type DELETE to confirm` (the word comes from `typed`). Use the `gpui-kit` input (`gpui-component` `Input`/`InputState`) through a small primitive wrapper.
- **Job row:**
  - the progress bar shows bytes done out of bytes total (0 % when the total is 0);
  - the text reads "1.2 GB of 3.4 GB · 4 of 12 files", with sizes in the spike's style;
  - Cancel shows only while the job is `Running`;
  - Failed shows its message in the warning colour.
- Show a short spinner or animation only if the spike already has one. No flashing (`web-ui.md` photosensitivity rule).

## Tests (headless, written first)

1. **Dialog:**
   - it renders the title, at most 5 lines plus "and N more", and the summary;
   - Esc cancels;
   - with `danger`, Enter right away cancels and does not confirm;
   - Tab, then Enter, confirms;
   - without `danger`, Enter confirms;
   - with `typed`, Confirm is disabled until the exact word is typed, and the word is case-sensitive.
2. **Job row:**
   - the bar fraction follows the bytes;
   - a total of 0 gives 0 %;
   - Cancel is visible and works only while running;
   - Done, Failed and Cancelled render their states.
3. **Gallery:** add both components to the gallery's pane or primitives page, in each state, and include them in the screenshots. Screenshots go in headless cage only; **never on the owner's desktop**. Save them as `design/screens/p8-confirm-{light,dark}.png` and look at them.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/rusty-p8-o10
cargo nextest run -p rusty-ui -p rusty-ui-gallery --no-fail-fast 2>&1 | tail -15
cargo clippy --workspace --all-targets -- -D warnings 2>&1 | tail -3
```

D31 (no `unwrap`, `expect` or `panic` outside tests). Files ≤ 400 lines, functions ≤ 50, ≤ 4 parameters. `cargo fmt`. `typos` must pass.

## Stop and report

Report:
- the files and the API;
- the test count and the check tails;
- the screenshot paths;
- every decision the brief left open.
