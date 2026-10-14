# P2 · GPUI spike

Status: drafting (briefs get exact `Read` ranges when G1 passes) · Branch: `p2-spike` · After: G1

## Goal

Find out with numbers whether GPUI with `gpui-kit` can carry Rusty: design B's look, 100,000 rows, three panes and the drawer, inside the v1 targets. The result is a go or no-go for D2, decided with the owner at G2.

## Decisions

- Spike code lives in `spikes/` and is not part of the product. It is deleted or archived after G2; lessons go to `docs/spike/results.md`.
- `gpui-kit` at its latest release (0.7.3 today), pinned exactly.
- Visual reference: `design/prototype/dir-b.css`, `design/prototype/shared.css`, `design/screens/b4-1440.png`.
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
| S1 | `gpui-kit-notes` | T1 | researcher | medium | G1 | notes answer every question below, with links | blocked |
| S2 | `spike-shell` | T4 | ui-builder-high | high | S1 | window opens on Linux; screenshot reviewed by orchestrator | blocked |
| S3 | `spike-list` | T4 | ui-builder-high | high | S2 | headless test passes; manual scroll smooth | blocked |
| S4 | `spike-metrics` | T2 | ui-builder | medium | S3 | `spike --metrics` prints valid JSON | blocked |
| S5 | `fuzzy-bench` | T3 | api-builder | xhigh | G1 | `cargo bench -p fuzzy-bench` prints the table | blocked |
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
