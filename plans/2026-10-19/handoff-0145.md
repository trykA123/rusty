# Handoff 2026-10-19 01:45

## Done

- Release `alpha-2026-10-18a` from 8654608 (CI 39154378891 green): `ferrite.exe`, zip, Linux tar.zst. Zip URL returns 200.
- P23 done: `docs/perf.md` baseline, roadmap link (merge cfa34d4, local, not pushed yet).
- Merged earlier on 2026-10-18: delete-dialog Enter fix, deny ignores, P23 B1 and B2, P22 review fixes.

## In progress (no agent running)

- Shortcut search by key: worktree `.crew/rusty-shortcut-search`, branch `fix-shortcut-key-search`, uncommitted edits in `shortcuts/page.rs` and `window_view/tests/shortcuts.rs`. Stopped ui-builder agent a1118a216c19ace93.
- Windows 10 backdrop fallback (P19 L7a): worktree `.crew/rusty-p19-l7a`, branch `p19-l7a`, uncommitted edits plus new `title_bar/backdrop/`. Stopped ui-builder agent a194fb389db190e8a.

## Open questions for the owner

- Automotive viewer: which direction after the talk with colleagues.
- PC tuning that needs approval: swappiness, host-telemetry unit fix, coredump storage.

## Next steps, in order (one agent at a time; Codex sol xhigh for small non-UI work, then a review)

1. Finish the shortcut key search fix, gate, merge, push.
2. Finish P19 L7a, gate, merge.
3. P21 V8: remove Ctrl+Q and the preview pill.
4. Useful features from the owner's alpha list: Explorer clipboard, lock owner in errors, commands with arguments, per-monitor DPI, shell icons.
5. P19 L7b; P22 S3 (design input later).
6. Next alpha once CI is green; roadmap update via Sonnet.
