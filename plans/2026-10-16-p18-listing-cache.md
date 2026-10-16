# P18 · Listing cache, revalidation and pre-warming

Status: ready · Repo: `<repo>` · Branch: `p18-cN` per atom · Started: —

## Goal

Going back into a folder, even a huge one on a network share, shows its listing at once with the cursor where it was, then refreshes quietly. Open panes follow changes on disk by themselves. A share that stops answering shows its last listing marked offline instead of freezing the pane. Every cache stays inside a byte budget that the diagnostics view shows.

The owner hit this on 2026-10-16: on a mapped network folder with thousands of entries, entering a subfolder and pressing Back listed everything again.

## Decisions

From docs/architecture.md ("Speed: caching, lazy loading, pre-warming"), which already holds them; `rusty-cache` was never built.

- **D1 — Memory listing cache.** Key: location + volume serial. Budget 64 MB by bytes, LRU. Entries hold the listing rows, the sort keys and the folder's change time at read time. Bounded and owned by one service.
- **D2 — Stale while revalidating.** A cached listing shows at once, marked as cached. A fresh listing streams in the background and is applied as a diff; cursor, selection and scroll stay on the same names. A folder whose change time is unchanged and has an active watcher is not re-listed.
- **D3 — Watchers on open panes.** `ReadDirectoryChangesW` (works on SMB shares) for each open pane's folder, debounced; events patch the cached listing. A watcher that fails or overflows falls back to revalidation on focus and an interval for network locations (D-beta network refresh modes later).
- **D4 — Pre-warming.** The cursor resting on a folder for 150 ms prefetches its listing (at most two prefetches at once, cancelled when the cursor moves on). The parent of the current folder stays cached while you are inside it, so Back is always warm.
- **D5 — Network.** Listing has a 2 s timeout for the first batch and never blocks the UI. A share that does not answer shows "Offline · showing cached" with the time of the cached listing, and retries in the background.
- **D6 — Disk cache.** `cache.db` keeps listings of pinned and workspace folders only, 32 MB, lz4 compressed, never trusted without revalidation. Used to draw the panes right after start.
- **D7 — Visible budgets.** The diagnostics view shows each cache's size against its budget; the soak test (10,000 tabs, 50,000 folders on the fake file system) checks the heap returns within 2 % of baseline.

## Components

| Component | Layer | Contract (in → out) | New / change | Test |
| --- | --- | --- | --- | --- |
| `ListingCache` | rusty-cache | `get/put/patch/evict` by key, byte budget, LRU | new | unit, property |
| listing service | rusty-fs / app | `list(location) → cached snapshot + fresh stream` | change | fake fs tests |
| diff apply | rusty-ui pane | `old rows, new rows → kept cursor, selection, scroll` | change | headless UI tests |
| watcher | rusty-fs (Windows) | `watch(location) → change events` | new | Windows CI tests on temp folders |
| prefetch | rusty-ui pane | cursor rest 150 ms → prefetch | new | UI tests with the fake fs |
| disk cache | rusty-store `cache.db` | pinned listings, lz4 | new | store tests |

## Atoms

| Atom | Component | Role | Effort | After | Check | Status |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | `ListingCache` (D1) | Red checker, Green api-builder | medium | — | `cargo test -p rusty-cache` | ready |
| C2 | stale-while-revalidate and diff apply (D2) | ui-builder-high | high | C1 | UI tests: Back is instant, cursor kept, diff applied | blocked |
| C3 | watchers (D3) | api-builder (Opus high) | high | C1 | Windows CI tests | blocked |
| C4 | pre-warming (D4) | ui-builder | medium | C2 | UI tests | blocked |
| C5 | network timeout and offline state (D5) | ui-builder-high | high | C2 | fake fs with a stalled share | blocked |
| C6 | disk cache (D6) | api-builder | medium | C1 | store tests | blocked |
| C7 | budgets in diagnostics and soak test (D7) | api-builder | medium | C1–C6 | soak test in CI | blocked |
| C8 | review | reviewer (Opus high) | high | all | verdict | blocked |

## Done when

- On the owner's mapped share, Back into a folder of thousands of entries shows it at once with the cursor kept, then refreshes without a jump.
- A file created in Explorer appears in an open pane within a second.
- Pulling the network shows "Offline · showing cached" instead of a frozen pane.
- The soak test passes; the gate and Windows CI are green; the reviewer passes.

## Log

- 2026-10-16 — Plan written after the owner's network test.
