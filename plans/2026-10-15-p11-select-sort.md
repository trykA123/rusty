# P11 · Pattern marking and column sorting

## Goal

Two Alpha gaps from Total Commander habits: Num+/Num−/Num* marking and sorting by column.

## Decisions

- `+` (Num+ or main keyboard) opens "Select files" with `*.*`; `-` opens "Unselect files"; `*` inverts the file marks (folders stay as they are, like TC). With a quick filter active the three keys go to the filter, since `-` is common in names. Windows reports Num+ and `+` as the same key.
- Sorting lives in `Browser` next to the filter, because it needs sizes and dates. Folders always come first. Ctrl+F3 name, Ctrl+F4 extension, Ctrl+F5 date, Ctrl+F6 size; the same column again reverses. A header click does the same. The active column shows an arrow. The sort is per tab and survives refreshes and the quick filter; it is not saved in the session yet.

## Log

- 2026-10-15 — Built on `p11-select-pattern` while the owner was away (approved). Gate green.
