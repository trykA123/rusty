# P2 · GPUI spike

Status: running · Branch: `p2-spike` · After: G1 (done 2026-10-14)

## Goal

Find out with numbers whether GPUI with `gpui-kit` can carry Rusty: design B's look, 100,000 rows, three panes and the drawer, inside the v1 targets. The result is a go or no-go for D2, decided with the owner at G2.

## Decisions

- Spike code lives in `spikes/` and is not part of the product. It is deleted or archived after G2; lessons go to `docs/spike/results.md`.
- `gpui-kit` at its latest release (0.7.3 today), pinned exactly.
- Visual reference: `design/prototype/dir-b.css`, `design/prototype/shared.css`, `design/screens/b4-1440.png`.
- Start from variant 1 of `spikes/gpui-b-variants` (branch `spike/gpui-b-variants`, D27): its tokens, static fonts and shell already exist. S2 and S3 extend it; S1 adds the open gaps listed in D27 (scrollbar, gpui-kit TabBar, Table and Dock not yet tried, Windows untested).
- Targets from `docs/roadmap.md`: cold ≤ 400 ms, warm ≤ 150 ms, idle RAM < 80 MB with two panes, `.exe` < 30 MB; scrolling 100k rows without dropped frames at 60 Hz.
- Measurements on three machines: Linux dev PC, `windows-latest` CI (software rendering, for start-up and memory only), the owner's work PC (manual run).

## Components

| Component | Layer | Contract | New | Test |
| --- | --- | --- | --- | --- |
| `gpui-kit-notes` | research | questions → `docs/spike/gpui-kit-notes.md` | new | sections present |
| `spike-shell` | ui | design B window: top bar, rail, three panes, drawer, F-key bar | new | screenshot against `b4-1440.png` |
| `spike-list` | ui | 100k synthetic rows in a virtual list, keyboard navigation, selection | new | headless test: scroll to row 99,999, select it |
| `spike-metrics` | tooling | run → JSON: first-frame time, frame times, working set, binary size | new | JSON schema test |
| `fuzzy-bench` | tooling | 2M synthetic names → table: `nucleo` vs `frizbee` | new | bench runs, prints both |
| `a11y-probe` | ui | AccessKit tree of the list → roles and names | new | headless assertion |

## Atoms

| Atom | Component | Tier | Role | Effort | After | Check | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | `gpui-kit-notes` | T1 | researcher | medium | G1 | notes answer every question below, with links | running |
| S2 | `spike-shell` | T4 | orchestrator | high | S1 | window opens on Linux; screenshot reviewed by orchestrator | blocked |
| S3 | `spike-list` | T4 | orchestrator | high | S2 | headless test passes; manual scroll smooth | blocked |
| S4 | `spike-metrics` | T2 | ui-builder | medium | S3 | `spike --metrics` prints valid JSON | blocked |
| S5 | `fuzzy-bench` | T3 | api-builder | xhigh | G1 | `cargo bench -p fuzzy-bench` prints the table | running |
| S6 | `a11y-probe` | T2 | ui-builder | high | S3 | headless test finds list rows with names | blocked |
| S7 | Windows run | — | orchestrator | — | S4, S6 | CI job uploads metrics JSON; owner runs on work PC | blocked |
| G2 | go or no-go | — | orchestrator + owner | — | S1–S7 | `docs/spike/results.md` written; D2 updated | blocked |

S5 runs in parallel with S1–S4.

### Briefs (outline)

- **S1:** answer, with links to `gpui-kit` docs and source: how to depend on `gpui-kit` alone; the virtual list and table APIs and their row-height rules; the dock layout and its serialisation; the theme format (`.theme-schema.json`) and how to map our tokens; headless UI test setup; AccessKit support on Windows; Windows build needs (MSVC, DirectX); known issues on Windows in the last three releases.
- **S2:** a `spikes/gpui-b` binary reproducing design B's shell from the reference files: top bar with search, rail (pins, workspaces, drives), three panes in a horizontal split with tabs and path bars, drawer with two views, F-key bar. Tokens from `dir-b.css` as one Rust theme struct. Light and dark.
- **S3:** each pane shows 100,000 synthetic rows (name, size, date, kind) in the `gpui-kit` virtual list; Up/Down/PageUp/PageDown/Home/End, Space and Insert select, Tab switches panes. Headless test drives the keys.
- **S4:** `--metrics` flag: time from process start to first presented frame, frame-time percentiles while auto-scrolling 10 s, working set after 5 s idle, binary size; JSON to stdout. Cold and warm runs from a script.
- **S5:** `spikes/fuzzy-bench` with `divan`: 2,000,000 path-like names generated with a fixed seed; queries of 1, 3 and 8 characters; time per query and memory for `nucleo` and `frizbee`, plus result quality on 20 hand-picked queries.
- **S6:** read the AccessKit tree in a headless test: the list has the list role, rows have names, the focused row is reported.
- **S7:** a manual CI job (`workflow_dispatch`) runs the spike on `windows-latest` and uploads the JSON; the owner runs the same `.exe` on the work PC and pastes the JSON.
- **G2:** the orchestrator writes `docs/spike/results.md` with all numbers against the targets; the owner decides go or no-go. No-go reopens D2 with the fallback recorded in `docs/discussion.md`.

## Done when

- Every target has a measured number on Linux and the work PC.
- D2 says "validated" or is reopened, with the numbers linked.

## Log

- 2026-10-14 — Early Windows numbers from the variants prototype on the work PC (Intel UHD + NVIDIA T1200 laptop, CrowdStrike present). Release `.exe` 17.6 MB with fat LTO and `panic=unwind`.
  - Default (GPUI takes DXGI adapter 0 = NVIDIA): first frame 566–667 ms. Phases: platform and DirectWrite init ~170 ms, D3D11 device on the NVIDIA GPU ~250–310 ms, our fonts and Segoe lookup ~4 ms, window and first render ~145 ms.
  - The owner set the app's GPU to Intel UHD by hand: first frame **376 ms**; device creation drops to ~70 ms.
  - Linux dev PC for comparison: ~110 ms.
  - Actions for S2–S4: patch GPUI's `get_adapter` (gpui-pre-windows 0.3.9, `directx_devices.rs`) to prefer `EnumAdapterByGpuPreference(DXGI_GPU_PREFERENCE_MINIMUM_POWER)` unless the window's monitor is driven by another adapter, and offer it upstream; break down the ~170 ms before the run callback and the ~130 ms to the first frame; test start from the tray (hot) on Windows. The warm target (≤ 150 ms) is not met on Windows yet; revisit it with the owner after these fixes.

- 2026-10-14 — G1 passed; P2 starts. The spike branch `spike/gpui-b-variants` (`52f997a`, worktree `.crew/rusty-gpui-b-variants`) holds variant 1 in `spikes/gpui-b-variants/` (2,417 lines, own workspace, `gpui-kit = "=0.7.3"`). S1 (researcher, Haiku, read-only, medium) and S5 (api-builder, gpt-6.1-sol, xhigh) start in parallel. S2 and S3 are the orchestrator's (D28).
