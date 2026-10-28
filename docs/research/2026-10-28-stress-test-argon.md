# Navo Stress & UX/UI Test Report

Model output (Gemini 4 Argon high), tested the Linux build from 2eebd1cc in a headless sandbox. Already fixed since: 2.1 (Tab, OF4) and 2.11 (Draft badge, OF7a). Screenshots stay local.

Environment: Linux headless Wayland (`cage` + `bubblewrap`), `1280x720`, keyboard-only (`wtype`). All cited screenshots are in `shots/`.

---

## 1. Crashes and hangs (ranked by severity)

### 1.1 [CRITICAL — Total Keyboard Soft-Lock] Opening a PDF in F3 when `libpdfium.so` is absent kills all keyboard focus (`20_f3_pdf.png` – `28_f3_pdf_window_keys.png`)
- **Repro steps:**
  1. Focus the right pane (`fixture/docs`).
  2. Move the cursor to `tiny.pdf` and press `F3` (or open `table.csv` with `F3` and press `N` for next file).
- **Result:** The viewer renders the error state `"Navo did not open this PDF / The PDF engine is missing"` (`20_f3_pdf.png`). Once this view appears, **every keyboard shortcut in the application stops working**: `Esc` (`21_f3_pdf_after_esc.png`), `1`/`3` mode keys (`22_f3_pdf_1_text.png`, `23_f3_pdf_3_hex.png`), `N`/`P` file cycling (`24_f3_pdf_p_prev.png`), `Tab`/`Space`/`Enter` (`25_f3_pdf_tab.png`, `26_f3_pdf_tab_enter.png`), and window-level shortcuts `Ctrl+K`, `Ctrl+L`, `Ctrl+,`, `Alt+N` (`27_f3_pdf_ctrl_k.png`, `28_f3_pdf_window_keys.png`). The process remains alive, but a keyboard-only user is permanently trapped and must kill Navo externally.

---

## 2. Bugs (ranked by severity)

### 2.1 [HIGH] Panes 1 and 3 are completely unreachable by keyboard in 3- and 4-pane layouts (`63_layout_5th_pane_refused.png` – `68_ctrl_shift_1.png`)
- **Repro steps:**
  1. Press `Ctrl+L`, press `V` twice to create 4 panes, and press `Esc` (`66_four_panes_view.png`).
  2. Press `Tab` and `Shift+Tab` repeatedly (`67_four_panes_after_tab.png`).
  3. Press `Ctrl+Shift+1`, `Ctrl+Shift+2`, `Ctrl+Shift+3`, `Ctrl+Shift+4` (`68_ctrl_shift_1.png`).
- **Result:** `Tab` and `Shift+Tab` only ping-pong between the two currently paired panes (Pane 2 and Pane 4), skipping Panes 1 and 3. `Ctrl+Shift+1..4` does nothing on Linux/Wayland because `Shift+1..4` emits shifted keysyms (`!`, `@`, `#`, `$`) rather than `1..4`. Panes 1 and 3 cannot be focused from the keyboard at all.

### 2.2 [HIGH] Opening `Settings` (`Ctrl+,`) while `Ctrl+K` is open leaves a zombie `Ctrl+K` overlay and misroutes `F8` to file deletion (`103_settings_open.png` – `108_settings_files.png`)
- **Repro steps:**
  1. Open `Ctrl+K` and type `>Go to folder`.
  2. Press `Ctrl+,` (`103_settings_open.png`).
  3. Press `Esc` (`104_settings_appearance.png`).
  4. Reopen `Ctrl+,`, press `Right` to change Theme to `Light`, press `Ctrl+K` then `Esc` to dismiss the zombie `Ctrl+K` popup (`106_light_theme.png`, `107_after_closing_zombie_ctrl_k.png`), then press `F8` (`108_settings_files.png`).
- **Result:**
  - `Ctrl+,` opens Settings behind `Ctrl+K` without closing `Ctrl+K`. Settings steals keyboard focus while `Ctrl+K` stays painted on top (`103_settings_open.png`), so `Esc` closes Settings in the background while leaving `Ctrl+K` stuck on screen (`104_settings_appearance.png`).
  - Conversely, closing `Ctrl+K` while Settings is open restores focus to the left file pane while Settings remains visibly active on the right showing `Theme • Changed` and `F8 Reset` (`107_after_closing_zombie_ctrl_k.png`). Pressing `F8` to reset the setting instead triggers `Move 1 item to the Recycle Bin?` on the file in the left pane (`108_settings_files.png`).

### 2.3 [HIGH] `Shift+Delete` pollutes the current folder with visible `[.navo-retained-<uuid>]` directories (`87_after_shift_del.png`, `88_ctrl_k_recently_deleted.png`)
- **Repro steps:**
  1. Navigate to `fixture/scratch-target/big-folder` containing copied test files.
  2. Select a file, press `Shift+Delete`, and press `Enter` to confirm permanent deletion (`86_shift_del_dialog.png`, `87_after_shift_del.png`).
- **Result:** Although `Settings > Safety net` states *"Move deleted files to a hidden folder on the same drive"* (`115_settings_safety_net.png`), Navo creates `.navo-retained-<uuid>` directly inside the parent folder being viewed. Because `Files > Hidden files` defaults to `Shown` (`110_settings_files_real.png`), every `Shift+Delete` immediately spawns a new `[.navo-retained-...]` folder at the top of the user's file list and increments the folder count in the footer (`2 files, 1 folder`, `1 file, 2 folders`).

### 2.4 [HIGH] F3 `Ctrl+F` search omits the current match index and fails to highlight matches in Text and Hex views (`33_f3_hex_find.png`, `35_f3_code_find.png`, `40_f3_huge_log_follow_find.png`)
- **Repro steps:**
  1. Open `binary.bin` with `F3`, press `Ctrl+F`, and type `4142` (`33_f3_hex_find.png`).
  2. Open `code.rs` with `F3`, press `Ctrl+F`, and type `println` (`35_f3_code_find.png`).
  3. Open `huge.log` with `F3`, press `Ctrl+F`, and type `399999` (`40_f3_huge_log_follow_find.png`).
- **Result:** The find counter displays `of 4,000`, `of 200`, and `of 1` with no current hit index (`1 of 200`). Neither the Hex dump/ASCII column nor the Text/Code viewport highlights the matched bytes or text, so the user cannot see which line or byte offset matched.

### 2.5 [MEDIUM] `Ctrl+F` is unimplemented in F3 Table, Tree, and Markdown views, and typing a search starting with `1` or `3` switches viewer modes (`17_f3_csv.png`, `18_f3_csv_search.png`)
- **Repro steps:**
  1. Open `table.csv` with `F3` (`17_f3_csv.png`).
  2. Press `Ctrl+F` and type `199` (`18_f3_csv_search.png`).
- **Result:** `Ctrl+F` does nothing in Table view. The subsequent `1` keypress triggers the bare shortcut `1 Text`, abruptly kicking the viewer out of Table mode into raw CSV text (`18_f3_csv_search.png`). Tree (`37_f3_json.png`) and Markdown (`42_f3_markdown.png`) views also lack `Ctrl+F`.

### 2.6 [MEDIUM] Pressing `F4` in the file list demands an external editor (`/usr/bin/nvim`) instead of opening Navo's built-in editor (`43_f4_markdown_edit.png`, `131_f4_from_filelist.png`)
- **Repro steps:**
  1. Focus any file in a pane and press `F4` (`131_f4_from_filelist.png`).
- **Result:** Even though Navo has a built-in F4 editor reachable via `Ctrl+E` inside `F3` (`43_f4_markdown_edit.png`), pressing `F4` in the file list opens a modal `Choose the program F4 opens files with` pre-filled with `/usr/bin/nvim` (a TUI editor that cannot run without a terminal emulator).

### 2.7 [MEDIUM] Pressing `Enter` on `.zip` archives or `.txt` files launches broken external OS handlers instead of browsing/viewing inside Navo (`53_f3_archive_enter.png` – `55_after_external_open.png`)
- **Repro steps:**
  1. Focus `fixture/archives/pack.zip` in the file list and press `Enter` (`54_enter_on_zip.png`, `55_after_external_open.png`).
  2. Or open `pack.zip` in `F3`, select `inner/f0.txt`, and press `Enter` (`53_f3_archive_enter.png`).
- **Result:** Pressing `Enter` on `pack.zip` spawns `xdg-open`, which launches Chromium over the entire window instead of entering the archive inside Navo (`55_after_external_open.png`). Pressing `Enter` on `inner/f0.txt` inside the archive viewer extracts the entry to `/tmp/navo-archive-...` and runs `xdg-open`, which invokes terminal `micro` without a TTY (`open /dev/tty: no such device or address / Fatal: Micro could not initialize a Screen` in `stress.sh log`).

### 2.8 [MEDIUM] Quick filter in the file list ignores leading digits `0–9` (`126_big_folder_filtered.png`, `128_big_folder_quick_filter_real.png`)
- **Repro steps:**
  1. In `fixture/big-folder`, type `4999` (`126_big_folder_filtered.png`).
  2. Type `file-4999` (`128_big_folder_quick_filter_real.png`).
- **Result:** Typing digits `4999` does nothing; quick filter only activates when the first character is a letter (`file-4999`). Users cannot start a quick filter by number or date prefix.

### 2.9 [MEDIUM] Results tab (`search: needle`) does not update hit or file counts in the footer after moving files out (`83_after_f6_move.png`)
- **Repro steps:**
  1. Run `Alt+F7`, search `needle`, and press `Ctrl+Enter` to open the `search: needle` Results tab (`79_results_tab.png`, footer: `450001 hits in 50002 files`).
  2. Select `file-00003.txt` and press `F6` + `Enter` to move it to `scratch-target` (`82_results_tab_f6_dialog.png`, `83_after_f6_move.png`).
- **Result:** `file-00003.txt` disappears from the Results list, but the footer remains stuck at `450001 hits in 50002 files`.

### 2.10 [MEDIUM] Multi-rename (`Ctrl+M`) leaves a permanent red `"Nothing to rename."` error in the pane footer even after a successful rename (`97_multi_rename_done.png` – `99_multi_rename_undone.png`)
- **Repro steps:**
  1. Open `Ctrl+M` on marked files, press `Ctrl+E` twice (which leaves focus on the preview table rather than `Name mask`), and press `Enter` while rules are `[N]` / `Unchanged` (`97_multi_rename_done.png`).
  2. Reopen `Ctrl+M`, change `Name mask` to `[N]_[C]`, and press `Enter` (`98_multi_rename_applied.png`).
- **Result:** Pressing `Enter` with 0 changes prints `"Nothing to rename."` in red in the underlying pane footer behind the modal (`97_multi_rename_done.png`). Even after completing a valid rename (`✓ Renamed 2 items Ctrl+Z undo` toast in `98_multi_rename_applied.png`), the red `"Nothing to rename."` message stays stuck in the pane footer until the user Quick-filters or leaves the folder.

### 2.11 [LOW] Startup Workspace draft badge overcounts changed panes by +1 (`01_initial.png`, `63_layout_5th_pane_refused.png`)
- **Repro steps:**
  1. Start Navo fresh (`01_initial.png`) with 2 panes.
  2. Or split to 4 panes (`63_layout_5th_pane_refused.png`).
- **Result:** With 2 panes on a fresh launch, the footer badge reads `Workspace 1 1/1 Draft · 3` (claiming 3 changed panes). With 4 panes (the maximum allowed), it reads `Draft · 5`.

### 2.12 [LOW] Contradictory shortcut documentation in Settings (`117_settings_display.png`)
- **Repro steps:**
  1. Open `Ctrl+,` and Tab to `Display` (`117_settings_display.png`).
- **Result:** `Path bar` help text states: *"Shows the folder path above the file list, and Ctrl+L opens the path field without it."* In reality, `Ctrl+L` opens the Layout switcher (`62_ctrl_l_switcher.png`) and `F9` opens the path field.

---

## 3. UX problems (ranked by severity)

1. **[HIGH] Windows-specific settings and copy exposed on Linux (`103_settings_open.png`, `110_settings_files_real.png`, `112_settings_terminal.png`):**
   - `Appearance > Theme` says *"Follow Windows, or keep light or dark"* (`103_settings_open.png`).
   - `Files > Show system files` says *"Files with the System attribute"* (`110_settings_files_real.png`).
   - `Terminal > Terminal` defaults to `windows-terminal` and displays *"Not applied yet"* right above *"✓ Applied live · Saved to navo.toml"* (`112_settings_terminal.png`).
2. **[HIGH] `Files > Sort by` in Settings offers `Kind`, which does not exist in the file list (`110_settings_files_real.png`):**
   - The segmented control offers `Name | Size | Date | Kind`, whereas file panes have columns `Name | Ext | Size | Date`.
3. **[MEDIUM] `Space` inside modal confirmation dialogs triggers the focused destructive/undo button (`99_multi_rename_undone.png`, `100_after_undo_and_ctrl_k.png`):**
   - If a user starts typing while a confirmation modal (`Undo the rename of 2 items...`) is open, pressing `Space` activates the focused button (`Undo`) and leaks the remaining keystrokes into the file pane's quick filter (`100_after_undo_and_ctrl_k.png`).
4. **[MEDIUM] Closing `Edit names` (`Ctrl+E`) or resetting rules (`Ctrl+R`) in Multi-rename drops focus onto the preview table (`96_multi_rename_editor.png`, `97_multi_rename_done.png`):**
   - After toggling `Ctrl+E` off or pressing `Ctrl+R`, typing immediately into `Name mask` fails silently because focus moved to the read-only preview table.
5. **[MEDIUM] `Settings > Diagnostics` hides the user's own local paths behind privacy-redaction tokens and repeats section titles (`118_settings_diagnostics.png`):**
   - Paths are shown as `/<user>/<d:b024>/<d:5e1c>/<f:8f1d>.db`, which is useless for local troubleshooting, and `Listing cache` and `Journal` are each listed three times without distinguishing `.db`, `-wal`, and `-shm`.
6. **[LOW] `F1` does nothing and its F-key bar slot is blank (`02_f1_help.png`, `04_fkey_bar_toggled.png`):**
   - Pressing `F1` has no effect anywhere, and the bottom bar renders an empty pill `F1     `.
7. **[LOW] Raw Rust `Debug` struct shown to end users on PDF load failure (`20_f3_pdf.png`):**
   - Displays `LoadLibraryError(DlOpen { desc: "libpdfium.so: cannot open shared object file: No such file or directory" })`.
8. **[LOW] Inconsistent number and unit formatting (`79_results_tab.png`, `124_big_folder_loaded.png`, `127_big_folder_multi_rename_50k.png`, `128_big_folder_quick_filter_real.png`):**
   - Pane footers format `49,999 files`, whereas Results tab (`450001 hits in 50002 files`), Multi-rename (`Rename 49999 items`), and filtered mark counts (`49989 marked not shown`) omit thousands separators. Sizes display `1009.5 KB` in file lists vs `MiB` in Settings (`115_settings_safety_net.png`).

---

## 4. Visual problems (ranked by severity)

1. **[HIGH] Severe right-truncation of paths in Copy, Move, Delete, Undo, and Recently Deleted views hides every filename and destination (`80_results_tab_f5_dialog.png`, `82_results_tab_f6_dialog.png`, `84_f8_delete_dialog.png`, `86_shift_del_dialog.png`, `89_recently_deleted_view.png`, `91_delete_now_dialog.png`, `99_multi_rename_undone.png`):**
   - Every confirmation dialog truncates full paths from the right (`<fixture path>`), completely hiding both the target folder name and the filenames being acted on.
   - In `99_multi_rename_undone.png`, even the static dialog body text is truncated: *"Items that changed since are left as t..."*.
2. **[HIGH] F3 Archive viewer clips the `Date` column year and collides with `Packed` at 1280px (`51_f3_archive_zip.png`, `52_f3_archive_drawers.png`):**
   - Every row in `pack.zip` renders `18 B )26-10-28 20:54`, clipping the `20` off `2026` with zero gap after `Packed`.
3. **[HIGH] Bottom F-key bar pills in F3 Tree view and F4 Markdown editor are crushed into unreadable 1–3 letter stubs (`36_f3_yaml.png`, `37_f3_json.png`, `43_f4_markdown_edit.png`):**
   - F3 Tree view (`37_f3_json.png`): `</> F...`, `Ctrl+Shift+</> F...`, `Ctrl+1-9 D...`, `Alt+V ...`, `1 T...`, `3 ...`, `N ...`, `P ...`, `Esc Cl...`.
   - F4 Editor (`43_f4_markdown_edit.png`): `Ctrl+S ...`, `Ctrl+F ...`, `F3 ...`, `Ctrl+G ...`, `Ctrl+E ...`, `Alt+Z ...`, `Alt+V ...`, `Esc ...`.
4. **[MEDIUM] Window-level `Workspace` button lives inside the active pane's footer, jumping panes on `Tab` and crushing pane stats (`01_initial.png`, `10_sort_ctrl_f5.png`, `63_layout_5th_pane_refused.png`, `66_four_panes_view.png`):**
   - Switching focus from left to right pane jumps the `Workspace` indicator across the screen (`10_sort_ctrl_f5.png`). In 3–4 pane layouts, it crushes the active pane's item count to `...` (`63_layout_5th_pane_refused.png`) or `0 files...` (`66_four_panes_view.png`).
5. **[MEDIUM] Popovers overflow the 1280x720 window (`49_f3_encoding_picker.png`, `94_multi_rename_tokens.png`):**
   - The F3 Encoding picker (`Ctrl+Shift+E`, `49_f3_encoding_picker.png`) clips above the top window edge.
   - The Multi-rename token menu (`Ctrl+Space`, `94_multi_rename_tokens.png`) clips below the bottom window edge (`Counter (1, 2, 3...)` is cut in half).
6. **[MEDIUM] Sorting a 1-letter CSV column (`A`) in F3 Table view truncates the header to `.. ↑` (`19_f3_csv_sorted.png`):**
   - Adding the sort arrow inside the fixed column width replaces `A` with `.. ↑`.
7. **[LOW] Folder preview (`F3` on a folder) truncates `Last change` date to `2026-10...` (`30_f3_binary_hex.png`).**
8. **[LOW] F3 Image viewer `Ctrl+I` Details panel shrinks the image canvas instead of overlaying as a drawer (`57_f3_image_png_real.png`, `58_f3_image_details.png`).**
9. **[LOW] Hex viewer ASCII column has programming ligatures enabled, rendering `<=>` across three bytes as a single `⟺` glyph (`32_f3_binary_hex_real.png`).**
10. **[LOW] Settings scroll containers clip the bottom row in `Files` (`110_settings_files_real.png`) and `Shortcuts` (`119_settings_shortcuts.png`), and `Display` and `Diagnostics` share the identical eye icon (`118_settings_diagnostics.png`).**

---

## 5. Slow spots

Navo was fast across almost every workload; no operation froze the UI thread:
1. **Alt+F7 content search across 50,000+ files (`78_content_search_needle.png`):** Took ~1.2 seconds to stream and finish `450,001 hits in 50,002 files`. Responsive, though no progress indicator was visible once results filled the list.
2. **Reaching `Name mask` after closing `Ctrl+E` in Multi-rename (`96_multi_rename_editor.png`, `97_multi_rename_done.png`):** Requires 4 `Tab` presses (`Preview table` -> `Cancel` -> `Rename` -> `Presets` -> `Name mask`) or closing and reopening `Ctrl+M` (2 keypresses) because focus drops onto the preview table.
3. **50,000-file folder (`fixture/big-folder`, `124_big_folder_loaded.png` – `127_big_folder_multi_rename_50k.png`):** Opening, `End`/`Home`/`PageDown` scrolling, sorting by Size/Date/Name, `Ctrl+A` marking 49,999 files, and opening `Ctrl+M` on 49,999 items all completed in <200 ms.

---

## 6. What works well

1. **50,000-file virtualized performance (`124_big_folder_loaded.png` – `127_big_folder_multi_rename_50k.png`):** Opening `big-folder`, jumping to `End`, sorting 50,000 items, marking all 50,000 items, and populating the Multi-rename preview table felt instantaneous.
2. **16.7 MB (`400,000`-line) log viewer (`39_f3_huge_log.png`, `40_f3_huge_log_follow_find.png`):** `F3` opened `huge.log` immediately with smooth scrolling and instant `Alt+F` follow toggle.
3. **Encoding & format breadth in F3/F4 (`32_f3_binary_hex_real.png` – `57_f3_image_png_real.png`):** UTF-16 LE BOM (`utf16.txt`) was auto-detected cleanly (`46_f3_utf16_real.png`), JSON/YAML/XML tree folding (`36_f3_yaml.png` – `41_f3_xml.png`), Markdown split-preview editing with unsaved-changes guard (`43_f4_markdown_edit.png` – `45_f4_unsaved_dialog.png`), and zip archive browsing (`51_f3_archive_zip.png`) all worked smoothly.
4. **Unicode, CJK, hidden, and pathological filenames (`09_names_folder.png`):** Diacritics, Japanese, 200-char names, leading/multiple spaces, and multiple dots rendered and navigated without glitches.
5. **Ctrl+K step commands & Settings `F3 TOML line` (`101_ctrl_k_step_empty.png`, `102_ctrl_k_step_invalid.png`, `121_settings_f3_toml_appearance.png`):** Step validation in `Ctrl+K` (`Type a folder`, `Nothing at /nonexistent/...`) and jumping from a setting directly to its line in `navo.toml` with `F3` are fast and well-designed.
