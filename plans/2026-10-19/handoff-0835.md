# Handoff 2026-10-19 08:35

## Done (on main, pushed up to bd68391; b146d78 is local)

- Releases: alpha-2026-10-18a, 19a (5844556), 19b (265fe1a), 19c (bd68391), each with exe and zip.
- Merged today:
  - shortcut search by key;
  - P19 L7a backdrop, plus the safe windows-version fix;
  - P21 V8 (F3 only);
  - P23 B3 perf baseline;
  - P24 Explorer clipboard;
  - P25 lock owner in errors;
  - P26 one instance and `ferrite <path>`;
  - P27 modifier hints drawer.
- Owner PC perf numbers are in `docs/perf.md`. P28 (start-up and memory) is parked by the owner: features first.
- Roadmap republished on this account: https://claude.ai/artifact/LkiStsere7YAcQHmieuKuJ.
- Modifier-hints prototype: https://claude.ai/artifact/UedLUEd54ika6jeYhSKN97 (the owner picked A, now built).

## In progress

- P29 crash report: C1 at 443fa53 on `p29-c1`, C2 at 79689bc on `p29-c2` (worktree `.crew/rusty-p29-c2`, contains C1). Both gates passed on their branches; screenshots `design/screens/p29-crash-notice-{light,dark}.png` checked. Not merged yet (stopped at the usage warning). C2 changed `Launch` to one `crash: CrashStart` field; reach key Ctrl+Shift+R, Enter saves, Esc dismisses. Open: gallery hints pages list the crash-notice key without the handled filter.
- No crew runs or background jobs are active.

## Open questions for the owner

- Shell icons: keep Lucide, or use Windows icons in the list?
- The automotive viewer direction, after the talk with colleagues.
- PC tuning that needs approval: swappiness, the host-telemetry unit, coredump storage.

## Next steps, in order

One agent at a time. Codex sol xhigh handles non-UI work, followed by an Opus review.

1. Merge p29-c2 into main (it includes C1) with `--no-ff --no-commit` and the gate, update the P29 plan statuses, push, and wait for green Windows CI; then remove both p29 worktrees and branches and `.crew/targets/p29*`.
2. Cut the next alpha; tell the owner to test the drawer and the crash notice.
3. Remaining alpha items:
   - cache budgets and folder prefetch;
   - copy benchmark and Auto mode;
   - per-monitor DPI;
   - Fluent strings;
   - browsing folders inside the preview (P21 V9);
   - P22 S3, settings Default/Changed state with reset.
4. Roadmap update through a Sonnet medium agent, then republish to LkiStsere7YAcQHmieuKuJ.
5. Later: the module registry (Beta), and P28 once the alpha features are in.
