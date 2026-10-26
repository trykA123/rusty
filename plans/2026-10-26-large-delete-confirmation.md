# Large permanent-delete confirmation

Status: done · Repo: the backend worktree · Branch: `backend/beta-recovery-retention` · Started: 2026-10-26

## Goal

Resolve Opus m2. A deletion beyond the retained-plan node limit shows a localized warning and offers permanent deletion. Cancel keeps every file; confirmation runs the ordinary permanent-delete backend.

## Decisions

- D1 — Main agent implements. Existing Sol 6.1 xhigh performs read-only review. No merge, push or deployment.
- D2 — Reuse the existing permanent-delete confirmation and its cancel/danger/protected-path behavior. Delete requests already require this confirmation before constructing any job log.
- D3 — Oversized permanent deletes show the recovery-limit warning in that confirmation. The approved backend uses ordinary permanent deletion only for this exact size boundary. Other invalid retained plans, settings and guards keep their errors.
- D4 — Keep the core retained-delete limit unchanged. Use the same node limit for the warning and backend selection. Experimental retention remains gated.
- D5 — Add the warning to the localization catalog. Reuse the existing dialog and tokens, with no extra settings or approval state.

## Components

| Component | Layer | Contract | Change | Test |
| --- | --- | --- | --- | --- |
| Retained-delete limit | core | Plan → size-limit predicate | extend | exact boundary and operation-kind checks |
| Profile operation factory | service | Confirmed oversized Delete → ordinary journaled delete | change | over-limit accepted, within-limit retained, invalid inputs still refused |
| Existing confirmation | UI | Oversized Delete → localized permanent-delete warning | change | label, danger, typed protected confirmation and cancel |
| Native dialog verification | integration | Both themes and compact/desktop sizes | verify | screenshots inspected and cancel preserves isolated files |

## Atoms

| Atom | Component | Role | Effort | After | Check | Status | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Limit predicate and factory | main | high | — | red/green factory boundary regression | done | |
| A2 | Localization and confirmation | main | high | A1 | localized title and permanent label | done | |
| A3 | Browser cancellation/confirmation | main | high | A2 | cancel leaves files; confirm selects permanent execution | done | |
| A4 | Verification/report | main | high | A3 | Sol review, full gate and native dialog checks | done | |

## Done when

- A valid over-limit deletion passes the factory and runs permanent deletion after the existing confirmation.
- A within-limit experimental deletion remains retained. Invalid retention settings and unrelated invalid plans never trigger permanent fallback.
- The size warning is localized; Cancel and protected-location safeguards remain effective.
- Relevant checks, Sol review, complete gate and native dialog checks pass. No live data is used.

## Log

- 2026-10-26 — Read Opus m2, existing profile factory, core retained-delete validation, Browser confirmation flow and native dialog. Chose the existing required permanent-delete confirmation rather than adding a second approval protocol.

- 2026-10-26 — Original approved-large-delete factory probe failed with the English retained-plan error. Implemented typed DeleteTooLarge only after full structural/path validation, ordinary permanent fallback after the existing mandatory confirmation, and localized warning/title. First affected check passed all seven steps: 4,531 tests, three skipped (167.5 s). Sol found dot-component validation masking; a new oversized-dot regression reproduced red and clean-path validation now precedes the size error. Final verification follows. Native fixture contains 100,001 isolated empty files; cancellation must preserve all and create no job.

- 2026-10-26 — Dot/dot-dot regression is green; all six retained-delete core tests pass. Sol confirmed the validation-masking finding is closed. Final binary build passed (21.5 s). Final full gate exited zero after all ten steps: 7,319 tests passed, 17 skipped (121.3 s), a local verification log. An earlier native harness stop interrupted its shell after the gate had printed success; the final native harness uses a separate process session and the gate was rerun cleanly.
- 2026-10-26 — Four native Linux dialog/cancel cases passed: light/dark, 1280×720 and 640×480. Inspected all four screenshots. Each cancellation preserved 100,001 isolated files and created zero jobs; test compositor stop exited zero. Final artifacts: the local evidence folder, report a local verification report, log a local verification log. Temporary input helper uses existing system Wayland/xkbcommon libraries; no dependencies were installed. Fixture files are removed after validation, while screenshots and reports remain. No Windows run, merge, push or deployment.
