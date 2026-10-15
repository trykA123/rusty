# P9 · Navigation and quick filter

## Goal

Owner requests after the PoC 2 check (2026-10-15):

- Mouse side buttons (MX Master) and Alt+Left/Right go back and forward.
- Quick filter as you type, like Total Commander.
- A cancelled job row must not stay on screen.

## Decisions

- The filter matches the start of the name, case-insensitive (`Pattern` with a trailing `*`); a leading `*` matches anywhere.
- A letter that matches nothing is refused. Backspace widens the filter and only goes up a folder when no filter is active. Esc clears it. Leaving the folder drops it; a refresh keeps it.
- `Browser` keeps the full listing and hands the core the shown rows through `Event::ListingFiltered`, so cursor, marks, operations and the status bar act on what is shown. Marks on hidden rows are dropped.
- Done and Cancelled job rows leave after 4 s; a Failed row stays until Dismiss.

## Log

- 2026-10-15 — Built on `p9-nav-filter`. Review round 1: PASS WITH FIXES, all fixed with tests: a refresh that matches nothing drops the filter; a folder that fails to load still drops it (stale filters are pruned after every command); widening reveals the cursor; AltGr characters reach the filter; a size measured while its folder is hidden is kept.
- Deferred: dead keys and IME composition (for example `^` + `a`) need an input handler on the list; today only the bare accent arrives and is usually refused.
