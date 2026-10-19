# P29 · Crash report

Status: ready · Repo: `<repo>` · Branch: `p29-cN` per atom · Started: 2026-10-19

## Goal

When Ferrite crashes, the evidence is kept: a redacted crash record is written at the moment of the panic, and the next start says "Ferrite closed unexpectedly" with one action to save a diagnostic report that includes it. Architecture: "Crashes: a panic hook writes a redacted crash report"; diagnostics table row "Panics and crashes: message, thread, backtrace, the last events before the crash". Today nothing catches a panic.

## Decisions

Final. Workers never reopen them; a worker that finds one wrong stops and reports.

- **D1 — Panic hook.** Installed in rusty-app right after logging, for window runs (not `--version`, `--diag-report`, or a second launch that hands off). It chains to the previous hook. On any panic, on any thread, it writes `<data>/logs/crash-<UTC yyyymmdd-hhmmss>-<pid>.json`: version, commit, thread name, panic location (file:line as compiled), the panic message passed through rusty-diag's text redactor, `std::backtrace::Backtrace::force_capture()` frames as text, and the last 200 events of the event ring (already redacted). Written with the existing atomic write; never panics itself; a failure to write is ignored. At most 5 crash files are kept (oldest removed).
- **D2 — Unclean exit.** A marker `<data>/running` is created after the instance lock is taken and removed on a clean quit (the existing quit path). At the next start, a marker that is still there means the last run ended uncleanly, even without a crash file (a hard kill, power loss).
- **D3 — Next start.** After an unclean exit, the window shows a notice "Ferrite closed unexpectedly last time." with two actions: "Save report" and "Dismiss" (Esc). Save report writes the normal diagnostic report (as `--diag-report` does) plus every crash file into `ferrite-report-<yyyymmdd-hhmm>.zip` in the user's Downloads folder (Known Folder; on other systems `~/Downloads`, else the home folder), then opens a new tab there with the cursor on the zip and shows "Saved ferrite-report-….zip in Downloads". Both actions clear the state, so the notice shows once per crash.
- **D4 — Privacy.** Nothing is sent anywhere. The canary test of rusty-diag is extended: a panic message containing the canary user name, path and server name must not appear in the crash file.
- **D5 — Out of scope.** Restoring the session is already automatic; SQLite integrity checks after a crash are a later atom.

## Atoms

| Atom | What | Role | Effort | After | Check | Status |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | D1, D2, D4, and a `crash::pending(data_dir) -> Option<Pending>` plus `crash::save_report(…) -> Result<PathBuf>` API for the UI | api-builder (Codex sol xhigh), then reviewer (Opus medium) | xhigh | — | unit tests: hook writes a redacted file (canaries absent), chains, keeps 5, never panics on a read-only dir; marker created and removed on clean quit, left on a simulated crash; `pending` reports unclean exit with and without crash files; `save_report` zip contains the report and crash files; gate | ready |
| C2 | D3 notice and actions in the window | ui-builder (Opus medium) | medium | C1 | UI tests: notice after an unclean start, none after a clean one, Save report opens the tab on the zip and shows the message, Dismiss and Esc clear it; screenshots light and dark; gate | blocked |

## Done when

- A forced panic in a test build leaves a crash file without personal data, and the next start offers the report; the gate passes.

## Log

- 2026-10-19 — Plan written. No panic hook exists; reports are saved only with `--diag-report`.
