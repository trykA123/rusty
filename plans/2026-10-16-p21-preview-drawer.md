# P21 · Preview drawer (D52)

Status: ready · Repo: `<repo>` · Branch: `p21-vN` per atom · Started: 2026-10-16

## Goal

Ctrl+Q opens a side sheet over the passive pane that previews whatever is under the cursor in the active pane. Folders show their file structure first, then size, counts, last change, space by type and the 10 largest files, counted in the background. Files show the F3 views read-only. Items in the preview open from there. Prototype: design/prototypes/preview-drawer-d52.html, direction 1 (chosen).

## Decisions

All decided (D52, D43, D45); workers never reopen them.

- **D1 — Sheet.** One opaque side sheet component, shared with the settings sheet (P19 L6): slides in from the passive side, jumps sides on Tab so it always covers the passive pane, own width (default 42 % of the body, at least 320 px, never leaves the active card under 360 px), grip and Ctrl+[ / Ctrl+] in 48 px steps, a footer hint strip, snaps exactly over the passive card at 1100 px and below. Enter motion is a short slide and fade; reduced motion fades only.
- **D2 — Follow.** The preview follows the active cursor after 150 ms without movement; a newer cursor cancels the older load; holding an arrow loads only where it stops. Focus never enters the sheet unless the user asks (D5).
- **D3 — Folder profile.** Background, cancellable (Esc), streamed every 100 ms: total bytes, files, folders, newest change, bytes and counts per extension (at most 64 kinds plus "other"), the 10 largest files with relative paths, skipped folders. Bounded memory; results cached per folder with its change time; on a share it runs at low priority and never blocks the UI. The folder's size also appears in its list row when done.
- **D4 — Layout.** Folder: Contents tree first (lazy, children read when opened, the tree component's folds), then stat cards, by type with bars, largest files. Files: the F3 kinds read-only and compact (text with colours, image, JSON/YAML/XML tree, CSV table, Markdown, archive, font, hex). Sticky section headers are opaque.
- **D5 — Browse.** Ctrl+Shift+Q moves focus into the sheet (the list cursor turns passive, the sheet gets the accent ring, a "Browsing" chip shows); ↑ ↓ move, ← → fold, Enter on a folder navigates the active pane into it, Enter on a file reveals it (active pane goes to its folder with the cursor on it), F3 views it, double-click does the same as Enter, Esc returns focus to the list.
- **D6 — Toggle.** Ctrl+Q and a Preview button in the active card's header; the state is remembered for the session.

- **D7 — Live profile (2026-10-17, owner).** While the sheet shows a folder, Ferrite watches its whole subtree (ReadDirectoryChangesW with subtree on Windows; Linux may stay at the current behaviour). Changes patch the totals, types and largest files from the events (stat only the changed paths); the sheet refreshes at most every 250 ms. A full recount runs only on watcher overflow, on Ctrl+R in the sheet, or when the cached profile is older than the last overflow. The sheet shows "counted at HH:MM:SS" and "live" while watching.
- **D8 — F3 on a folder (2026-10-17, owner).** F3 on a folder row opens the preview sheet on that folder (as Ctrl+Q does); if the sheet is already open, it moves focus into it (browse mode). Ctrl+Q stays.
- **D9 — Esc closes the preview (2026-10-17, owner).** Like the settings sheet. In browse mode, Esc closes the sheet and returns focus to the list. In the list with the sheet open, Esc first clears the filter, then stops a running scan, then closes the sheet.

## Atoms

| Atom | What | Role | Effort | After | Check | Status |
| --- | --- | --- | --- | --- | --- | --- |
| V1 | Side sheet component (D1), gallery page | ui-builder-high | high | — | UI tests: sides, resize, snap at 1100 px, reduced motion; screenshots both themes | done |
| V2 | Folder profile service (D3) in rusty-fs | api-builder (Opus medium) | medium | — | fake fs tests: progress, cancel, top 10, kinds cap, skipped; property test on totals | done |
| V3 | Preview host: toggle, follow, files read-only, folder layout (D2, D4, D6) | ui-builder-high | high | V1, V2 | UI tests: debounce, cancel, Tab jump, each kind; screenshots | ready |
| V4 | Browse mode (D5) | ui-builder | medium | V3 | UI tests: focus in and out, Enter on folder and file, F3, double-click | done |
| V5 | Review | reviewer (Opus high) | high | all | verdict | done |
| V6 | Live folder profile: subtree watch while shown, counts patched from events, full recount only on overflow or Ctrl+R, "counted at" time (D7) | api-builder (Opus high) | high | V5 | fake fs tests: a write deep in the tree updates totals within 1 s; overflow triggers one recount; no recount loop on a busy share | done |
| V7 | F3 on a folder opens the preview (D8); Esc closes the sheet (D9) | ui-builder (Opus medium) | medium | V5 | UI tests: F3 on a folder opens or focuses the sheet on it; F3 on a file unchanged; Esc in browse mode closes the sheet and returns focus; Esc in the list closes it only after the filter is clear and no scan runs | ready |

## Done when

- The owner opens the preview on the work PC, browses a big folder on the share without freezes, and opens items from it.
- The gate and Windows CI are green; the reviewer passes.

## Log

- 2026-10-16 — Plan written after the owner picked direction 1 and accepted the revised prototype (tree first, opaque headers, browse and open).
- 2026-10-16 — V2 (cd6601a) merged: `folder_profile` + `spawn_profile` (Idle priority, cancel on drop) in rusty-fs, `ProfileCache` (256, keyed by location + change time) in rusty-cache. For V3: invalidate cached profiles on watch events too (a folder's change time ignores deep edits); never wait for a final snapshot after a drop.
- 2026-10-16 — V1 (ef1db36) merged: `rusty_ui::side_sheet` (SheetFrame, SheetState, SideSheet builder, Ctrl+[ / Ctrl+] actions). Accepted: snap at body width ≤ 1100 px; `shadows.sheet` replaced with symmetric D52 values plus `sheet_ring`; grip uses `colors.faint` (3.9–4.2:1). V3 must call `side_sheet::bind_keys` and `on_resize_keys`.
- 2026-10-16 — V3 (6ca8bb6, review fixes e41769f) merged: Ctrl+Q and card button; 150 ms follow with load ids; files via the F3 path read-only; folder tree first (lazy, 2,000 cap cut in the worker), stats, types, largest; ProfileCache with watch invalidation (one drop for batches over 64); Esc clears filter, then stops the scan. Open: duplicate one-line header inside F3 bodies; no F-key Preview chip; 1440 px unchecked.
- 2026-10-16 — V4 (bccbb72, 960d6fa) merged: Ctrl+Shift+Q browse (opens the sheet if closed), ↑ ↓ across tree and largest, ← → fold, Enter navigates or reveals then returns focus to the list, F3 views, file bodies get focus under the Viewer context. Open: bodies that own Esc/Tab (Markdown links, archive) take those keys first; F3 on a folder row does nothing.
- 2026-10-16 — V4 review fixes (a86af11) merged: focus kept across file and folder reloads, spot keyed by tree node, first row selected after Ctrl+Shift+Q on a closed sheet, parameter structs. V5 done through the V3 and V4 reviews. Open: a reloaded folder tree comes back collapsed.
- 2026-10-17 — Owner, on alpha-17b: the folder profile stayed at 601.2 GB / 1,313,827 files while a copy kept writing deep inside for minutes (cache keyed by the folder's change time, watcher not recursive). Decided D7 (live subtree watch, patched counts, refresh every 250 ms; a full recount every second would cost minutes per pass on 1.3 M files) and D8 (F3 on a folder opens the preview). V6, V7 added.
- 2026-10-17 — Owner: Esc does not close the preview sheet. It was never bound (browse-mode Esc only returns focus; list Esc clears the filter), unlike the settings sheet. Decided D9, folded into V7.
- 2026-10-17 — V6 merged (9baf93d): `Provider::watch_tree` (Windows subtree ReadDirectoryChangesW; Linux still folder-only), one live session per shown folder applying changes as deltas (stat only changed paths; new folders walked once; folder renames rewrite paths), snapshots every 250 ms; the walk keeps the 100 largest files plus a floor so removals need no rescan; recount on overflow, Ctrl+R (`preview.recount`), unknown removals, a short largest list or >4,096 queued changes, one at a time with one follow-up, automatic ones spaced by the last count's duration. Sheet shows Live, Counted at HH:MM:SS, Recounting. Limits: growth of a file that existed before its first event is missed until a recount; the Windows code is first compiled in CI; no footer hint for Ctrl+R yet.
