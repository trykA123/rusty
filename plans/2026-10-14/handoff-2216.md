# Handoff · 2026-10-14 22:16 (Europe/Bucharest)

Reason: the five-hour usage window is at 90 %. This replaces `handoff-2048.md`.

## Done

- **P1 is merged and pushed:** `main` is at `0cfe120`, "Merge P1: workspace, quality gate and CI". G1 passed:
  - local gate green;
  - CI green on `gate-linux`, `gate-windows`, `build-linux` and `build-windows` (run 38616613151);
  - `reviewer` approved, and its notes are applied (A11, static CRT).
- **One G1 step is open:** the owner runs `ferrite.exe` on the work PC on 2026-10-15. The owner agreed to this.
- **New decisions D28–D32** (`docs/decisions.md`):
  - D28: tiers. Opus builds the core and every data-safety atom. Haiku never implements.
  - D29: the product name is Ferrite; Rusty stays the codename.
  - D30: Linux is a secondary target.
  - D31: no `unwrap`, `expect`, `panic` or `unimplemented` outside tests.
  - D32: Lucide for UI icons.
- **Global role change:** `patcher` and `infra-builder` now run on Sonnet (`~/.config/crew/roles.json` and the agent files; backup `roles.json.bak-20261014b`). The owner should run `/crew sync` so the table in `~/.agents/AGENTS.md` is regenerated.
- **Local build script:** `scripts/install-local.sh` builds an x86-64-v3 binary into `~/.local/bin/ferrite`.
- **P2** is on branch `p2-spike`, pushed, at `03e54c6`. Every atom's details are in the Log of `plans/2026-10-14-p2-gpui-spike.md`.
  - S1 done: `docs/spike/gpui-kit-notes.md`.
  - S2 done: `spikes/gpui-b` is variant 1 only, as Ferrite, with a drawer that has three views.
  - S3 done: `--rows 100k`, a scrollbar, and 5 headless keyboard tests.
  - S4 done:
    - `--metrics` and `metrics.sh`;
    - first Linux numbers from headless cage in `docs/spike/metrics/`: first frame 670 ms cold and 120 ms warm, RSS about 92 MB, binary 39 MB without LTO;
    - cage paces frames at about 39 ms, so its scroll numbers are not valid.
  - S5 done: `docs/spike/fuzzy-bench.md`. frizbee is 2–4 times faster than nucleo-matcher and needs no 80 MiB index.
  - S6 done: list and row roles and names. The real AccessKit tree only exists while a screen reader is attached.
  - S7 running: workflow `.github/workflows/spike-p2.yml`.
  - 12 spike tests pass.

## In progress

- **CI run 38622266071 (`spike-p2`)** on `p2-spike` at `03e54c6`, Windows:
  - builds the spike with fat LTO and runs its tests;
  - runs the exe 3 times with `--rows 100k --metrics`;
  - uploads `ferrite-spike-windows-x64-03e54c6…` (exe plus `metrics-*.json`).
  - Watch: `gh run view 38622266071`. The metrics step has `continue-on-error`, because a hosted runner may not open a window.
- **CI run 38622266037 (`ci`)** on `p2-spike`: the normal gate.
- **Background watcher `b9u583ng2`** in this session waits on those two runs. It only reads.
- **Designer agent (icon round 3)**, Sonnet, running:
  - six directions: f_ and fe_, each in Chakra Petch and Aldrich, plus one "clearly not Facebook" take of each; also the "ferrite_" wordmark;
  - output goes to `/tmp/claude-1000/-mnt-Sabrent-homelab-rusty/0f0e5268-850c-45f6-83cd-2a7aab8a08bd/scratchpad/ferrite-icons-3/`, which is scratch and outside the repo;
  - when it is done: read `index.html` fully, then publish it as an artifact.
- **Earlier icon rounds** (artifacts):
  - round 1: https://claude.ai/artifact/2GpsS9c65tko7Yaa74kbR7 (rejected);
  - round 2: https://claude.ai/artifact/ErLLYGuNMLDJWQLkoUqvRA. The owner likes the Chakra Petch and Aldrich fonts, and f_ or fe_ that does not look like Facebook.
- **No uncommitted work in the repo.** Worktree `<worktrees>/rusty-gpui-b-variants` (`spike/gpui-b-variants`) is kept as the D27 reference.

## Rules learned this session

- **Never add Hyprland outputs, windows or rules on the owner's desktop.** A headless output broke Caelestia. Memory: `no-virtual-outputs`.
- **Run every GUI step in headless cage:** `env -u WAYLAND_DISPLAY -u DISPLAY WLR_BACKENDS=headless WLR_LIBINPUT_NO_DEVICES=1 cage -s -- <script>`. The output is 1280×720; take screenshots with `grim` inside the cage session.
- **`LLVM_COV` and `LLVM_PROFDATA`:** set `LLVM_COV=/usr/bin/llvm-cov LLVM_PROFDATA=/usr/bin/llvm-profdata` for a local `cargo xtask gate --coverage`.
- **The push hook** needs `cargo clippy --all-targets -- -D warnings` and `cargo test` to pass, with no edits after them, before `git push`.

## Open questions for the owner

1. **Icon direction from round 3**, when it is published.
2. **One spike run on the Linux desktop.** Linux smoothness needs a real display, and cage cannot give it. May the spike run once on the Hyprland desktop: `spikes/gpui-b/metrics.sh --runs 3` with the binary from `<targets>/rusty-spike`? Otherwise Windows numbers decide alone.
3. **Work PC on 2026-10-15:**
   - run P1's `ferrite.exe` (G1 step 3);
   - run the S7 spike exe three times with `--rows 100k --metrics m.json` and send the JSON;
   - check list reading with Narrator.
4. **Memory over target:** RSS is about 90 MB even with sample rows, against a target under 80 MB. Accept or investigate in G2?

## Next steps, in order

1. When runs 38622266071 and 38622266037 finish:
   - download the artifact and save the Windows JSON in `docs/spike/metrics/windows-ci-*.json`;
   - log S7 (CI part) in the P2 plan;
   - if the run failed, fix it.
2. Publish icon round 3 and record the owner's pick as a decision (D33). Then make the `.ico`, the Linux `.desktop` file and the icon in `scripts/install-local.sh`.
3. Close S7 with the owner's work-PC numbers.
4. G2: write `docs/spike/results.md` with every target (cold ≤ 400 ms, warm ≤ 150 ms, RAM < 80 MB, exe < 30 MB, 60 Hz scroll, fuzzy, a11y), measured on Linux and the work PC. Include the D27 adapter actions: low-power GPU preference, start-up breakdown, hot start. Then the owner decides go or no-go for D2.
5. After G2, finalise the P3 briefs with exact Read ranges. Under D28, the `rusty-core` Green atoms are the orchestrator's on Opus high.
