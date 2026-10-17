# WIP — P23 B1 (`--metrics`, `--profile`, `--left`, `--right`)

Branch `p23-b1`. Red commit `20b939b`; this wip commit holds the Green work so far.

## Done (Green written, targeted tests pass)

- `cli.rs`: `Command::Open(Start)` with `--view`, `--profile`, `--metrics`, `--left`, `--right` in any order; clear refusals (`needs a value`, `given twice`, `stands alone`, `unknown argument`), each ending with the usage; `--metrics` attaches the console. Tests: `cli::tests`.
- `profile/`: `--profile <dir>` uses `StoreDirs::in_profile` (`<dir>/config`, `<dir>/data`); `--metrics` without `--profile` uses a fresh `ferrite-metrics-*` temp folder deleted on exit; detection of the user's folders is never called in metrics mode. Tests: `profile::tests`, `rusty-store dirs::tests::a_profile_folder_holds_both_dirs`.
- `startup/`: `place_panes` puts `--left`/`--right` folders in the two panes; `path_location` makes paths absolute. Tests: `startup::tests`.
- `metrics/`: `Report` serde schema (snapshot `metrics/snapshots/metrics_report.snap`), `ProcessClock` from OS process start (Windows `GetProcessTimes` + `GetSystemTimePreciseAsFileTime`; Linux `/proc/self/stat` + `/proc/uptime`), memory (existing diag probe for private/working set; peak from `VmHWM` or `PeakWorkingSetSize`), start-up marks, `Run` writes the JSON and sets the exit code. Tests: `metrics::tests`.
- `rusty-ui window_view/start_watch.rs`: `StartWatch` in `StartOptions`; records first frame, first usable frame (both panes listed), renderer from `gpu_specs`, marks; after 5 s idle calls the report and `cx.quit()`. Tests: `window_view::tests::start_watch`.
- `main.rs` / `gui.rs` wired: `gui::Launch`, marks for settings, session, databases, listing cache, window opening.

## Left

1. Clippy fails in `crates/rusty-app/src/metrics/`: unused re-exports in `mod.rs` (`Memory`, `Build`, `Measured`, `Report`) and unused `ProcessClock::start` outside tests. Fix: drop those re-exports (tests use `super::report::…`/`super::memory::…` paths) and mark `start()` `#[cfg(test)]`.
2. Run `cargo clippy --workspace --all-targets -- -D warnings`, then `cargo xtask gate > <log>` (not yet run on Green).
3. Windows code (`clock.rs` `process_age`, `windows_memory.rs` `counters`/`peak_working_set`) is not compiled locally (no Windows target); CI must confirm.
4. Live run: only headless (e.g. `cage` with `WLR_BACKENDS=headless`, `DISPLAY` unset); otherwise skip and leave it to B2.
5. Commit Green with the repo message style; report.

## Exact next step

Fix the three clippy errors in `crates/rusty-app/src/metrics/mod.rs` and `clock.rs`, rerun clippy, then the gate.

## Failing now

- No known test failures: the targeted run (`cli::`, `profile::`, `metrics::`, `startup::`, `start_watch`, `in_profile`) passed 54/54 before the last clippy fixes; the full workspace test suite has not been run on Green.
- `cargo clippy` fails (the three errors above), so the build of `rusty-app` with `-D warnings` is red.
