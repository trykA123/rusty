# Handoff 2026-10-15 23:10 (Europe/Bucharest)

The five-hour usage window is at 90%. It resets in about 3h45m. The owner is asleep and granted overnight autonomy: commits, merges, pushes, releases, artifacts and agents are allowed without asking; nothing destructive on the machine.

Paths: `<worktrees>` = the `.crew` folder next to the repo; `<targets>` = `<worktrees>/targets`.

## Done

- **main = 823b589** (local, one commit ahead of origin). origin/main = c58ca3a.
  - Merges and decisions on main:
    - A2 encodings: merge 8315d14, which brings the round-2 fixes from 30d5d94.
    - D42, the main-window picks: 4e136a0.
    - D43, menus round 2 with A as the base: c58ca3a.
  - Plans log: bcf9d6a and 823b589.
  - The A2 worktree, branch and target are removed.
- **CI** is green on 8315d14 (run 38796152174).
- **Release alpha-2026-10-15e** is published from 8315d14.
  - Exe: 82,129,920 bytes, against a CI limit of 83,886,080.
  - The zip download returns HTTP 200.
- **Artifacts:**
  - Roadmap, republished at version 11: https://claude.ai/artifact/EMV6xF23ELbUZ7xU1einmY
  - Menus round 2, which the owner accepted as D43: https://claude.ai/artifact/BX7K9xiyp8QZ2Lm4SQZ5jM
  - Viewer and copy-pill round: https://claude.ai/artifact/CYsfu87k5G27ieXtjiQZty. The owner has not picked yet; the designer recommends variant 3 plus variant 1's strip.

## In progress (agents in the orchestrator session 445baebb)

| Agent id | Role | Worktree / branch | Doing |
| --- | --- | --- | --- |
| ad80e63849d0614ae | ui-builder-high (Opus high) | `<worktrees>/rusty-p15-a5b`, p15-a5b (771e9c9) | Merging main into the branch, then fixing review items 1–6 and the low items |
| a5400ca8b9e53c295 | reviewer (Opus high) | reads `<worktrees>/rusty-p15-a6`, p15-a6 (0fd19d1) | Reviewing A6 images |
| ae4ef3d77ffd58ac4 | ui-builder-high (Opus high) | `<worktrees>/rusty-p15-a7`, p15-a7 (from 8315d14) | A7: tree, table, markdown; brief `plans/2026-10-15/p15-a7-brief.md` |

- A5b fix list:
  - Follow restarts full scans: one sequential mark job, rerun after Done, append-only counting.
  - `rev` is bumped on Running.
  - Find jumps do not pause Follow.
  - Editor Find All copies whole lines.
  - Bookmark offset spaces: persist editor marks only when the text is byte-identical.
  - Stamp after save, the switch race, and dropped loads.
- A6 itself is finished: 0fd19d1. The Linux binary grows by 0.75 MiB. The screenshot was checked.
- **A8 is finished:** 325d9ce on p15-a8 (from 2063596). It is not reviewed yet; start a reviewer (Opus high) after the usage reset.
  - Exe: +0.69 MB on Linux.
  - Estimate with A6 and A8 both on main: Windows about 83.6 of 83.9 MB, which is very tight.
  - New crates: zip, tar, lzma-rust2, ruzstd and sevenz-rust2.
  - Its sniff predates A2: re-check the scores after merging main.

No crew runs. No background shell jobs.

## Open questions for the owner

1. May the CI exe limit go from 80 to 120 MiB? The exe is 82.1 of 83.9 MB now, and A6 plus A8 will push past it. Never raise the limit without the owner's answer.
2. Which viewer variant from https://claude.ai/artifact/CYsfu87k5G27ieXtjiQZty?

## Next steps, in order

1. **A6 review result:**
   - fix the findings through the A6 agent (a9515d601abbaf8a0 can be resumed) or a new Opus-medium worker;
   - merge main into p15-a6;
   - run the gate;
   - merge to main.
   - Hold the merge if the Windows exe would pass 83,886,080 bytes.
2. **A5b fixes:**
   - verify the diff and the gate log;
   - run a short re-review (reviewer, Opus high);
   - merge to main.
3. **After every merge to main:**
   - run `cargo clippy --all-targets -- -D warnings` and `cargo test` unpiped, with `CARGO_TARGET_DIR=<targets>/main`;
   - grep the diff for absolute paths;
   - push;
   - watch CI;
   - on green, publish the next `alpha-…` pre-release (zip built with python zipfile);
   - remove the worktree, branch and target.
4. **A7 and A8:** review, fix, merge. A8 has the same exe-size hold as A6.
5. **After A5b merges:**
   - A4b: the rule lexer in the editor and the paged rows, plus VB rules;
   - A5c: Db wiring for the memory, history and remember hooks, plus the paged stamp in `rusty-app` `files/paged.rs`;
   - A2b: encoding picker, decoded paged rows, editable mixed line endings.
6. **Then** A9 (P15 review), P16 automotive, and the audit items.
7. **Roadmap:** a Haiku agent updates it after each merge. Read the artifact, then republish it.

## Update: A6 review (after the usage warning, so no agent was started)

A6 review verdict: **PASS WITH FIXES.** Resume the A6 agent (a9515d601abbaf8a0) after the usage reset to apply these fixes.

**Must fix:**
1. **SVGZ bomb.** `usvg` decompresses `.svgz` with no limit (2 MB file → 2 GB RSS).
   - On `1f 8b`, gunzip yourself with `flate2` `.take(IMAGE_LIMIT + 1)` and refuse past the limit.
   - Add a test.
2. **Stack overflow on a 1000-deep SVG.** Windows thread-pool threads have 1 MiB stacks, so this aborts the whole app.
   - Run `vector()` on a `std::thread` with a 16 MiB stack, or reject nesting deeper than about 256.
   - Test on a 1 MiB thread.
3. **Detached decodes pile up while n is held.**
   - Add a liveness token (`Arc` held by `Opening`, `Weak` passed to the work).
   - Add a static `Mutex` around the image load, and skip it if the view is gone.
   - Test: count the `bytes` calls.

**Should fix:**
4. **Skipping non-images.**
   - While Opening, n/p falls back to `is_image_name(title)`.
   - Space/Backspace are also bound in the Viewer context.
5. **Peak memory.** Shrink, then orient; use `into_rgba8`; set explicit `max_alloc` limits; take TIFF orientation from the decoder.
6. **Missing tests.** Atlas entry dropped (`has_image_atlas_entry`); all 8 EXIF orientations.

**Merge notes:**
- A6 merges cleanly into main.
- A8 conflicts on `bytes`: keep A6's body (metadata size check, "Too large…" message) and its `pub type ReadBytes`.
- A5b: the conflicts are additive (`FileHooks` fields, test rigs, gallery).
- Suggested order: A5b, then A6, then A8 (rebase A8's sniff onto A2's `looks_binary`), then A7.

## Update: A5b fixes are done (not merged, because of the usage limit)

- **p15-a5b commits:** `cabb3e9` (real merge of main at 823b589, with the encoding label ported into `editor/view.rs`), then `504977b` (all review items 1–6 and the low items).
  - Gate: exit 0, all 9 steps passed; 2534 tests passed.
  - Verified: the worktree is clean and the gate log's last line is correct.
- **Next after the reset:**
  - run a short re-review (reviewer, Opus high) on `cabb3e9..504977b`;
  - merge p15-a5b into main;
  - run clippy and test unpiped on main, then push;
  - then do A6 fixes, A6 merge, A8 review.
- **Open risks from the worker:**
  - Tail counting assumes an append-only file: a file truncated and regrown keeps stale hits.
  - Bookmarks drift after a save that rewrites line endings. This case is now read-only through A2.
  - Remembered marks are rescanned once from 0.
  - Edit mode has no way back to read-only without closing.
