# P7 · UC brief: `file_list`, `pane_chrome`, `fkey_bar`, `status_bar` (U5–U7 as one atom)

Role: `ui-builder-high` (Opus, high). Worktree: `<worktrees>/rusty-p7-uc`, branch `p7-uc` (from `p7-browse` after UA). Do not commit; the orchestrator does.

## Goal

These are the pure view components of one pane in design B. They hold no I/O and no state of their own. Each one takes a snapshot and sends commands.

- **`file_list`:** shows the rows of one folder from a `FileListProps`:
  - the rows: name, kind (file, folder, link), size, modified time, hidden;
  - the cursor row;
  - the scroll row;
  - the marked rows;
  - whether the pane is active.

  Columns: icon, name, extension, size and date, as in the spike. Folders sort first; the caller sorts.

  Input becomes `rusty_core::Command` values through an `on_command` callback. The list never changes state itself:
  - Up/Down/PageUp/PageDown/Home/End → `PaneCursorMove`;
  - Space → `SelectionToggle`;
  - Insert → `SelectionToggleDown`;
  - Enter on a folder, and Backspace → a `FileListAction::Open(row)` / `Up` callback, since the pane decides the target location;
  - a click → `PaneCursorMove { Row }`;
  - a right-click → `SelectionToggle` on that row, after moving the cursor (Total Commander);
  - scrolling with the wheel → `PaneScroll`;
  - a size change → an `on_page_rows(rows)` callback.

  It uses UA's `VirtualList`, so 100,000 rows stay smooth.
- **`pane_chrome`:**
  - `PaneTabs`: tab titles, the active tab, and clicking a tab → `PaneActivateTab`;
  - `PathBar`: the location's segments, where clicking a segment → an `on_navigate(Location)` callback.
- **`fkey_bar`:** the F-key labels from a list of (key, label) pairs, as in the spike.
- **`status_bar`:** the marked count and total size, files and folders, free space (or "–").

## Read first

- `plans/2026-10-14-p7-poc-browse.md`; `docs/decisions.md` D15 (Total Commander selection), D16, D27.
- `crates/rusty-ui/src/` (UA's `tokens` and `primitives`).
- `crates/rusty-core/src/command/mod.rs` (`Command`, `CursorMove`), `state/tab.rs` (`ViewState`), `selection/`.
- The spike, which is the visual and behavioural source: `spikes/gpui-b/src/file_list.rs`, `pane.rs`, `fkey_bar.rs` and `data.rs`, and `tests.rs` for its headless tests. Port its look faithfully.

## Decided

- `rusty-ui` depends on `rusty-core` (path dependency), for `Command`, `Location`, `ProviderPath` and `CursorMove`.
- Names arrive as `ProviderPath` and are shown with `display()`, which is lossy and only for the UI.
- Size and date formats as in the spike: the size in bytes with thousands separators, and the date as `YYYY-MM-DD HH:MM` in local time. Folders show `<DIR>`.
- Accessibility: keep the spike's S6 roles. The list is `Role::List` named "<folder> files", and each row is `Role::ListItem` with its name, selected state and position.
- D31 (no `unwrap`, `expect` or `panic` outside tests). Files ≤ 400 lines, functions ≤ 50, props structs instead of more than 4 parameters.

## Tests (headless, written first)

1. **`file_list`:**
   - 100,000 rows render only the visible rows;
   - each key above sends the right `Command`;
   - Space and Insert;
   - a click and a right-click;
   - the wheel sends `PaneScroll`;
   - Enter on a folder and on a file;
   - Backspace;
   - `on_page_rows` fires on resize;
   - marked rows render as marked;
   - the cursor row is the active descendant.
2. **`pane_chrome`:** a tab click sends `PaneActivateTab { tab: i }`; a path segment click sends its location.
3. **`fkey_bar` and `status_bar`:** they render the given labels and counts.
4. **Screenshots** in headless cage only (**never on the owner's desktop**): a gallery page with one pane of sample rows, light and dark, saved as `design/screens/p7-pane-{light,dark}.png`. Look at them and compare them with `spikes/gpui-b/screens/s2-*.png`.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/rusty-p7-uc
cargo nextest run -p rusty-ui -p rusty-ui-gallery --no-fail-fast 2>&1 | tail -15
cargo clippy --workspace --all-targets -- -D warnings 2>&1 | tail -3
```

## Stop and report

Report:
- the files and the public API, one line per type;
- the test count by component and the check tails;
- the screenshot paths;
- every decision the brief left open.
