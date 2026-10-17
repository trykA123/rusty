# WIP: P22 review fixes (branch p22-review-fixes)

Stopped at the owner's usage limit. All eight findings are implemented with tests. The quality gate (`cargo xtask gate`) and clippy have NOT run yet.

Last test runs (all green): `cargo nextest run -p rusty-store` (322 passed), `-p rusty-ui settings` (45 passed), `-p rusty-app settings` (36 passed). No test is known to fail.

| # | Finding | State | Tests |
| --- | --- | --- | --- |
| 1 | Ledger failure after the write | done with test | store `settings/tests/safety.rs` (failed ledger write, crash heal); app `start_tests.rs` (failed ledger write); probed red without the fix |
| 2 | Trailing comment moves under a new section | done with test | `complete.rs` `a_trailing_comment_stays_under_its_own_section` (incl. commented-out keys), `..._stays_last_when_no_section_is_added`; red before the fix |
| 3 | Mixed line endings | done with test | `text_layout/tests.rs`, `complete.rs` mixed tests, `safety.rs` mixed sheet save; red before the fix |
| 4 | Reload vs sheet save race | done with test | `rusty-ui window_view/tests/settings_news.rs` (three orders); app `tests.rs` rising generation; red before the fix |
| 5 | Sheet save overwrites a hand edit | done with test | `safety.rs` hand edit during save, during completion, file created during save; app `tests.rs` retry once |
| 6 | Start-up waits forever | done with test | `start_tests.rs` slow completion (2 s wait, shared session backup), failed start thread; probed red without sharing |
| 7 | Read-only file and mode | done with test | `safety.rs` unix read-only and mode; `atomic_write/tests/unix.rs` mode kept |
| 8 | Missing tests | done | `live_tests.rs` deleting the file; `tests.rs` save refused while broken |

## What is left

1. Run `cargo clippy --all-targets -- -D warnings` and `cargo xtask size`; fix any findings (watch `settings/mod.rs` in rusty-store and `text_layout/endings.rs`).
2. Run `cargo xtask gate` to a log file; expect `gate: all N steps passed`.
3. Squash or follow up with a proper commit message; report to the orchestrator.

## Decisions taken

- Fix 5: the store fails with `ChangedOnDisk` (checked just before the rename); the app's save hook retries that change once on the new file, so both the hand edit and the sheet change survive; a second conflict is reported as a failed field.
- Fix 6: a `SessionBackup` token is shared between the start thread's store and the fallback store, so the session keeps one `.bak` of the pre-session file. A late completion writes only if the file is unchanged since it read it.
- Fix 7: read-only means the file's read-only permission; completion returns `ReadOnly` and writes nothing, saves report it. Every atomic write now copies the old file's mode.
- Fix 3: also applied to sheet saves and keymap saves through the shared `text_layout` (a changed line keeps its own ending).
- Files touched outside settings: none of `main.rs`, `gui.rs`, `startup/` (start API unchanged).
