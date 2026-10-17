# Handoff 2026-10-17 19:00 (Europe/Bucharest)

The seven-day usage window is at 98%. The owner asked: start no new agents; let the running ones finish; the next session (another account) continues from here. Speak to the owner in Romanian, in feature terms, never in plan or atom codes.

Paths: `<worktrees>` is the `.crew` folder next to the repo; `<targets>` is `<worktrees>/targets`.

## Done today (on main; pushed up to the P23 plan commit; later plan commits are local)

- P18 C5 offline state for shares (+ Windows network codes): merged, CI green.
- P15 A7b Markdown live preview and table columns: merged.
- P20 shortcuts complete: K2 command names, K3 keymap.toml built in, K4 user keymap.toml live, K5 Shortcuts page, K6 review + fixes (user keys bound after built-ins). Plan status done.
- P22 S1 complete ferrite.toml + defaults ledger (db V3); S2 live reload of ferrite.toml.
- P21 V6 live folder profile (subtree watch on Windows, patched counts, 250 ms); V7 F3 on a folder opens the preview, Esc closes it. Windows CI green on dc05a74.
- Releases: alpha-2026-10-17a (C5, L6, A7b) and alpha-2026-10-17b (K2–K4). Linux binary reinstalled from b76b288.
- Stale plan statuses closed (8131f3e); the roadmap exe target follows D44.
- New plans: P22 (D56, live complete settings file) and P23 (performance measured on every push).

## Still running when this was written (check each, then merge)

| Work | Worktree / branch | When it reports |
| --- | --- | --- |
| P22 review fixes (8 items: ledger failure after write, trailing comments moved, mixed endings, reload/save race, concurrent hand edit, start-up timeout, Unix read-only, tests) | `<worktrees>/rusty-p22-fix`, p22-review-fixes | Check the diff and gate log; merge with `--no-ff --no-commit`, run `cargo xtask gate`, commit; then run clippy and the tests as separate calls before publishing to origin. |
| P23 B1 `--metrics` / `--profile` in rusty-app | `<worktrees>/rusty-p23-b1`, p23-b1 | Same merge routine. Then B2 (CI job, infra-builder) and B3 (docs/perf.md). |
| P19 L7a look fixes (Mica, z-order, sheet width, F-key settings layer, labels, screenshots) | `<worktrees>/rusty-p19-l7a`, p19-l7a | Look at the screenshots in `design/screens/p19-*`, then merge. Then L7b. |
| Gemini 4 Argon prototypes (owner's test, not Claude) | `<worktrees>/prototypes/{lock-owner,pins,automotive,settings-state}/argon/index.html` | Screenshot each in Helium (playwright-core from another project's node_modules, executablePath Helium), check console errors, report honestly. The owner will give the same briefs (`<worktrees>/prototypes/*/BRIEF.md`, `COMMON.md`) to Opus to compare. Palette result: `prototypes/palette/argon/index-fixed.html` (the original broke on unescaped backslashes; its 4 directions were near-identical). |

## Next, in order

1. Merge the three running branches as above. Watch Windows CI after each publish.
2. Cut alpha-2026-10-17c only after the P22 review fixes are merged and CI is green (it writes the owner's ferrite.toml). Pattern: download the `ferrite-windows-x64-<sha>` artifact, zip with Python (`zip` is not installed), create the pre-release with `gh`, check the zip URL returns 200. Notes: Shortcuts page, complete live ferrite.toml, live folder preview, F3 on folders, Esc closes the preview.
3. P19 L7b (keys, quit flush, "Installed" word): row in the P19 plan.
4. P22 S3 (row state, upgrade notice, the owner's two bugs: rows move when the TOML key appears; F3 opens line 1 for keys not in the file; plus prototype gaps): full brief in the P22 plan. Then S4 review.
5. P23 B2 and B3.
6. P18 C4 prefetch, then C7 budgets and soak, then C8 review.
7. Roadmap artifact update via a Sonnet medium agent (it shows v16, 63%; now about 67% or more), then republish.
8. Then the owner's alpha priorities: Explorer clipboard, shell icons, lock owner in errors, per-monitor DPI; then commands with arguments (unblocks the Ctrl+K palette, `ferrite <path>` and pins).

## Owner feedback today (Windows 11 test of alpha-17b)

- Markdown preview: very fast. Settings sheet: looks great.
- Rows move when the blue TOML key appears; F3 on a key not in ferrite.toml opens line 1: P22 S3.
- ferrite.toml must hold everything, update itself, reload live, with fine control: D56 / P22.
- Preview counts stayed stale during a long copy (V6 done); F3 on a folder should open the preview (V7 done); Esc should close the preview (V7 done).
- The offline-share test and the keymap.toml test on Windows are not done yet (the owner's share was busy copying 250 GB).

## Rules learned today

- The publish hook inspects the whole shell command, including heredoc text: run clippy, the tests and the publish as three separate calls, and write files that mention those commands with the editor, not a heredoc.
- Merge with `--no-commit`, run the gate, then commit the merge; never commit a merge before the gate.
- Keymap count and snapshot conflicts between parallel atoms are expected: sum the added entries and check `.snap.new` diffs before accepting.

## Stopped agents (19:15)

- P23 B1 stopped on p23-b1 (WIP commit, notes in `plans/2026-10-17/wip-p23-b1.md`): flags and tests done; three clippy errors in `rusty-app/src/metrics` and the gate left.
- P22 review fixes stopped on p22-review-fixes (WIP commit, notes in `plans/2026-10-17/wip-p22-review-fixes.md`): all 8 findings fixed with tests; clippy, `xtask size` and the gate left. New issue to fix before release: if `ferrite.toml` is deleted while Ferrite runs and the user then saves from the sheet, the file comes back with only that one key and every other setting falls back to its default on the next load. Fix: a sheet save into a missing file writes the full current settings (as S1's completion would).
- P19 L7a: see `plans/2026-10-17/wip-p19-l7a.md` on p19-l7a once it confirms.
- Delete the `wip-*.md` notes from each branch before merging to main.
