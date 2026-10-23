# Multi-rename

Status: the window, keys, presets and Ctrl+Z undo are in.

## What it is

Mark files and press Ctrl+M to rename them all at once. A live table shows old and new names and flags conflicts before anything happens.

## What you can do

- Rename many files with a pattern, search and replace, case changes and cleanup.
- See every old and new name in a preview table before you commit.
- Undo a whole batch with Ctrl+Z, even after a restart.
- Save a set of rules as a preset. "Last used" is listed first.

Open it with Ctrl+M, with Rename in the context menu when two or more items are marked, with F2 on two or more marks, or from Ctrl+K. It takes the marked items, or the item under the cursor.

### Pattern

- `[N]` is the name. Ranges work: `[N2-5]`, `[N2,5]`, `[N-3,3]`.
- `[E]` is the extension. `[P]` is the parent folder. `[G]` is the grandparent.
- `[C]` is a counter, for example `[C10+5:3]`. Start, step and digits (1 to 10) are set in the form. Numbers follow the preview order.
- Dates: `[Y] [y] [M] [D] [h] [i] [s]`, plus `[d]` (YYYY-MM-DD) and `[t]` (hh.mm.ss).
- Case: `[U]` upper, `[L]` lower, `[F]` first letter of each word, `[n]` unchanged.
- Fields: `[=exif.date]`, `[=audio.artist]`, `[=file.size]`.
- `[[` and `]]` give literal brackets.

The extension is the text after the last dot. A leading dot is not an extension.

### Rules

The order is: pattern, search and replace, case, cleanup, then the check.

- Search and replace has Find and Replace fields. Toggles: Regex, Match case, First only, Name only. A `|` separates pairs.
- Case: Unchanged, lower, UPPER, First letter or Title Case. The extension has its own case setting.
- Cleanup: trim spaces, collapse repeats, remove accents, spaces to `_`.

### Safety

- Any problem blocks Rename: an invalid name, an empty name, a duplicate new name, or a clash with an item outside the batch.
- Windows compares names without case. Ferrite follows that.
- It never overwrites a file.
- The batch is all or nothing. If one rename fails or you cancel, every name goes back.
- Chains, swaps and cycles are ordered safely with temporary names. A case-only rename works.
- Ctrl+Z undoes the newest batch from the journal. It skips items that changed and counts them. If the undo notice is gone, it asks first. The last 20 batches are kept. There is no redo.
- Undo and crash recovery compare the recorded file identity before putting a name back. A replacement stays untouched even when its size and timestamp match. Older steps without an identity are skipped.
- An identity that cannot be read keeps undo retryable. Crash recovery keeps an older unverified rename pending when its original name is missing and its new name still exists.
- A provider that cannot supply file identities refuses the rename step and puts earlier steps back.

## Keys in the tool

- Enter renames, or jumps to the first problem.
- Esc closes.
- Tab and Shift+Tab move between fields.
- Ctrl+Space opens the token menu.
- Ctrl+Down and Ctrl+Up switch between the preview and the fields.
- PgUp and PgDn scroll the preview.
- Alt+Down and Alt+Up jump to the next or previous problem.
- Del excludes or includes a row.
- Ctrl+S saves a preset. Ctrl+O opens the preset list.
- Ctrl+R resets.
- Ctrl+E edits the names as text.
- Ctrl+Shift+Up and Ctrl+Shift+Down move a row.

## Also planned

- Load names from a file, and a counter that restarts per folder.
- An optional rename log in Settings > Files > Rename log.

## Layout

A modal panel with a preview table, a "Problems only" filter and a footer such as "38 to rename · 2 unchanged · 1 problem".

## What was decided

- F2 on two or more marks opens this tool.
- The batch is all or nothing.
- The tool opens with default rules, not the last ones.
- Targets, logged and not gated: 1,000 renames on the work PC, and a preview of 50,000 items in under 300 ms (228 ms measured).

## Done and coming

- Done: the window, Ctrl+M, F2 on marks, the context menu, Ctrl+K, presets, masks, rules, planning, the all-or-nothing job, cleanup, the preview table, fields from files, photos and audio tags, the undo journal with Ctrl+Z, and the preview highlights with the 260-character warning.
- Done on the backend branch: F2 on one item uses the same planner and journal, with undo after a restart. Failed renames keep their error in the pane. Native Windows checks remain pending.

## Open questions

None open.

Refs: plans/2026-10-20-p41-multi-rename.md (D1 to D26)
