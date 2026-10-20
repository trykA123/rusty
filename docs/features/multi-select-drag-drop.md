# Multi-select and drag and drop

Status: marking is done. Dragging works between the panes, onto folders, tabs, path crumbs and drive pills. Alt-drop makes shortcuts. Auto-scroll, hover-open and Explorer drag are not done yet.

## What it is

Mark many files with keys or the mouse. Drag them to the other pane, a folder, a tab, a breadcrumb or a drive pill to copy or move them. Later, drag files to and from Explorer.

Ferrite keeps the Total Commander mark model. Marks are separate from the cursor. A plain click and plain arrows never change marks.

## What you can do

- Mark a range with the keyboard or the mouse.
- Mark all, unmark all, and bring back the marks you just cleared.
- Mark all files with the same extension as the cursor file.
- Drag marked files onto a folder, the other pane, a tab, a breadcrumb segment or a drive pill.
- Choose copy, move or shortcut with a modifier key.
- Pause or cancel a drop. Each drop runs as a job with a journal.

## Keys

- Shift+Up, Shift+Down, Shift+PgUp, Shift+PgDn, Shift+Home and Shift+End extend a range. Moving back shrinks it.
- Ctrl+A and Ctrl+Num+ mark all, files and folders.
- Ctrl+Shift+A and Ctrl+Num- unmark all. The marks are saved.
- `/` (Num /) restores the marks you last cleared, by name, in the current folder.
- Alt+Num+ marks all files with the cursor file's extension. Alt+Num- unmarks them.
- Space, Insert, Num+, Num- and Num* work as before.
- Esc cancels a drag.

## Mouse

- Ctrl+click toggles a row. Shift+click extends a range.
- A click on the empty area below the files unmarks all.
- A right-drag paints a range of marks. It unmarks if the first row was marked.
- A left-drag from empty space draws a lasso. Ctrl+lasso toggles.
- A left-drag from a row's icon or name drags the files.

Marks survive the type-to-filter. Operations act only on visible marked rows. The footer shows "N marked not shown".

## Dragging

- If you press a marked row, the drag carries all visible marked rows. Otherwise it carries that row.
- With no key, a drop moves on the same drive and copies to another drive.
- Ctrl copies. Shift moves. Alt, or Ctrl+Shift, creates a shortcut.
- A badge near the pointer says what will happen, for example "Move 3 items to Projects". It reacts live to the keys.
- A drop into the source folder is refused: "Already in this folder". A folder into itself is refused: "Cannot drop a folder into itself".
- An Alt-drop into the same folder is refused for now.
- Shortcuts are named `<name> - Shortcut.lnk` on Windows and are symlinks on Linux. Clashes get a number.
- Not done yet: auto-scroll near the top and bottom edges (24 px), and opening a folder, tab or drive after a hover.

### Explorer

Coming. Not done yet. The plan for each part:

- Dropping from Explorer into Ferrite: Ferrite does every move itself. The source never deletes anything.
- A right-button drag from Explorer shows a menu: Copy here, Move here, Create shortcuts here, Cancel.
- Virtual files, such as Outlook attachments, zip contents and phones, are refused.
- Dragging out to Explorer uses the shell's drag. Ferrite never deletes after a drag out.

## Settings

`[files] drop-confirm` takes `never`, `moves` or `always`. The default is `never`. Protected folders always ask.

## What was decided

- Right-drag marks a range, as in Total Commander.
- A click below the files unmarks. Marks survive the filter. `/` restores marks.
- Alt-drop makes shortcuts. Shortcuts from a drop are in.
- The owner added the left-drag lasso.
- Linux: marks, internal drag, drops in and symlinks work. Modifier keys for drops from other apps, drag out on X11 and the Explorer menu do not apply.

## Done and coming

- Done: all mark keys and mouse marks, marks that survive the filter, the footer note, the drop rule, the confirm setting, the drag badge, and drops onto the other pane, folders, tabs, breadcrumbs and drive pills.
- Done: Alt-drop shortcuts. You can undo them.
- Not done yet: auto-scroll near the edges, and hover-open on folders, tabs and drive pills.
- Coming: all Explorer drag, in and out.
- Undo for moves and copies arrives with job undo.
- Later: save and load marks, and mark newer or missing files from the other pane. That belongs to Compare.

## Open questions

None open. The owner answered all four on 20 October 2026.

Refs: plans/2026-10-20-p36-multi-select-drag-drop.md (D1 to D20, D65)
