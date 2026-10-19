# Handoff 2026-10-19 15:31 (usage at 90 % of the 5-hour window)

Read this first. Chat with the owner in Romanian, docs in English, features not atom IDs.

## Done (verified)

- **main** at 2a39829 locally, 10 commits ahead of origin/main, NOT pushed yet:
  - D58 (calm by default, the user decides what to see: whole app) in docs/decisions.md; P33 plan `plans/2026-10-19-p33-view-parts.md` (V1 shared View menu Alt+V, Ctrl+B/Ctrl+I drawers, Display settings; W1 main window parts; V2; V3 review).
  - P30: A3 parallel Auto copy + A7 one-step overwrite merged (merge 2a39829, gate passed 102 s, Windows CI green on p30-a7 run 39249915633). A8 added (undo of an overwrite must restore the old file; today it deletes the target and the old file is gone).
  - P16 Log: owner's work set is `.elf` 10 MB, `.hex`, `.map` 4.6 MB, `.mot`, a 389-byte `.mdf` (unknown format), CAN traces in Vector `.asc`.
  - Main CI rerun 39244320836 (bab04f2) is green: the failure was a flaky test.
- **Roadmap** updated on branch `roadmap-update` (4508830, worktree `.crew/rusty-roadmap`), published as a NEW artifact https://claude.ai/artifact/L4sAzDwLP6vj3pCgGSyjFn (old ones belong to other accounts). Merge `roadmap-update` into main.
- **p15-a10a** PDF engine: Windows fixes 699d522 (CRLF in the pinned-version test; cfg(test)+cfg(windows) for Job Object tests), pushed; Windows CI being watched (task bemls9hyb, run 39251060269).
- **p16-b2** HEX/S-record memory view: 0b6a14e + cfce478, main merged in at 553205a (gate passed). Opus review: ship after fixes (8 items, sent to the agent).
- **p17-m8** right-click on empty space + New file (Shift+F7): 76514a2, gate passed. Opus review: fix first (clipboard read on the UI thread; plus 5 small items, sent to the agent).

## In progress (agents and jobs)

| What | Agent / job id | Worktree | Branch | Doing |
| --- | --- | --- | --- | --- |
| HEX review fixes | agent aefc8ba241bf99ad6 | .crew/rusty-p16-b2 | p16-b2 | 8 review fixes: lost trailing comment in ferrite.toml on upgrade (data loss), drawers covering the status line, line-length cap, piece bounds, fragmentation cap, fetch retry loop, record lengths 02/04/03/05, implicit parent tables |
| M8 review fixes | agent a1a8d7d957a1b247e | .crew/rusty-p17-m8 | p17-m8 | `has_files()` via IsClipboardFormatAvailable, Paste-enabled test, Properties Windows test, warm background menu, Sort-by re-pick, keymap test, Shift+F7 in F-key bar |
| ELF viewer (P16 B3) | agent a2900113c6a2c453e | .crew/rusty-p16-b3 | p16-b3 (from 553205a) | object+gimli parser, symbol table, sections drawer, inspector with DWARF lines |
| ASC trace viewer (P16 B6) | agent a42e0e1fc2f904475 | .crew/rusty-p16-b6 | p16-b6 (from 553205a) | Vector ASC parser, virtualised table, ID navigator, inspector, follow |
| Flaky tests | agent a6b4f3c14fed6ca4d | .crew/rusty-ci-flakes | ci-flakes | settings background-start WAIT race, preview Escape after F3, crash::tests under plain `cargo test` (process-global panic hook) |
| Release backtraces (P29 C3) | agent a11f424929f105988 | .crew/rusty-api-builder-6h5d1 | crew/api-builder-6h5d1 (on p15-a10a) | redaction treats Rust lifetimes `for<'a,'b>` as quotes and eats frames; Codex's release-profile/probe changes uncommitted there |
| Cache budgets (P18 C7) | agent acc24f686d2375ed9 | .crew/rusty-p18-c7 | p18-c7 | pinned stats, budgets, soak |
| Bench copy (P30 A5) | Codex crew api-builder-6ibvd (finished 15:36, exit 0) | .crew/rusty-api-builder-6ibvd | crew/api-builder-6ibvd (on p30-a5-base) | done but UNCOMMITTED: xtask/src/bench_copy/ (7 modules), xtask main/Cargo, Cargo.lock, ci.yml; reported gate passed (104.8 s), 11 bench tests; Linux small set Standard 13.9 s vs Auto 13.6 s (drive Unknown → 1 worker). Next: review the diff by hand, commit, rebase on main (A3/A7 merged), push for the Windows robocopy run |
| Clippy on main for push | bash bg1nvlntf (passed) | main checkout | main | push hook needs `cargo clippy --all-targets -- -D warnings` then `cargo test -- --test-threads=1` (crash tests flake in parallel until ci-flakes lands) |
| PDF CI watch | bash bemls9hyb | — | p15-a10a | watching run 39251060269 |

Empty worktree waiting: `.crew/rusty-p33-v1` (branch p33-v1 at 553205a) for P33 V1.

## Open questions for the owner

1. Which compiler writes the `.map` (first 3–5 lines of it)? `.mot` hints Renesas CC-RH/CC-RL, which is not in D4's toolchain list yet.
2. What is the 389-byte `.mdf`?
3. From the earlier handoff: shell icons (Lucide vs Windows icons); PC tuning (swappiness) needs approval.
4. P31 owner check on Windows: second monitor at another scale, maximized, undock/redock.

## Next steps, in order

1. Main: clippy passed at 15:33 but this handoff's commit resets the push hook, so rerun `cargo clippy --all-targets -- -D warnings`, then `cargo test -- --test-threads=1` (each standalone), then push main; watch CI; publish pre-release alpha-2026-10-19e (copy engine, window placement, settings Default/Changed, preview browsing, prefetch) — pattern in memory `exe-releases`.
2. Merge `roadmap-update` into main.
3. p15-a10a: when run 39251060269 is green, merge to main (merge --no-ff --no-commit, gate, commit); release zip must then contain `dist/` with pdfium.dll. Then start P15 A10b (PDF viewer UI, D57 + D58 keys, Opus medium).
4. p16-b2: after the fixes, check them against the review, rerun reviewer briefly if large, push for Windows CI, merge, release → owner tests `.hex`/`.mot` at work.
5. Start P33 V1 in `.crew/rusty-p33-v1` (ui-builder-high, Opus high) after p16-b2's fixes are committed (rebase/merge p16-b2 into p33-v1 first). Then W1 after p17-m8 merges, then V2, V3.
6. p17-m8: after fixes, push, Windows CI, merge.
7. ELF and ASC: on report, look at screenshots, review (Opus), Windows CI, merge after p16-b2.
8. ci-flakes, C3, C7, A5: verify reports, review, CI, merge. Then P30 A4 (copy.mode setting) and A8 (undo overwrite).
9. After each merge: Sonnet agent edits `design/roadmap.html` in a worktree; the orchestrator republishes https://claude.ai/artifact/L4sAzDwLP6vj3pCgGSyjFn.

## Rules learned today

- Commit before running the push-hook checks; start other-worktree checks with `cd <worktree> &&` and call `cargo clippy`/`cargo test` by name (cargo-q does not count).
- Builds through `/mnt/Sabrent/homelab/.crew/bin/cargo-q`, one target dir per worktree.
- Subagents never publish artifacts; the orchestrator does.
