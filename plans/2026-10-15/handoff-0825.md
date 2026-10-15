# Handoff · 2026-10-15 08:25 (Europe/Bucharest)

The owner is compacting the context. This file replaces `handoff-0642.md`. **No agents are running.**

## Rules in force (owner, this session)

- **D34:** Opus `medium` replaces Sonnet `high`. Red atoms run on `checker` with `model: opus, effort: medium`.
- **D35: Claude only.** Never use Sol, Codex, Gemini or `mcp__crew__run`.
  - T3 backend Green atoms go to a `general-purpose` agent with `model: opus, effort: medium`.
  - Core and data-safety Green atoms are the orchestrator's own work, on Opus `high`.
- **Windows first:** a Linux-only CI failure is fine. `build-windows` needs only `gate-windows` (memory `windows-first-ci`).
- **Speed:** the owner wants continuous work. Run plans in parallel where the code does not depend on the other plan, and merge to `main` only after each gate.
- **Branches:** delete old branches once they are merged. On GitHub only `main` and active plan branches should remain.
- **Push hook:** before `git push`, run `cargo clippy --all-targets -- -D warnings` and `cargo test` as separate commands, with no edits after them.
- **GUI:** never add Hyprland outputs. Run GUI work in headless cage only (memory `no-virtual-outputs`).
- **Reply in Romanian.** Docs and code are in English. Plain, short answers. Give the owner exact numbered steps with direct links when they must download or run something.

## State

- **`main` is at `d0b6aaf`** (pushed). It holds P1, the D33 icon, P2 (spike, G2 draft, work-PC numbers), P3 (core, G3 passed) and P4 (storage, G4 passed).
- **`p5-diag`** (worktree `<worktrees>/rusty-p5`, at `1c9f931`; GitHub has an older copy).
  - L1–L10 are done: redact, event ring, memory, log layer, and report with the canary test. 176 diag tests pass.
  - **Left:** L11, then G5.
- **`p6-fs`** (worktree `<worktrees>/rusty-p6`, at `6e98525`, not pushed).
  - F1–F4 are done:
    - `Location` v2 with a lossless `ProviderPath`, and `FsError`;
    - listing request numbers, `pane.refresh`, `list_unloaded`;
    - the `Provider` trait and `FakeFs` with faults.
  - **Left:** F5–F10, then G6.
- **G2 (GPUI go or no-go) is waiting on the owner.** The numbers are in `docs/spike/results.md`; it proposes **GO**, with three follow-ups: a tray (resident) mode, Windows private-memory measurement, and a longer Intel scroll test.
  - Asked and not yet answered: does scrolling feel smooth to the owner? What does Narrator read on the list? Does the owner agree with GO?
  - P7 (the first real window) waits on G2.

## Next steps, in order

1. **F4 cleanup (D31).**
   - `crates/rusty-fs/src/fake/mod.rs` `FakeFs::location` uses an `expect` under `#[expect(clippy::expect_used)]`.
   - Add an infallible constructor to rusty-core, for example `Location::provider_root(ProviderId)` or `ProviderPath::root()`. Use it, remove the expect, run the gate, and commit on `p6-fs`.
2. **L11** (orchestrator, in `<worktrees>/rusty-p5`): `ferrite --diag-report <file.zip>` in `crates/rusty-app/src/main.rs`.
   - Build the identity from the env: `USERNAME`/`USER`, `COMPUTERNAME`/`HOSTNAME`, `USERDOMAIN`, `USERPROFILE`/`HOME`.
   - Build the `ReportInput` (version; commit through `build.rs` `cargo:rustc-env`; os; `available_parallelism`).
   - Memory probe: Linux `ProcStatusProbe`; Windows probe with `GetProcessMemoryInfo` through `windows-sys`, in rusty-app with a `// SAFETY:` line.
   - Call `rusty_diag::write_report`.
   - Test with `cargo run -p rusty-app -- --diag-report /tmp/x.zip`, then unzip it and check `report.json`.
3. **G5:** run `cargo xtask gate --coverage` on `p5-diag`, run `reviewer` (Opus, high) on `crates/rusty-diag` and L11, fix the findings, then merge `p5-diag` to `main` and delete the branch.
4. **P6 next atoms** (briefs still to write; plan `plans/2026-10-14-p6-locations-fs.md`):
   - F5: hostile-names corpus (`checker`);
   - F6: local provider Red;
   - F7 and F8: local provider Green on Linux and Windows (`general-purpose`, Opus medium);
   - F9 and F10: `io_queue` (Red by `checker`; Green by the orchestrator).
   - Before writing the briefs, merge `main` into `p6-fs`.
5. When the owner answers G2: record D2 as validated (or reopened) in `docs/decisions.md`, close P2 in its plan, then write the P7 briefs (`plans/2026-10-14-p7-poc-browse.md`, plus the G3 notes recorded there).

## Deferred items (recorded in the plan Logs)

- **P4:** job journal `synchronous = FULL` (P8); `StoreDirs`, the unclean-exit marker and a single-instance mutex (P7); stale temp-file cleanup and Windows retry (P8); `.corrupt` pruning and a cache schema version; `toml_edit` so comments survive (after PoC 2).
- **P3 / P7:** window, tab-activate and scroll commands; the cursor keeps the scroll in view.
- **P5:** the canary covers query fields named `query`, `search`, `filter`, `pattern` and `*_query`, which are replaced by their length.

## Owner downloads (already given)

- Spike: https://github.com/trykA123/rusty/actions/runs/38677189477
- `ferrite.exe` (prints its version only): https://github.com/trykA123/rusty/actions/runs/38682254004
