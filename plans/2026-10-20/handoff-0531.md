# Handoff 2026-10-20 05:31

Supersedes handoff-0135. Chat with the owner in Romanian, docs in English, features not atom IDs. Model cap: at most Opus high and Sonnet high; implementers on Sonnet, reviews on Opus. Agent ids stay out of the repo (the session scratchpad file `agent-ids-1819.md` has them; ListAgents shows running agents).

## Done (on origin/main, 392b6e0)

- Since handoff-0135: main window parts and the window View menu (p33-w1), encoding picker with paged UTF-16/single-byte text and editable mixed line endings (p15-a2b, three review rounds on line-ending safety), defaults-changed notice and find a setting (p22-s3b).
- Releases: alpha-2026-10-20c (3544551, TASKING map view), alpha-2026-10-20d (344ca92, window parts + encoding), alpha-2026-10-20e (392b6e0, find a setting + defaults notice).
- Roadmap artifact version 3 (79 %, 98 of 128): https://claude.ai/artifact/L4sAzDwLP6vj3pCgGSyjFn (branch `roadmap-update`, docs only, not merged).
- Merged worktrees, branches and target caches removed after each merge.

## In progress

| Work | Where | State |
| --- | --- | --- |
| P33 V2 Markdown and preview sheet parts | .crew/rusty-p33-v2, branch p33-v2 (7e8142c) | Opus review said fix first (nested preview folder shows hidden largest files to the cursor; failed Keep hidden by marks; stale "Kept" note; two commands without handlers; dead split storage; focus taken from the find bar). A Sonnet agent is applying the fixes. Next: verify, merge main in, gate, push for Windows CI, merge, release |

## Known issues found tonight

- The gallery PDF drawers "hang" was a misread: a checker ran the full screenshot run twice (140 shots, about 3 min 45 s, drawers page at about 3 min 28 s). Give screenshot runs `timeout 300` and a new, empty folder; do not judge progress by file count.
- After a crash during a parallel copy, up to N complete new copies can remain after "rolled back" (sources intact; documented in the P30 Log).
- Mixed line endings: deleting the second of two equal adjacent lines gives the kept line the first one's ending (documented in the P15 Log).

## Open questions for the owner

1. Copy safety vs speed: every copied file is flushed to disk before it is journaled; robocopy is about 20× faster on 200 × 5 MiB in CI. Keep the per-file flush, flush in batches, or flush only at the end of the job?
2. Try the TASKING map view (alpha-2026-10-20c or later) on the work `.map`; never commit work files.
3. The `.mdf` file: what is it?
4. Earlier: shell icons, PC tuning approval, P31 second-monitor check.

## Next steps, in order

1. Finish V2 (verify the fix report, merge main in, gate, clippy + test, push, Windows CI, merge, clean up, release).
2. Roadmap update (Sonnet; keep the count from the plans, 128 items), republish.
3. Next atoms: P32 Fluent L1, P16 B5/B6b/B7 after the owner's files, map parser fixes from the owner's real map.
