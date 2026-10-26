# Beta senior-review follow-up

Status: running · Repo: beta worktree · Branch: `backend/beta-retention-on-main` · Base: `61400c8e`

## Goal

With experimental retention off, ordinary operations and recovery follow main behavior. Experimental retention warns about capacity and recovers both interrupted capture windows into terminal states.

## Decisions

- D1 — Owner requires flag gating, not acceptance of changed default behavior. No push or merge. One commit per numbered finding.
- D2 — Red behavioral probes precede each fix. Tests use isolated profiles and production factories/recovery. Preserve main's FAT fingerprint fallback and journal v2.
- D3 — Default operation checks do not scan or reject reserved paths. Experimental jobs retain strict path/catalog protection.
- D4 — Default unavailable journals/profiles fall back to unlogged operation. Default startup does no quarantine/rebuild/promote. Default saves replace leaf symlinks.
- D5 — Estimate delete bytes against the configured cap before confirmation. Never purge the current job's entries during its own maintenance pass.
- D6 — Restore proved held bytes when an interrupted overwrite left its target absent. Reconcile empty named preparation containers whose identity was not committed.
- D7 — Wait for other Cargo/rustc processes before every Cargo command. Use nice 10, eight build jobs and unpiped output to local logs. Run crate checks for every touched crate.
- D8 — Public notes contain no machine-specific paths. Only the existing Sol 6.1 xhigh reviewer may review; implementation remains direct.

## Components and atoms

| Atom | Component | Check | Status |
| --- | --- | --- | --- |
| A1 | default mutation and legacy recovery | stale-held and unreadable-folder probes | done |
| A2 | default availability/startup/save | unlogged jobs/creation, unavailable profile, corrupt DB, symlink probes | done |
| A3 | delete capacity and maintenance | byte-cap confirmation and same-job protection | done |
| A4 | interrupted retained overwrite | crash before replacement restores held bytes and terminates | done |
| A5 | interrupted capture preparation | empty unregistered container crash settles safely | done |
| A6 | legacy production coverage | migrate legacy fixtures to profile_factory/recover_profile | done |
| A7 | retained-delete wording | small retained delete avoids permanent wording | done |

## Done when

All findings have red/green evidence, requested crate checks, separate commits and a concise report. Default behavior remains main-compatible. No push or merge.

## Log

- 2026-10-26 — Index-service task finished separately at `6b5ce40a`; this worktree starts clean at `61400c8e`.
- 2026-10-26 — Finding 1: three main-compatibility probes failed first, then passed through profile_factory and recover_profile with a real data path. Default checks no longer traverse reserved trees; experimental checks stay active. Recovery receives explicit experimental mode. Restored two UI fault-injection counts to main after removing the extra default metadata checks. App/UI check passed all 7 steps (123.8 s), 3,096 tests passed and three skipped.
- 2026-10-26 — Finding 2: all four default-compatibility probes failed first. Added legacy startup with the main session lock and simple journal recovery; only experimental startup uses quarantine/rebuild/promote. Default unavailable stores use unlogged operations, creation and saves. Default saves replace leaf symlinks through an explicit atomic-entry writer; experimental hooks resolve/protect their targets. App/store check passed all 7 steps (25.9 s), 1,142 tests passed and four skipped. Quarantine fixtures now explicitly opt in.

- 2026-10-26 — Finding 3: three red probes reproduced missing byte-cap confirmation and same-pass deletion of fresh entries. Confirmation carries the current policy and warns above its byte cap. Maintenance protects all entries owned by its completing job while still counting their bytes; a subsequent job can enforce quota. App/core/UI/retention/store/l10n check: all 7 steps passed (120.1 s), 5,175 tests passed and six skipped.
- 2026-10-26 — Finding 3 review: an old serialized v1 job above its cap failed production recovery first. Separate new-job admission from durable structural validation, preserving old recovery/salvage compatibility. App/core check: all 7 steps passed (54.6 s), 2,057 tests passed and one skipped.
- 2026-10-26 — Finding 2 review: three red production-startup probes covered middle-page corruption, repaired sentinel rechecks and pruning beyond 50 completed jobs. Restore main integrity bookkeeping and bounded history without quarantine. App/core check: all 7 steps passed (54.6 s), 2,057 tests passed and one skipped.
- 2026-10-26 — Finding 2 final review: clean startup with corruption confined to job-step pages also failed a red production probe. Record corruption returned by the whole journal-recovery path. App/retention/store check: all 7 steps passed (36.3 s), 1,199 tests passed and four skipped.
- 2026-10-26 — Finding 4: red crash probes covered missing placement and an older already-adopted pending job with a lost completion commit. Return fully proved held bytes through no-replace rename, then atomically retire existing returned catalog rows and finish as Failed. Matching returned originals permit retry after holder cleanup; ambiguous evidence stays pending. Both-version recovery now terminates while retaining previous bytes. App/retention/store check: all 7 steps passed (36.3 s), 1,199 tests passed and four skipped.
- 2026-10-26 — Finding 5: two red crash probes reproduced the unknown-container-identity window in the engine and production profile recovery. Verify source, expected sibling record, parent, observed folder identity, mount and emptiness before removing the unregistered container and aborting preparation. Nonempty containers preserve their bytes in Conflict. App/retention check: all 7 steps passed (23.3 s), 652 tests passed and one skipped.
- 2026-10-26 — Finding 4 final review: an altered owner plan failed a red no-move probe. Validate all proof records against the durable owner after progress callbacks and before any put-back; repeat owner/path validation for returned records in the consuming transaction. App/retention/store check: all 7 steps passed (38.7 s), 1,203 tests passed and four skipped.
- 2026-10-26 — Finding 4 authority follow-up: a terminal owner borrowing another job’s proof failed a red no-move probe. Recovery preflight now requires Running or RestorePending; terminal metadata completion remains idempotent. App/retention/store check: all 7 steps passed (26.5 s), 1,205 tests passed and four skipped.
- 2026-10-26 — Finding 5 review: a source-replacement callback failed a red deterministic probe. Recheck the original after progress/listing before removing the empty container or reporting Aborted. Changed originals keep Conflict. App/retention/store check: all 7 steps passed (26.5 s), 1,205 tests passed and four skipped.
- 2026-10-26 — Finding 2 correction: main's editor save follows a leaf symlink and writes its target; the earlier default replaced the link with a regular file. A red probe failed first; default saves use main's writer again, experimental saves keep the entry writer on the resolved target. Stale-holder probes now also cover Rename and Delete.
- 2026-10-26 — Finding 6: the shared test helpers `log_factory` and `recover` now call `profile_factory` and `recover_profile` with a real profile path, so every legacy job test runs the production default path. Recovery always receives a data path; the test-only `recover_report` is gone.
- 2026-10-26 — A7: a small retained delete asks "Delete N?" with a Recently deleted note instead of "permanently". A red probe failed first.
