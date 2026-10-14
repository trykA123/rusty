# P6 · Locations and file systems

Status: drafting (briefs get exact `Read` ranges when G5 passes) · Branch: `p6-fs` · After: G5

## Goal

Rusty reads folders through providers instead of raw paths. A fake file system with fault injection and a corpus of hostile names prove the behaviour on Linux CI; the local provider lists real folders on Linux and Windows in streamed batches; I/O queues keep each disk and share within limits; one error model describes every failure.

## Decisions

- D19 (drives, network), D21 (locations, fake file system, hostile names, error model, I/O queues).
- `Location { provider: ProviderId, path: ProviderPath }` lives in `rusty-core`; `ProviderPath` keeps Windows names as WTF-16 so invalid UTF-16 survives.
- The `Provider` trait lives in `rusty-fs`: `capabilities()`, `list(location, sink)`, `metadata(location)`; operations come in P8.
- Windows listing uses `FindFirstFileExW` with `FindExInfoBasic` and `FIND_FIRST_EX_LARGE_FETCH`, `\\?\` paths, batches of 512 entries.
- I/O queue priorities: visible, prefetch, idle. Limits per volume: SSD 8, HDD 1, network 4, removable 2; drive type from the seek-penalty query on Windows, from `/sys/block` on Linux.
- Coverage floor `rusty-fs = 80` added in F3.

## Components

| Component | Layer | Contract | Test |
| --- | --- | --- | --- |
| `location` | lib (core) | `Location`, `ProviderPath`, comparison by Windows rules | proptest: case-insensitive equality matches Windows ordinal rules |
| `error_model` | lib (core) | `FsError { kind, location, os_code }` → message + `RecoveryAction`s | unit + snapshot of every message |
| `provider` | contract (fs) | `Provider` trait, `Capabilities`, `EntryBatch` | compile-level; used by the next rows |
| `fake_fs` | adapter (fs) | in-memory tree; scripted faults: disk full, access denied, locked, network lost after N bytes, slow | unit |
| `hostile_names` | fixture (fs) | generator for long paths, invalid UTF-16, reserved names, trailing dots and spaces, mixed case | listing round-trip on fake and local |
| `local_provider` | adapter (fs) | streamed listing; `windows.rs`, `unix.rs` | integration on temp dirs; Windows job |
| `io_queue` | service (fs) | per-volume queues with priorities and limits; cancel by owner | unit + proptest: never above the limit |

## Atoms

| Atom | Component | Tier | Role | Effort | After | Check |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | `location`, `error_model` Red | T2 | checker | high | G5 | tests compile, fail |
| F2 | `location`, `error_model` Green | T4 | orchestrator | high | F1 | `cargo nextest run -p rusty-core location error` |
| F3 | `provider` contract + `fake_fs` Red | T2 | checker | high | F2 | tests compile, fail |
| F4 | `fake_fs` Green | T3 | api-builder | xhigh | F3 | `cargo nextest run -p rusty-fs fake` |
| F5 | `hostile_names` | T2 | checker | high | F4 | corpus tests pass on `fake_fs` |
| F6 | `local_provider` Red | T2 | checker | high | F5 | tests compile, fail |
| F7 | `local_provider` Linux Green | T3 | api-builder | xhigh | F6 | `… local` on Linux |
| F8 | `local_provider` Windows Green | T3 | api-builder | xhigh | F7 | `… local` on Windows CI, hostile corpus included |
| F9 | `io_queue` Red | T2 | checker | high | F4 | tests compile, fail |
| F10 | `io_queue` Green | T4 | orchestrator | high | F9 | `… io_queue` |
| G6 | gate | — | orchestrator + reviewer | high | F1–F10 | gate, CI on both OS, review |

F9–F10 run in parallel with F5–F8.

### Briefs (outline)

- **F1/F2:** error kinds: not found, access denied, sharing violation, locked, disk full, path too long, name invalid, network lost, timeout, cancelled, unknown(os code). Each maps to a user message and its recovery actions.
- **F3/F4:** faults are scripted per path and per operation count, so tests are deterministic.
- **F5:** the corpus is a function returning names; the test lists a folder containing all of them and gets every one back byte-for-byte.
- **F6–F8:** listing streams `EntryBatch`es through a bounded channel; cancelling stops within one batch; a 100k-entry folder delivers its first batch in under 20 ms on the dev PC.
- **F9/F10:** jobs carry an owner id; dropping the owner cancels its queued jobs; priority inversion is impossible because visible work preempts queued prefetch.

## Done when

- The hostile-name corpus round-trips on the fake and the local provider, on Linux and Windows.
- Faults produce the right `FsError` and recovery actions.
- `rusty-fs` coverage ≥ 80 %.
