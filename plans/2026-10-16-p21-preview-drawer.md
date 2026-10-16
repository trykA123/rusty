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

## Atoms

| Atom | What | Role | Effort | After | Check | Status |
| --- | --- | --- | --- | --- | --- | --- |
| V1 | Side sheet component (D1), gallery page | ui-builder-high | high | — | UI tests: sides, resize, snap at 1100 px, reduced motion; screenshots both themes | done |
| V2 | Folder profile service (D3) in rusty-fs | api-builder (Opus medium) | medium | — | fake fs tests: progress, cancel, top 10, kinds cap, skipped; property test on totals | done |
| V3 | Preview host: toggle, follow, files read-only, folder layout (D2, D4, D6) | ui-builder-high | high | V1, V2 | UI tests: debounce, cancel, Tab jump, each kind; screenshots | ready |
| V4 | Browse mode (D5) | ui-builder | medium | V3 | UI tests: focus in and out, Enter on folder and file, F3, double-click | done |
| V5 | Review | reviewer (Opus high) | high | all | verdict | running |

## Done when

- The owner opens the preview on the work PC, browses a big folder on the share without freezes, and opens items from it.
- The gate and Windows CI are green; the reviewer passes.

## Log

- 2026-10-16 — Plan written after the owner picked direction 1 and accepted the revised prototype (tree first, opaque headers, browse and open).
- 2026-10-16 — V2 (cd6601a) merged: `folder_profile` + `spawn_profile` (Idle priority, cancel on drop) in rusty-fs, `ProfileCache` (256, keyed by location + change time) in rusty-cache. For V3: invalidate cached profiles on watch events too (a folder's change time ignores deep edits); never wait for a final snapshot after a drop.
- 2026-10-16 — V1 (ef1db36) merged: `rusty_ui::side_sheet` (SheetFrame, SheetState, SideSheet builder, Ctrl+[ / Ctrl+] actions). Accepted: snap at body width ≤ 1100 px; `shadows.sheet` replaced with symmetric D52 values plus `sheet_ring`; grip uses `colors.faint` (3.9–4.2:1). V3 must call `side_sheet::bind_keys` and `on_resize_keys`.
- 2026-10-16 — V3 (6ca8bb6, review fixes e41769f) merged: Ctrl+Q and card button; 150 ms follow with load ids; files via the F3 path read-only; folder tree first (lazy, 2,000 cap cut in the worker), stats, types, largest; ProfileCache with watch invalidation (one drop for batches over 64); Esc clears filter, then stops the scan. Open: duplicate one-line header inside F3 bodies; no F-key Preview chip; 1440 px unchecked.
- 2026-10-16 — V4 (bccbb72, 960d6fa) merged: Ctrl+Shift+Q browse (opens the sheet if closed), ↑ ↓ across tree and largest, ← → fold, Enter navigates or reveals then returns focus to the list, F3 views, file bodies get focus under the Viewer context. Open: bodies that own Esc/Tab (Markdown links, archive) take those keys first; F3 on a folder row does nothing.
