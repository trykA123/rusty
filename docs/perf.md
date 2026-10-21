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

## Owner's PC (reference)

Work laptop, Intel UHD Graphics, build 5844556 (alpha-2026-10-19a), 19 October 2026. Run 1 is the first launch of the day; runs 2–4 are warm; run 4 used `--left C:\Windows --right C:\Users`.

| Phase | Run 1 | Run 2 | Run 3 | Run 4 | CI warm median |
| --- | --- | --- | --- | --- | --- |
| Process start to `main` | 739 ms | 292 ms | 282 ms | 76 ms | 16 ms |
| `main` to window opening | 42 ms | 46 ms | 47 ms | 53 ms | 20 ms |
| Window opening to app running (GPUI start) | 248 ms | 246 ms | 215 ms | 212 ms | 62 ms |
| App running to window built | 90 ms | 97 ms | 70 ms | 75 ms | 56 ms |
| Window built to first usable | 38 ms | 37 ms | 33 ms | 29 ms | 82 ms |
| **Start to first usable** | **1157 ms** | **716 ms** | **645 ms** | **445 ms** | 237 ms |
| Private bytes, idle | 139.1 MB | 141.8 MB | 140.8 MB | 137.6 MB | 67.3 MB |
| Working set, idle | 125.1 MB | 127.9 MB | 126.9 MB | 124.6 MB | 96.8 MB |

Against the v1.0 targets (cold ≤ 400 ms, warm ≤ 150 ms, RAM < 80 MB) all three miss on real hardware. Most of the gap is before `main` (76–739 ms, versus 16 ms on CI) and in GPUI's start on a real GPU (≈ 215–250 ms, versus 62 ms with the software renderer). Private bytes double with a real GPU.

Second set, same build, after moving `ferrite.exe` out of Downloads (runs 1–4; run 1 is the first launch from the new folder):

| Phase | Run 1 | Run 2 | Run 3 | Run 4 |
| --- | --- | --- | --- | --- |
| Process start to `main` | 417 ms | 103 ms | 96 ms | 88 ms |
| Window opening to app running (GPUI start) | 299 ms | 304 ms | 300 ms | 277 ms |
| **Start to first usable** | **894 ms** | **592 ms** | **590 ms** | **533 ms** |
| Private bytes, idle | 140.0 MB | 140.1 MB | 140.7 MB | 137.3 MB |

Outside Downloads the warm time before `main` drops from ≈ 285 ms to ≈ 95 ms; the first launch from a new folder is still slow (the antivirus scans the exe again). GPUI's start on this GPU stays the largest part we control (≈ 280–300 ms).

Third set, after `Unblock-File` (Mark of the Web removed): before `main` 320 / 96 / 100 / 95 ms, GPUI start 271 / 249 / 264 / 269 ms, first usable 748 / 500 / 525 / 522 ms, private bytes ≈ 140 MB. Unblocking does not change the time before `main` (≈ 95 ms warm); the lower totals come from GPUI's start, which varies by ±30 ms between sets.

Fourth set, build 3b948e3 (alpha-2026-10-21b), 21 October 2026, outside Downloads and unblocked. Run 1 is the first launch after a restart; runs 2–4 are warm; run 4 used `--left C:\Windows --right C:\Users`.

| Phase | Run 1 | Run 2 | Run 3 | Run 4 |
| --- | --- | --- | --- | --- |
| Process start to `main` | 1281 ms | 102 ms | 114 ms | 114 ms |
| `main` to window opening | 57 ms | 47 ms | 47 ms | 62 ms |
| Window opening to app running (GPUI start) | 285 ms | 292 ms | 284 ms | 257 ms |
| App running to window built | 87 ms | 83 ms | 98 ms | 77 ms |
| Window built to first usable | 35 ms | 39 ms | 48 ms | 30 ms |
| **Start to first usable** | **1745 ms** | **563 ms** | **591 ms** | **540 ms** |
| Private bytes, idle | 137.4 MB | 137.1 MB | 136.8 MB | 136.2 MB |

Warm start is where it was on 19 October (median 563 ms against 522–590 ms), although the app gained the Rich memory view, Ctrl+K sources and multi-rename. Memory is slightly lower. The cold start spends 1.28 s before `main`: Windows reads and scans the 98 MB exe after a restart. Ferrite's own part (from `main` to first usable) takes 464 ms cold and about 450 ms warm, so a smaller exe is the main lever for the cold start; GPUI's start (≈ 260–290 ms) is the largest part inside the app.

Same build with `FERRITE_GPU=high-performance` (NVIDIA T1200 Laptop GPU), three warm runs: GPUI's start 1253 / 1238 / 1049 ms (Intel ≈ 260–290 ms), first usable 2218 / 2186 / 1825 ms, private bytes 254 / 256 / 237 MB. The discrete GPU is about three to four times slower to start and uses nearly twice the memory, so the low-power default stays.

## History

| Date | Commit | Median warm first frame | Max private bytes |
| --- | --- | --- | --- |
| 2026-10-18 | 8654608 | 179.8 ms | 67.7 MB |
| 2026-10-19 | 5844556 (owner's PC, warm median) | 645 ms first usable | 141.8 MB |
| 2026-10-19 | 5844556 (owner's PC, outside Downloads, warm median) | 590 ms first usable | 140.7 MB |
| 2026-10-21 | 3b948e3 (owner's PC, warm median) | 563 ms first usable | 137.4 MB |
