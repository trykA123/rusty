# Speed and core platform: crate research (checked 2026-10-28)

Versions and dates come from the crates.io API. "Stable" excludes pre-releases. All licenses below are permissive unless marked.

## Key facts
- Rust std `read_dir` on Windows calls `FindFirstFileExW` with `FindExInfoBasic` but no `FIND_FIRST_EX_LARGE_FETCH` ("lets be conservative"): https://github.com/rust-lang/rust/blob/master/library/std/src/sys/fs/windows.rs (master, 2026-10-28). Microsoft says the flag "uses a larger buffer ... can increase performance": https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfileexw
- `DirEntry::metadata()` on Windows needs no extra system call: https://doc.rust-lang.org/std/fs/struct.DirEntry.html. Never call `fs::metadata(path)` per entry; each one is a file open that CrowdStrike sees.
- jwalk README now says "Unmaintained ... Use dua-core instead": https://github.com/Byron/jwalk (last crate release 0.9.0, 2026-08-05).
- dua-core has its own Windows walker. It opens each directory once and reads batches with `GetFileInformationByHandleEx(FileIdBothDirectoryInfo)`, with windows-sys only: https://github.com/Byron/dua-cli/blob/main/crates/dua-lib/src/windows.rs

## Table

| Need | Crate | Version, date | License | Windows | Verdict | Reason |
|---|---|---|---|---|---|---|
| Walker | dua-core | 5.0.1, 2026-10-25 | MIT | yes (own code) | TRY | Jwalk successor; batched dir reads; benchmark vs `ignore` on the CrowdStrike laptop. |
| Walker | ignore | 0.4.34, 2026-10-27 | Unlicense OR MIT | yes | TRY | Very active; parallel walker; uses std `read_dir`, so no LARGE_FETCH. Gitignore logic is probably not needed. |
| Walker | jwalk | 0.9.0, 2026-08-05 | MIT | yes | SKIP | Declared unmaintained. |
| Raw dir listing | own `FindFirstFileExW` + LARGE_FETCH, or NtQueryDirectoryFile | n/a | n/a | yes | KEEP OURS | windows crate already in use. ~15 lines; measure first. No trusted wrapper crate exists (dscan-core 0.8.1 does it, 2026-10-08, but has ~200 downloads: UNVERIFIED quality). |
| MFT + USN reader | ntfs-reader | 0.6.0, 2026-10-01 | MIT OR Apache-2.0 | yes, needs elevation | TRY (optional) | Reads $MFT and USN journal; `MftScan` low-memory mode; ~31k downloads. |
| USN / FSCTL | usn-journal-rs | 0.5.0, 2026-10-13 | MIT | yes, needs admin | TRY (optional) | Journal iterator + `FSCTL_ENUM_USN_DATA` + path resolve. ~19k downloads. |
| File watching | notify | 8.2.1 stable, 2026-10-27 (9.0.0-rc.7 pre-release) | CC0-1.0 | yes (ReadDirectoryChangesW, 16 KiB buffer, emits `Rescan` on overflow) | ADOPT | Zed also uses it (forked). CC0 is public-domain, fine. Stay on 8.x until 9 is stable. |
| Debounce | notify-debouncer-full | 0.7.0, 2026-05-02 | MIT OR Apache-2.0 | yes | ADOPT | Rename/event coalescing. Mini (0.7.0) is lighter if renames do not matter. |
| Icons | own `IShellItemImageFactory` | n/a | n/a | yes | KEEP OURS | file_icon_provider 1.0.2 (2026-08-05, MIT) uses the same API plus a per-extension cache, never for .exe/.lnk. Copy that cache idea. |
| Allocator | mimalloc | 0.1.52, 2026-05-22 | MIT | yes | TRY | Zed has it as an opt-in feature (`crates/zed/src/main.rs`). Needs a C build step. Measure startup, RSS, listing. |
| Profiling | tracy-client 0.19.0 + tracing-tracy 0.12.0 | 2026-08-25 | MIT/Apache-2.0 | yes | ADOPT | Zed's `ztracing` crate uses tracy behind a `tracy` feature. Already on `tracing`. Gives frame marks and spans. Tracy viewer is a separate BSD app. |
| Store | rusqlite (already used) | n/a | MIT | yes | KEEP OURS | See tuning below. |
| Single instance / IPC | interprocess | 2.4.7, 2026-10-23 | 0BSD OR Apache-2.0 | yes (named pipes) | ADOPT | Local-socket API; sync and tokio. 4.7M recent downloads. |
| Tray | tray-icon | 0.26.1, 2026-10-07 | MIT OR Apache-2.0 | yes | TRY | Needs an event loop on the creating thread on Windows (README). |
| Hotkey | global-hotkey | 0.9.0, 2026-10-16 | Apache-2.0 OR MIT | yes; Linux X11 only | TRY | Same event-loop rule. Fallback: `RegisterHotKey` on a dedicated thread with its own message loop. |
| Crash | crash-handler 0.8.1 (2026-09-25) + minidumper 0.11.0 (2026-07-20) | | MIT OR Apache-2.0 | yes | ADOPT | Zed uses exactly these (`Cargo.toml` pins 0.8 and 0.11). Local .dmp files, no Sentry. |

## rusqlite tuning (https://www.sqlite.org/wal.html)
- Batch writes in one transaction on one long-lived connection (fewer opens under CrowdStrike). Use `journal_mode=WAL` and `synchronous=NORMAL`. With NORMAL, WAL commits skip the sync; only checkpoints sync. Power loss can roll back recent commits: fine for caches.
- WAL adds `-wal` and `-shm` files and does not work over network drives.

## Everything-style index
- Everything says NTFS indexing "requires administrative privileges for low level read access", offers a service so the app runs as a standard user, and keeps the index fresh with the USN Journal: https://www.voidtools.com/faq/
- WizFile says it "reads the hard drive's Master File Table (MFT) directly": https://antibody-software.com/wizfile/. Its admin and USN behaviour is UNVERIFIED.
- Implication for Navo: raw-volume access needs elevation and may be flagged by CrowdStrike (UNVERIFIED). Make it optional. Default path: walker + notify on the folders the user opens.

Skipped with reason: walkdir (single thread, stale), diskus/pdu (CLIs; dua-core covers it), ntfs/mft crates (offline parsers), puffin (needs own viewer), win-icon-extractor (AGPL), snmalloc-rs (C++ toolchain), single-instance (stale 2021; use a named mutex), redb/fjall/heed (second DB engine; Zed uses heed), superluminal-perf 0.4.0 (dev-only markers). No Go helper beats Rust here. GPUI tray/hotkey message-loop fit: UNVERIFIED.

## Top 5 for Navo
1. dua-core (or `ignore`) walker, plus metadata taken from the dir entry only; benchmark on the CrowdStrike laptop.
2. tracy-client + tracing-tracy behind a feature, with frame marks.
3. crash-handler + minidumper for local minidumps.
4. mimalloc as an opt-in feature; keep it only if measurements win.
5. notify 8.2 + notify-debouncer-full for watching; ntfs-reader / usn-journal-rs only as an optional elevated indexer later. interprocess for the single resident instance is next after these.
