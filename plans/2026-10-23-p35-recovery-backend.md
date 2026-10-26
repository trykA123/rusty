# P35 storage recovery backend

Status: done (storage backend; Linux gate and review passed, native Windows pending) · Repo: the backend worktree · Branch: `backend/alpha-validation` · Started: 2026-10-23

## Goal

Implement P35's storage components: preserve a damaged database and its sidecars, then salvage verified table groups into an empty healthy database. Return structured recovery details for the startup and notice integration.

## Decisions

- D1 — The owner requested continued backend implementation after the alpha logging fix. Implement the next storage feature from P35; alpha Windows validation remains open.
- D2 — Implement and check everything in the main agent. Use only Sol 6.1 xhigh for the final read-only review.
- D3 — This storage stage implements quarantine and salvage. Startup activation and its persistent user notice remain the following P35 integration stage; no automatic profile reset is enabled here.
- D4 — Quarantine is called before opening SQLite connections, under the caller's sole-profile ownership. Use no-replace hard links followed by unlink, reject links/directories, and serialize recovery operations with a separate file lock.
- D5 — Record the chosen slot and whether it contains a database before moving anything. Resume only that recorded destination. Without a record, orphan sidecars get their own empty slot: never attach an unproven WAL to an older database. This strengthens P35 D2 against replaying an unrelated journal.
- D6 — A source and destination that both exist during a resumed move require manual attention; never guess which copy may be removed. Preserve every existing path on errors.
- D7 — Salvage opens the backup read-only with checkpoint-on-close disabled. Validate each table and its field storage types/nullability, then copy each group transactionally. Journal tables form one group; reject invalid pending/restore plans, states and foreign-key relationships.
- D8 — Preserve all currently supported user tables, including command use and rename presets added since the original P35 plan. Report reset tables, copied row counts and readable unfinished-job/held-file records.
- D9 — Reuse the workspace's installed and locked serde_json version for journal plan validation. Add no new external package or database migration.

## Components

| Component | Layer | Contract (in → out) | New / change | Test |
| --- | --- | --- | --- | --- |
| `recovery::quarantine` | adapter | closed database path → preserved file set or contextual failure | new | real temporary files, interrupted moves, collisions and orphan WALs |
| `recovery::salvage` | service | quarantined database, empty healthy Db → copied/reset table and journal report | new | real SQLite damage, malformed plans, constraints and WAL preservation |

## Atoms

| Atom | Component | Role | Effort | After | Check | Status | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q1a | Quarantine contract and regressions | self | high | — | tests fail against initial stub | done | |
| Q1b | Quarantine implementation | self | high | Q1a | quarantine regressions pass | done (Linux) | |
| Q1c | Salvage contract and regressions | self | high | Q1b | tests fail against initial stub | done | |
| Q1d | Salvage implementation | self | high | Q1c | salvage regressions pass | done (Linux) | |
| Q1e | Recovery integration and gate | self | high | Q1d | full gate, real temporary database exercise | done (Linux) | |
| Q1f | Review and documentation | Sol 6.1 reviewer | xhigh | Q1e | read-only review, all findings resolved | done; P2 resolved, no remaining findings | |

## Done when

- Original database/WAL bytes survive quarantine, collisions and interrupted moves without replacement.
- An unrelated orphan WAL cannot be replayed into a fresh or older database.
- Only verified tables are copied; an untrusted journal copies no rows and returns manual-recovery details.
- The full Linux gate and one Sol 6.1 xhigh review pass. Native Windows runtime remains explicitly pending.
- P35's remaining startup and notice work is recorded separately; changes stay on this local backend branch.

## Log

- 2026-10-23 — Reviewed P35, the current schema, journal recovery and crash sentinel. Existing corruption classification also includes disk I/O errors; automatic startup integration must distinguish these from actual SQLite corruption. SQLite's per-table integrity check excludes foreign keys, so destination constraints and journal validation also gate salvage. Source: https://sqlite.org/pragma.html#pragma_integrity_check.
- 2026-10-23 — Eight quarantine regressions failed against the initial stub, then all nine passed. Eight salvage regressions also failed against the initial stub. After implementation, all 25 targeted store/app regressions passed, including real damaged SQLite pages, exact hot-WAL preservation, legacy schema defaults, read/constraint rollback and actual job recovery against FakeFs. Added a native-Windows sharing regression and a real orphan-WAL replay regression before the full gate.
- 2026-10-23 19:00 EEST — Full Linux gate passed all 10 steps in 196.5 seconds: 7,086 tests passed, 14 skipped, plus documentation tests. The first attempt caught a decimal Unix permission literal in a test; corrected it to `0o000`, with no rule changes. The 26 new Linux tests include an actual SQLite orphan WAL that cannot populate a fresh or older database. Source/backup bytes and failed-journal filesystem behavior are exercised on temporary data only. Started the single Sol 6.1 xhigh read-only review. Native Windows sharing remains unverified.
- 2026-10-23 — Sol 6.1 xhigh found one P2: SQLite's non-STRICT tables allow a BLOB in `rename_preset.rules`; generic value copying preserved it and broke `Db::presets()`. A new public-adapter regression reproduced the failure. Added destination-schema type checks, nullable-field rules and non-null primary keys before each row is copied. Added malformed integer/real/blob and nullable-primary-key cases. Rechecking the affected integration tests and full gate; the reviewer only reads code.
- 2026-10-23 — All 28 targeted storage/app tests passed after the type fix. The same Sol 6.1 xhigh reviewer confirmed that P2 is resolved, legacy defaults remain supported and no further actionable findings remain. Final full gate is running on the corrected implementation.
- 2026-10-23 — Final `CARGO_BUILD_JOBS=8 nice -n 10 cargo xtask gate` passed all 10 steps in 188.0 seconds: 7,088 tests passed, 14 skipped, plus documentation tests. The corrected implementation has no unresolved review findings. Logs: a local verification log, a local verification log, a local verification report; initial failure evidence includes a local verification log. Storage components are complete. P35 startup ownership/checking, durable report activation, persistent notice and native Windows runtime checks remain the next integration stage. Main and the original backend worktree remain unchanged.
- 2026-10-24 — Startup ownership, durable recovery phases and the persistent notice are now implemented in the [startup integration plan](2026-10-24-p35-startup-notice.md). Quarantine also retains a completed receipt until replacement and notice persistence are acknowledged. Native Windows verification remains open; the integration's final Linux gate is running.
- 2026-10-24 — The startup integration passed all 10 Linux gate steps (7,117 tests passed, 14 skipped, plus doc tests), final-binary native recovery/restart checks and read-only Sol 6.1 xhigh review. P35 implementation is complete on this local branch; native Windows verification remains pending.
