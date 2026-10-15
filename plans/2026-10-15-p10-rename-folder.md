# P10 · Rename and new folder

## Goal

Finish the Alpha "File operations" item: F2 (and Shift+F6) renames the cursor row, F7 creates a folder.

## Decisions

- Names are checked in the core (`check_name`): not empty, none of `\ / : * ? " < > |` or control characters, not `.` or `..`, no trailing space or dot, no Windows device names (CON, PRN, AUX, NUL, COM1–9, LPT1–9).
- A name already used in the folder (ignoring case) is refused before touching the disk. A case-only rename goes through a temporary name, so it works on Windows.
- Rename and create run on the I/O queue; on success the panes reload and the cursor lands on the new name; a failure shows its error in the pane.
- `PromptDialog` is the reusable text prompt: the stem is selected for rename, Enter submits, Esc cancels, a bad name keeps the prompt open with the reason under the field.

## Log

- 2026-10-15 — Built on `p10-rename-folder` while the owner was away (approved). Gate green.
- 2026-10-15 — Review: PASS WITH FIXES, all fixed with tests: a new name hidden by the quick filter drops the filter so the cursor lands on it; a case-only rename whose rollback fails reloads the pane and names the temporary file in the error; the same name closes before the rules run; superscript COM/LPT ports, CONIN$/CONOUT$, `CON .txt` and names over 255 UTF-16 units are refused; letters typed while a prompt is open never reach the filter.
- Deferred: `LocalFs::rename` checks the target and then calls `std::fs::rename`, which replaces on Windows; a file created in between would be overwritten. Use a no-replace rename (`MoveFileExW` without `MOVEFILE_REPLACE_EXISTING`). A confirm dialog arriving while a prompt is open drops the typed text.
