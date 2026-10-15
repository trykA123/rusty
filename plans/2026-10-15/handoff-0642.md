# Handoff · 2026-10-15 06:42 (Europe/Bucharest)

This file replaces `plans/2026-10-14/handoff-2216.md`.

## Done since the last handoff

- **D33, the app icon: `fe_` in Chakra Petch.** The owner picked it from round 3, direction 3.
  - It is merged to `main` at `fbf54cc`, from branch `brand-icon`. CI run 38677222376 is green.
  - The sources are in `assets/brand/`:
    - pixel-fitted SVG files for 16, 24, 32 and 48 px; at 16 px the icon falls back to `f_`;
    - a scalable `ferrite.svg`;
    - PNG files;
    - `ferrite.ico` (14 KB, PNG-compressed);
    - the `ferrite_` wordmark, outlined from Chakra Petch SemiBold;
    - `ferrite.desktop`.
  - `scripts/build-icons.sh` rebuilds the PNG files and the `.ico`. Its output is reproducible: the hash is identical.
  - `crates/rusty-app/build.rs` embeds the icon and VERSIONINFO, through `embed-resource` 3.0.12, for Windows targets only. The CI exe was checked with `llvm-readobj`: it has 7 icons, GROUP_ICON 1 and VERSIONINFO "Ferrite", and is 227 KB.
  - `scripts/install-local.sh` also installs the hicolor icons and the `.desktop` entry. It was tested into a scratch prefix and has not been run on the owner's desktop.
- **The spike prefers the low-power GPU (a D27 action).** Commit `12116b6` is on `p2-spike`.
  - The spike vendors `gpui-pre-windows` 0.3.9 in `spikes/gpui-b/vendor/`, wired in with `[patch.crates-io]`.
  - `get_adapter` now calls `EnumAdapterByGpuPreference(MINIMUM_POWER)`.
  - `FERRITE_GPU=default|high-performance` overrides the choice, so one exe can compare both GPUs.
  - CI run **38677189477** (`spike-p2`) was still running at 06:42. The `ci` run on that commit is green.
- **P3 started in parallel with G2,** because the owner asked to keep working past the current plan. It is on branch `p3-core` at `6b91edc`, pushed.
  - **C0 is done:** `PaneId`, `TabId` and `WindowId`; `Location`; `Direction`; `thiserror`, `proptest` and `insta`; a coverage floor of 90 for `rusty-core`. The gate is green.
  - The briefs for C1 (`command` Red) and C3 (`layout` Red) are in `plans/2026-10-15/`.
  - Plan changes: there is a new C0 atom, and `layout.split` now takes a `Direction` instead of an axis. Both are logged in the plan.
  - P3 merges to `main` only after G2.

## Owner, at work today

1. **P1 exe (G1 step 3):** from run 38677222376, download `ferrite-windows-x64-fbf54cc…`. Run `ferrite.exe` in a terminal; it prints `ferrite 0.0.1`. Check the icon in Explorer.
2. **Spike exe:** when run 38677189477 is green, download `ferrite-spike-windows-x64-12116b6…`. Then run:
   - three times `gpui-b.exe --rows 100k --metrics m1.json` (then `m2.json`, `m3.json`); this uses the Intel GPU;
   - once `$env:FERRITE_GPU="default"; .\gpui-b.exe --rows 100k --metrics nv.json`; this uses the NVIDIA GPU, for comparison.
   - Send back the JSON files.
3. **Narrator:** check how the list is read: its name, the rows and the selection.

## Open questions for the owner

- May the spike run once on the Linux Hyprland desktop for smoothness numbers (`spikes/gpui-b/metrics.sh --runs 3`)? Otherwise the Windows numbers decide on their own.
- Memory on Linux is about 90 MB, against a target under 80 MB; on Windows CI it is 63 MB. Should we accept this, or investigate it in G2?
- Run `/crew sync` (owner action).

## Next steps, in order

1. Start **C1 and C3** (agent `checker`, Sonnet, effort `high`) in parallel. Use worktrees `<worktrees>/rusty-p3-c1` (branch `p3-c1`) and `<worktrees>/rusty-p3-c3` (branch `p3-c3`), both created from `p3-core`. Each brief is its file in `plans/2026-10-15/`.
2. Review each set of Red tests against its brief. Then do **C2 and C4 (Green)** yourself on Opus (D28). Then do C5 to C12 in plan order.
3. When the owner's JSON arrives: save it as `docs/spike/metrics/work-pc-*.json` and close S7. Then write **G2** `docs/spike/results.md`, with every target measured on Linux and on the work PC. The owner then decides go or no-go for D2.
4. After G2, merge `p2-spike`, and then `p3-core` when G3 passes.

## State

- **Branches:**
  - `main` is at `fbf54cc`.
  - `p2-spike` is at `12116b6` and not merged.
  - `p3-core` is at `6b91edc`. It is checked out in `<repo>`.
  - `brand-icon` is merged; its branch still exists locally and on the remote.
- **Untracked:** `spikes/gpui-b/target/` is a local build cache created this session, so it shows as `?? spikes/` on `p3-core`. Do not commit it. Delete it if space is needed.
- **Worktree `<worktrees>/rusty-gpui-b-variants`** is the D27 reference; keep it.
- **No agents are running.** The designer agent the owner saw is complete.
- **The push hook** needs clippy and `cargo test` to pass, each in a separate command, with nothing else chained and no edits after them, before `git push`.
- **Rules:** never create Hyprland outputs or windows; run GUI work only in headless cage (memory `no-virtual-outputs`).
