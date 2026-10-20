# Compare and merge

Status: after the alpha. Nothing is built yet.

## What it is

Compare two folders, two Git refs of one repository, or two repositories, in the two panes. You check nothing out. Open any changed pair as a full-window diff, edit a real side, and copy a file or a hunk to the other side. Before 1.0, a three-way merge follows.

## What you can do

- Start a compare with right-click "Compare with other pane", Ctrl+K "Compare with other pane", Ctrl+K "Compare branches...", or Ctrl+Shift+D.
- Type a path such as `C:\src\project@main` in the path bar to open a Git ref read-only. Branches, tags, commits, HEAD, the index and the working tree all work.
- Read the folder compare in the panes. Rows line up and a missing file leaves a gap.
- Filter by All, Differences, Orphans or Same. `.gitignore` rules apply. "Show ignored" turns them off.
- Open a file pair as a full-window diff. Changed words are marked inside paired lines.
- Edit a real side. Ferrite keeps the encoding, the BOM and the line endings of each line. Save refuses if the file changed on disk. A Git ref side is read-only.
- Copy a file or hunk to the other side. Each copy is one job with a journal. The old version stays until Ferrite closes. "Restore previous version" brings it back.

Statuses: same, different, only left, only right, type conflict, case conflict, unavailable and "same after rules".

## Large and binary files

- Big text files open at once, whatever their size. The top lines show in under a second and the rest fills in with progress.
- A memory limit in Settings > Compare (default 1 GiB) lowers detail for huge changes. A part that is too big shows as one changed block, with a note and a link to the setting.
- Binary files open in a hex diff. Equal-size files line up by offset. Different sizes line up by content. Alt+V switches Text and Bytes.
- In a folder compare, size and time show at once. The content check runs in the background, visible rows first. It stops at the first difference. "Stop checking" ends it. Hashes are remembered.
- No file can make a compare hang. Each step has a limit and shows a simpler result.
- Typing in an edited side never waits for the diff. A side over 64 MiB is read-only in the first version. Copying still works.

## Keys

- Enter and Backspace move both panes in and up. Enter on a file pair opens the diff.
- Alt+Down and Alt+Up jump to the next or previous difference.
- F7 and Shift+F7 do the same in the full-window diff only. F7 stays New folder in the panes.
- Ctrl+Alt+Right and Ctrl+Alt+Left copy the file row or hunk.
- Ctrl+S saves the edited side.
- Esc clears the filter, then leaves compare.
- Ctrl+B, Ctrl+I and Alt+V work as in the other viewers. The diff has Simple, Rich and Custom modes.

## Settings

Settings > Compare holds:

- Git engine: "Installed Git" (default), "Built-in (gitoxide)" or "Automatic".
- The memory limit.
- An ignore list, and respect for `.gitignore`.
- Diff options: ignore whitespace, line endings, case and BOM.

## What was decided

- No size wall. The owner asked for it to be "really outstanding".
- Without Git, Ferrite uses the built-in engine and says so once. The installed engine needs Git 2.36 or newer.
- Ferrite never writes into `.git` and never stages anything.
- Folder sync waits for the delete safety net and job undo.

## Merge (before 1.0)

- Shows base, ours, theirs and a result.
- One-sided changes are taken automatically.
- A counter shows unsolved conflicts. Save stays off until it reaches zero.
- Whitespace-only conflicts resolve in bulk.
- `ferrite compare` and `ferrite merge` work with `git difftool` and `git mergetool`.

## Done and coming

- Done: the plan only. Research and a first spike are ready to start.
- Coming: everything above.

## Open questions

- Keys: Alt+Down and Alt+Up everywhere, F7 and Shift+F7 in full-window views only, and Ctrl+Shift+D for "Compare with other pane". The architect's defaults apply until the owner decides.

Refs: plans/2026-10-20-p42-compare.md (D70)
