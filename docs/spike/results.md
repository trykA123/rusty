# GPUI spike results (P2, G2)

Status: **draft**. The work-PC column fills in when the owner runs the spike exe; then the owner decides go or no-go for D2.

Spike: `spikes/gpui-b` (design B, variant 1 of D27, three panes of 100,000 rows each, drawer, F-key bar) on `gpui-kit` 0.7.3. Raw numbers: `docs/spike/metrics/`. Plan and log: `plans/2026-10-14-p2-gpui-spike.md`.

## Targets

| Target | Goal | Linux dev PC (headless cage) | Windows CI (software renderer) | Work PC |
| --- | --- | --- | --- | --- |
| Cold start, first frame | ≤ 400 ms | 671 ms (non-LTO, first run after build) | 510–546 ms | pending · variants prototype: 566–667 ms on NVIDIA, **376 ms** on Intel |
| Warm start, first frame | ≤ 150 ms | **120 ms** | 220–313 ms | pending |
| Idle memory, two or more panes | < 80 MB | RSS 86–88 MB; **private 27–29 MB** | working set 59–63 MB | pending |
| `.exe` size | < 30 MB | 39 MB (non-LTO ELF) | **17.6 MB** (fat LTO) | same exe |
| Scrolling 100k rows at 60 Hz | no dropped frames | not measurable: cage paces frames at ~39 ms | not measurable: software renderer, p50 64–124 ms | pending |
| Fuzzy matching | interactive on 100k names | frizbee: 1.2–2.1 ms per query on 100k basenames; 54–143 ms on 2M paths | — | — |
| Accessibility | list and rows readable | roles, names, position and selection set (headless test) | — | Narrator check pending |

## Findings

### Start-up

- On the work PC the first frame is dominated by D3D11 device creation on the NVIDIA GPU (250–310 ms). On the Intel GPU it is ~70 ms, which brought the variants prototype from ~600 ms to 376 ms.
- The spike now prefers the low-power GPU (vendored `gpui-pre-windows`, `EnumAdapterByGpuPreference(MINIMUM_POWER)`); `FERRITE_GPU=default` restores GPUI's order for comparison.
- The other start-up phases on Windows: platform and DirectWrite ~170 ms, window and first render ~130–145 ms. The warm target (≤ 150 ms) likely needs a resident (tray) process on Windows; to be decided after the work-PC run.

### Memory

- Linux RSS of 86 MB is 27 MB private memory plus 59 MB of mapped, shared code: the binary (25 MB resident) and Mesa's GL stack (`libLLVM` 15 MB, `libgallium` 8 MB).
- The GL stack is loaded for nothing: `gpui-pre-wgpu` 0.3.9 creates its wgpu instance with `VULKAN | GL` hard-coded (`wgpu_context.rs:474`). A Vulkan-first patch would save ~24 MB of RSS on Linux.
- 100,000 rows in each of three panes add ~1.5 MB.
- Proposal: measure the memory target as **private memory** (Linux anonymous RSS, Windows private bytes), not RSS or working set, which count shared code pages.

### Look and behaviour

- Design B is reproduced at 1440×900 in both themes (`spikes/gpui-b/screens/`), with a visible scrollbar, three panes, tabs, path bars, the drawer (Transfers, Clipboard, Search) and the F-key bar.
- Keyboard: Up, Down, PageUp, PageDown, Home, End, Space, Insert and Tab work on 100,000 rows, checked by five headless tests.
- `gpui-kit`'s headless test support (`#[gpui_kit::test]`, `test-support`) is enough for UI tests in CI.

### Accessibility

- Each list is `Role::List` with a name; rows are `Role::ListItem` with "name, size, date", selection state and position in set.
- GPUI builds the AccessKit tree only while a screen reader is attached, so the real UIA output needs the Narrator check.

### Fuzzy matching

- frizbee 0.13.0 is 2–4 times faster than nucleo-matcher 0.3.1 and needs no prepared 80 MiB index; quality is similar (9–11 of 20 hand-picked targets). See `fuzzy-bench.md`.

## Decision

Pending the work-PC numbers. Go if the Intel-GPU cold start and warm start are near target, scrolling holds 60 Hz on the work PC and Narrator reads the list; otherwise D2 reopens with the fallback in `docs/discussion.md`.
