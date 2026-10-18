# Performance

Every push to `main` runs the `perf-windows` CI job: one first run (the closest a runner gets to a cold start) and five warm runs of `ferrite --metrics <file.json>` on a generated fixture (one folder with 5,000 files, one with 200 folders of 25 files each). The job summary shows min, median and max next to the [v1.0 targets](roadmap.md#v10-targets).

The GitHub runner renders in software (Microsoft Basic Render Driver), so frame times are relative, not absolute. The job fails only when the median warm first frame is above 300 ms or private bytes in any run are above 160,000,000 (2× each target). The owner's work-PC run with `--metrics` is the real reference and goes here when available.

## Baseline

CI run 39154378891, commit 8654608, 18 October 2026, exe 89.2 MB.

| Measure | First run | Warm min | Warm median | Warm max | Target |
| --- | --- | --- | --- | --- | --- |
| Start to first frame | 212.5 ms | 177.3 ms | 179.8 ms | 185.2 ms | warm ≤ 150 ms |
| Start to first usable frame (both panes listed) | 261.9 ms | 224.5 ms | 236.7 ms | 244.3 ms | cold ≤ 400 ms |
| Private bytes, idle after 5 s | 67.3 MB | 66.4 MB | 67.3 MB | 67.7 MB | < 80 MB |
| Working set, idle after 5 s | 97.1 MB | 93.4 MB | 96.8 MB | 97.0 MB | — |
| Peak working set | 101.9 MB | 97.9 MB | 101.3 MB | 101.6 MB | — |

Warm start-up marks (median of five runs): main 16.0 ms, databases opened 33.1 ms, window opening 36.4 ms, app running 98.4 ms, window built 154.2 ms, first frame 179.8 ms. About 60 ms goes to starting GPUI and about 55 ms to building the window.

## History

| Date | Commit | Median warm first frame | Max private bytes |
| --- | --- | --- | --- |
| 2026-10-18 | 8654608 | 179.8 ms | 67.7 MB |
