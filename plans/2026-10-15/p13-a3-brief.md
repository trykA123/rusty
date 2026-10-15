# P13 A3 · Hex and paged text in the F3 viewer (UI)

Role: `ui-builder-high` (Opus, high). Worktree `<worktrees>/rusty-p13`, branch `p13-paged-view`. Commit your work on this branch when the check passes (stage files explicitly). Do not push or merge.

Build with `CARGO_TARGET_DIR=<targets>/p10` on every cargo command. Never use another target dir: the disk is shared and tight.

## Goal

F3 opens any file. Binary files show as hex; text over 16 MB shows as read-only paged text. Only the rows on screen are read, through a `ByteSource`, so memory stays small at any file size. Plan: `plans/2026-10-15-p13-paged-view.md` (decisions D1–D9 are final).

## Read first

- `plans/2026-10-15-p13-paged-view.md`
- `crates/rusty-core/src/paging/` — `ByteSource` (with `take_changed`), `read_full`, `hex_row`, `hex_rows`, `hex_row_start`, `row_at`, `row_start_at`, `previous_row`, `rows_down`, `rows_up`, `LineIndex`, `Needle`, `Search`, `find`, `parse_hex`. All are done and tested; use them, do not change them. If one is wrong, stop and report.
- `crates/rusty-ui/src/window_view/viewer/{mod.rs,files.rs,view.rs}` — the P12 viewer (Text edit mode).
- `crates/rusty-ui/src/window_view/tests.rs` lines 471–609 — the viewer tests and the `viewer_window` helper.
- `crates/rusty-ui/src/primitives/virtual_list.rs` — how the app draws a scrollbar with gpui-kit and its tokens.
- `crates/rusty-ui/src/window_view/operate/mod.rs` around line 156 — the background timer pattern.
- `~/.agents/rules/code-quality.md` and `rust.md`. Repo rules: files ≤ 400 lines, functions ≤ 50 lines, ≤ 4 parameters, no `unwrap`/`expect`/`panic` outside tests, no explanatory comments.
- Memory notes: gpui-kit's Root binds `tab` globally, so viewer keys must be actions in the `Viewer` key context. Register window callbacks in constructors, never during render.

## Hooks (add to `viewer/files.rs`, export from `window_view`)

```rust
pub enum OpenAs { Text, Hex, PagedText }

pub type SharedSource = Arc<dyn ByteSource + Send + Sync>;
pub type Reopen = Arc<dyn Fn() -> Result<Box<dyn ByteSource + Send>, String> + Send + Sync>;
pub type IndexRun = Arc<dyn Fn(&AtomicBool, &mut dyn FnMut(&LineIndex)) -> Result<Option<LineIndex>, String> + Send + Sync>;

pub struct Paged {
    pub source: SharedSource,
    pub reopen: Reopen,
    pub index: IndexRun,
    pub summary: Option<String>,
    pub editable: bool,
}
```

`FileHooks` gains `pick: Rc<dyn Fn(&Location) -> Result<OpenAs, String>>` and `paged: Rc<dyn Fn(&Location) -> Result<Paged, String>>`. `FileHooks::none()` returns errors from both. The app wires real ones later (atom A4, not yours).

- `pick` decides the first mode. `Text` uses the existing `read` path (Text edit); `Hex` and `PagedText` call `paged`.
- `source` is shared with the UI thread. `reopen` gives a fresh source for a background search, so the search never disturbs the view's page cache. `index` runs the line index, calling progress with snapshots.
- `editable` is true when Alt+1 may open Text edit (a small text file).
- `summary` is the executable header line for Hex (D8); show it in the header when present.

## Behaviour

1. **Modes.** `Viewer` holds one of Text edit (P12, unchanged) or a paged view in Hex or PagedText.
   - Alt+3 switches to Hex. From Text edit with unsaved changes, warn first, as the leave warning does.
   - Alt+1 switches to text: Text edit when `editable`, otherwise PagedText.
   - The header shows the mode (`Text`, `Hex`, `Text · read-only`), the file length, and key hints.
2. **Paged view.** Position is a byte offset `top`. Draw exactly the rows that fit the viewport height, in the mono font (`t.typography` mono, as the file list size column uses).
   - Hex: `hex_row` for rows from `hex_row_start(top)`, step 16. Show the offset, hex and ASCII columns; `wide` when `len > u32::MAX`.
   - PagedText: `row_at` from `top`. Draw `[start, end)` with `String::from_utf8_lossy`. In a left gutter, show the line number from the index snapshot for rows that start a line, blank otherwise.
3. **Keys** (actions in the `Viewer` context):
   - Up/Down one row; PgUp/PgDn one screen; Ctrl+Home/Ctrl+End start and end. End shows the last screenful: in Hex compute it; in text use `rows_up` from `row_start_at(len)`.
   - Mouse wheel: three rows per notch.
   - Left/Right in PagedText shift sideways by 8 columns.
   - Esc closes the search bar first, then the viewer; F3 closes.
4. **Scrollbar.** A vertical track on the right, thumb at `top / len`. Dragging or clicking sets `top` to `row_start_at(len × fraction)` (Hex: `hex_row_start`). Use the scrollbar colour tokens. A hand-drawn track is fine if gpui-kit's `Scrollbar` needs a ScrollHandle you cannot fake.
5. **Search bar** (Ctrl+F in a paged view). It is a small input in the header row, using the existing prompt or input component.
   - Hex parses the input with `parse_hex` and shows its error inline. Text uses `Needle::Text` with a "Match case" toggle (Alt+C).
   - Enter searches forward from the row after `top`; Shift+Enter searches backward from `top`.
   - Run `find` on `reopen()` in a background task, with an `AtomicBool` cancel. Show "Searching… N%" (bytes searched / bytes left to search) and update it at most every ~100 ms.
   - Found: move `top` to the row holding the match. In Hex, highlight the matched bytes. In text, highlighting the row is enough.
   - Not found: "Not found below." or "Not found above." Esc during a search cancels it.
6. **Index** (PagedText only). Start `index` in a background task when the view opens. Keep the latest snapshot (clone at most every ~250 ms). The header shows "Indexing… N%" until it finishes, then the line count.
   - Ctrl+G opens a go-to input. In text it takes a line number (`line_start`; "Not indexed yet" when it returns None). In Hex it takes a hex offset (`0x` optional).
   - Cancel the index task when the viewer closes.
7. **Changes on disk.** After drawing, if `source.take_changed()` returns true, show "Changed on disk" in the header and clamp `top` to the new length.
8. **Errors.** A read error shows its message in the body instead of rows. It never panics.

## Tests (gpui-kit headless, in `crates/rusty-ui/src/window_view/viewer/tests.rs` or split files ≤ 400 lines)

Use an in-memory `ByteSource`, for example a `Vec<u8>` wrapped in a newtype that implements `ByteSource + Send + Sync`, plus test `FileHooks` with `pick` and `paged`. Cover at least:

- `pick` → Hex opens a hex view; the first row text matches `hex_row(0, …)`.
- Ctrl+End then Ctrl+Home move `top` to the last screen and back to 0. PgDn moves by a screen.
- Alt+1 from Hex goes to Text edit when `editable` and to PagedText when not; Alt+3 goes back to Hex.
- Text edit with unsaved changes: Alt+3 warns first, and the second Alt+3 switches.
- Hex search for `4D 5A` finds an offset deep in a 3 MiB source and moves `top` there. Bad hex shows an error and does not search.
- Text search backward finds the previous match. A missing needle shows "Not found below."
- Index progress: a PagedText source gets line numbers in the gutter once the index finishes (use `cx.run_until_parked()`), and Ctrl+G to line 500 moves `top` to that line's start.
- Esc with the search bar open closes only the bar.
- A source whose `take_changed()` returns true shows "Changed on disk".
- Existing P12 viewer tests keep passing.

## Screenshots

Add the paged viewer to `rusty-ui-gallery`: a Hex sample of about 300 KB of mixed bytes, and a PagedText sample. Capture them only in headless cage, never on the owner's desktop:

```
env -u WAYLAND_DISPLAY -u DISPLAY WLR_BACKENDS=headless WLR_LIBINPUT_NO_DEVICES=1 cage -s -- <script>
```

Save `design/screens/p13-hex-{light,dark}.png` and `design/screens/p13-text-{light,dark}.png`, then look at them. Hex columns must line up, and long rows must clip, not wrap.

## Check

`cargo xtask gate > <log> 2>&1; echo $?` must print 0. Never pipe the gate. Then commit.

## Stop if

- a core paging function behaves against its doc in the plan;
- the change needs edits outside `crates/rusty-ui`, `crates/rusty-ui-gallery`, and `design/screens`, except adding `rusty-core` imports;
- the gate cannot pass without changing a P12 test's intent.

## Report

Commit hash, files changed with line counts, tests added, the gate result, the screenshot paths with one line on what each shows, and anything deferred.
