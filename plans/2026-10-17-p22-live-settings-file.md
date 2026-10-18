# P22 · A complete, live settings file (D56)

Status: ready · Repo: `<repo>` · Branch: `p22-sN` per atom · Started: 2026-10-17

## Goal

`ferrite.toml` lists every setting with its value, follows new defaults for keys the user never changed, reloads live when edited by hand, and the settings sheet shows, per row, whether a value is the default or the user's own, with reset and a notice when defaults change.

## Decisions

All decided (D56, L6 decision B); workers never reopen them.

- **D1 — Complete file.** At start, off the UI thread, every missing key is added with its current default in its section, in place with `toml_edit` (comments, order, CRLF/BOM kept), `atomic_write`, one `.bak` per session. Existing values are never changed by this step.
- **D2 — Defaults ledger.** `ferrite.db` table `settings_defaults(key TEXT PRIMARY KEY, value TEXT, written_at)` records the default Ferrite wrote. A key is *following* when its file value equals the ledger value; otherwise it is *the user's*. On upgrade, following keys whose default changed are rewritten to the new default and the ledger is updated; the user's keys are never touched. A user who types the default by hand counts as following.
- **D3 — Removed settings.** Keys Ferrite no longer knows stay in the file with a `# no longer used by Ferrite` comment above them, added once.
- **D4 — Live reload.** The settings folder watcher (as in P20 K4) reloads `ferrite.toml` on change; valid → apply live as the sheet does; invalid → keep the last valid settings, show the error with its line in the status line, never rewrite the file until it is valid again. Saves from the sheet must not echo back as a second apply.
- **D5 — Row state.** Each row in the sheet shows Default or Changed; Changed rows have Reset, which writes the current default and marks the key following again.
- **D6 — Upgrade notice.** When following keys change default, a notice lists each (`files.sort: name → date`) with Keep old value, which writes the old value as the user's own.
- **D7 — Fixes from the owner's test (2026-10-17).** The blue TOML key line under a row reserves its space so rows never move; F3 on a key missing from the file goes to its section header, else the last line, with a status note that the default applies.

## Atoms

| Atom | What | Role | Effort | After | Check | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Complete file and defaults ledger, upgrade rewrite, removed-key comments (D1–D3) | orchestrator or Opus high | high | — | store tests: comments and order kept byte-for-byte, user keys untouched, following keys updated, ledger migration | done |
| S2 | Live reload of ferrite.toml (D4) | Opus medium | medium | S1 | app tests: edit on disk applies, invalid kept and reported, no echo after a sheet save | done |
| S3 | Row state, reset, upgrade notice, layout and F3 fixes (D5–D7), plus the prototype-A gaps from the P19 L7 review: a "Find a setting" field, a footer "Applied live · Saved to ferrite.toml · N changed", a changed-from-default dot, a "Live" chip | ui-builder-high | high | S1, S2, review fixes, P20 K5 | UI tests and screenshots, both themes | blocked |
| S4 | Review | reviewer (Opus high) | high | all | verdict | blocked |

### S3 brief

- **Read:** this plan (D5–D7), D56, the S1/S2 log lines, `crates/rusty-ui/src/settings/` (rows, view, controls), `window_view/settings_news.rs`, `crates/rusty-app/src/settings/start.rs` (`default_changes`), `design/prototypes/menus-settings-d43.html` (direction A).
- **Change:** row state Default/Changed from the ledger comparison exposed by rusty-store (add a read API if missing; no I/O in rusty-ui); Reset writes the current default and marks the key following; "Only changed" filter; the upgrade notice lists `default_changes` with Keep old value per item and Accept all, shown once, never modal; the TOML key line keeps its space so rows never move; F3 on a key missing from the file goes to its section header, else the last line, with a status note; plus the prototype gaps above.
- **Check:** `cargo xtask gate`; UI tests for each behaviour; gallery screenshots light and dark, looked at.
- **Stop if:** the ledger cannot tell Default from Changed for a key without a store change larger than a read API.

## Done when

- A fresh install writes a full `ferrite.toml`; F3 on any row lands on its line.
- Editing a value by hand applies without a restart; a broken file is reported and the app keeps working.
- A simulated default change updates following keys only, and the notice offers Keep old value.
- The gate and Windows CI are green; the reviewer passes.

## Log

- 2026-10-17 — Plan written after the owner's alpha-17b test (settings sheet praised; rows move when the TOML key appears; F3 opens line 1 for keys not in the file) and the owner's decision that the file holds everything, live, with fine control (D56). Starts after P20 K5 merges, since both touch the settings sheet.
- 2026-10-17 — S1 merged (99e3e6d): `reconcile` = upgrade, complete, mark unused, then a safety check that refuses any result that loses a value; ledger in `ferrite.db` V3 (`settings_defaults`, canonical TOML values); start-up runs it on a thread before the window, writes only on change through the store's atomic write and session `.bak`, records the ledger after the write; unparsable files are never touched; `default_changes` kept on the start state for S3. 59 new tests incl. a proptest. Keys with no default (`terminal.command`, `editor.path`, `[experimental]`) are not written; a key deleted by hand comes back with the current default.
- 2026-10-17 — S2 merged (40a6b8d): shared `watch_file` for keymap.toml and ferrite.toml (two watchers on the settings folder); `Reloader` reloads under the store lock, sends Applied or Invalid (file, line, column); echo skipped by comparing with the store's current settings and again in the window; a broken file is never rewritten (save refuses it); deleting the file keeps the current settings; S1's completion runs only at start. No setting needs a restart; the six fields the sheet marks as not applied are unchanged.
