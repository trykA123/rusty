# Alpha portion of the Opus review

Source: `8c081606:docs/reviews/2026-10-25-alpha-validation-opus.md`, reviewed at `24acde8e`.

The isolated `backend/alpha-opus-fixes` branch starts at `e3fbd8a5`, before P35 and D65. It contains the alpha fixes below and a strict atomic rename helper needed by log rotation. Recovery and retention will be replayed onto a separate beta branch. No branch was merged or pushed.

| Finding | Result | Verification |
| --- | --- | --- |
| M4 | Unsupported/zero 128-bit queries fall back on the same handle; a separate legacy identity domain survives the journal. Unconfirmed rollback keeps its proof pending. | Parser/domain/restart tests pass; native exFAT/SMB tests added but not run on Linux. |
| m8, version nit | Completed physical steps of Stuck batches, including a confirmed uncertain step, get an incomplete versioned audit. Logs rotate at 10 MiB under a stable separate lock, preserving unknown backups and late collisions. | Lost acknowledgement, rollback failure, rotation, collision, raw profile path and concurrent batch tests pass. |
| m9 | Internal FileDrag reentry clears native/outgoing restrictions while actual external drags retain their platform handling. | The Copy-only native-offer → internal Move probe failed before the fix and now passes. |
| Missing test 9 | A replaced member of a swap survives UI Undo, and the blocked owned member remains restore-pending. | Red-first UI regression and durable replacement recovery test pass. |
| A1 (follow-up review) | Both ID paths now check the filesystem name. FAT, FAT12, FAT16, FAT32, exFAT and unknown names give no proved identity. Rename there works as on main and records a size, modified-time and kind fingerprint. Rollback, Undo and recovery act only on a match; Undo reports a changed item, recovery leaves it pending. Fingerprints are version 2 journal records; version 1 stays readable. An unreadable filesystem name counts as unknown, so F2 on NTFS never fails on it. A fingerprint also matches across an exact one-hour modified-time shift (FAT daylight saving). | Seam, rename, rollback, Undo, recovery and journal tests pass on Linux, including swaps and cycles of identical fingerprints with a fault and Undo. The recovery probes failed before the fix. The native exFAT and FAT32 tests are added but not run. |

FAT-family and exFAT drives give no proved identity. Their renames rely on the weaker fingerprint described in A1. Native Windows verification is still required; see [the test instructions](../testing/windows-identities.md). The Linux toolkit regression does not substitute for a real native OS drag round trip.

The final Linux gate passed all 10 steps in 133.3 seconds: 7,074 passed, 14 skipped, plus documentation tests. The final binary built. Native startup passed both themes at desktop and compact sizes; all four screenshots were inspected. Test data and profiles were temporary. Sol 6.1 xhigh completed read-only review without remaining concrete alpha findings.

The remaining Opus findings belong to the beta follow-up. This alpha result does not close M1–M3, M5, or the recovery/retention minor findings.
