# Rusty architecture

Status: proposal for review, 13 October 2026. Decisions are logged in [decisions.md](decisions.md); plugins have their own document, [plugins.md](plugins.md).

## Goals, in priority order

1. **Never lose or damage the user's files.** No destructive action without an explicit command, and nothing irreversible without a confirmation the user can read.
2. **Never corrupt our own state.** Settings, sessions and job journals survive crashes, power loss and two instances.
3. **Feel instant.** The first frame comes from what we already know; fresh data arrives without blocking.
4. **Stay bounded.** Every cache, queue, history and channel has a limit, and every background task has an owner.
5. **Open to extension, closed to harm.** Plugins add capabilities through the same commands and safety checks as the app.

## Crates

A Cargo workspace; dependencies point down the table.

| Crate | Job | Platform |
| --- | --- | --- |
| `rusty-core` | Pure model and logic: paths, entries, panes, tabs, layout tree, workspaces, pins, selection, sort/filter, the command set, operation planning. No I/O. | any |
| `rusty-store` | Settings (TOML), session snapshot (`postcard`), SQLite databases `rusty.db` and `cache.db`; atomic writes, versions, migrations, recovery. Built in the Foundation phase | any |
| `rusty-fs` | Listing, metadata, watching, the job engine (copy, move, recycle, delete) with progress, cancel, verification and the undo journal | Windows first, Linux for development |
| `rusty-cache` | Bounded caches: listings, icons, thumbnails, enrichments; budgets and eviction | any |
| `rusty-index` | Fuzzy matching (`nucleo`), folder search (`ignore`), global search (Everything IPC, own NTFS index later) | Windows for global |
| `rusty-shell` | Windows shell: icons, thumbnails, native context menu, Properties, Recycle Bin, drag and drop, Mark-of-the-Web, ShellExecute | Windows |
| `rusty-term` | Terminal providers: Windows Terminal, external command templates, embedded ConPTY + `alacritty_terminal` | Windows |
| `rusty-plugins` | WASM component host, capability checks, plugin lifecycle | any |
| `rusty-ui` | GPUI views and components on the design tokens from the prototype; draws state, sends commands | any |
| `rusty-diag` | Logging setup, redaction, in-memory event ring, memory statistics, diagnostic reports. Built in the Foundation phase | any |
| `rusty-app` | The binary: wiring, single instance, tray, global hotkey, crash handling | Windows |

`rusty-core`, `rusty-store`, `rusty-cache`, `rusty-index` (matching) and `rusty-plugins` build and test on Linux, so most work happens on the development machine. Windows-only crates sit behind traits with a fake implementation for tests.

## One command system

Every action is a typed command with a stable id, for example `pane.open-tab { path }`, `path.copy { as: Wsl }`, `drawer.add { view: Compare }`, `files.recycle { selection }`.

- Shortcuts, the F-key bar, the Ctrl+K palette, menus, the drawer, macros and plugins all dispatch the same commands.
- A command is **validated** (arguments, current state), **planned** (what exactly will happen), optionally **confirmed**, then **executed** as effects.
- Results go to the Activity view; reversible ones go to the undo journal.

This gives the palette, custom shortcuts and plugins one surface, and gives safety checks one place to live.

## State

### One owner, one direction

- `AppState` in `rusty-core` is plain data: workspaces, panes, tabs, selection, drawer, pins, settings. It is changed only by `apply(command) -> Result<Effects>`, a pure function that can be unit- and property-tested on Linux.
- Effects (list a folder, start a job, write the session) run in the runtime. Their results come back as events, which are applied the same way.
- GPUI entities hold view state only and read `AppState`. They never own file-system data.

### No leaks

- **Every background task has an owner.** GPUI `Task`s are cancelled when dropped, so a pane owns the tasks for its listing and enrichments, and the job manager owns copy jobs. Closing a pane drops its tasks. Detached tasks are not allowed outside the job manager.
- **No strong cycles.** Background work holds weak handles (`WeakEntity`) to UI state; subscriptions are dropped with their owner.
- **Stale results are discarded.** Each pane has a generation counter, incremented on navigation. A listing or thumbnail that comes back for an old generation is dropped.
- **Everything is bounded:** channels, caches (by bytes), undo history (by count and age), Activity log, recent folders, clipboard history.
- **Checked in CI:** a soak test opens and closes 10,000 tabs and navigates 50,000 folders on a fake file system; heap must return to within 2% of baseline (`dhat`). A diagnostics drawer view shows live cache sizes and task counts.

### No corruption

| Data | Format | Rules |
| --- | --- | --- |
| Settings and keymaps | TOML, hand-editable | Validated on load; invalid files are reported and **never overwritten**; the last valid copy keeps running |
| Session and workspaces | Versioned binary (`postcard`) with header and checksum | Debounced saves (1 s), atomic replace, previous file kept as `.bak`, recovery from `.bak` on a bad checksum |
| User data (`rusty.db`, SQLite) | History, frecency, tags, saved searches, module key-value data, job and undo journals | WAL mode; one transaction per job step; `PRAGMA user_version` migrations; `integrity_check` on start-up after a crash |
| Job journal (copies, moves, deletes) | Table in `rusty.db`, one row per step, committed per step | Lets an interrupted job resume or roll back after a crash |
| Undo journal | Table in `rusty.db` | Bounded; entries expire |
| Cache (`cache.db`, SQLite) | Listings, icons, thumbnails as blobs, folder sizes | Safe to delete at any time; rebuilt on demand; a corrupt file is replaced, never repaired |
| Global search index | Own file format under `index/`, memory-mapped (`rkyv`) | Rebuilt when missing or from an older version |

- **Atomic writes:** write `name.tmp`, flush, then `ReplaceFileW` / `MoveFileExW(MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)`.
- **Single writer:** one process per user session (a named mutex); a second launch hands its arguments to the first instance and exits.
- **Migrations:** each format has a version (`PRAGMA user_version` for SQLite); migrations are pure functions with fixture tests for every old version.
- **SQLite from the start:** `rusqlite` with bundled SQLite is part of `rusty-store` from the Foundation phase, so every later feature stores its data in the same place.
- **Crashes:** a panic hook writes a redacted crash report (see Diagnostics) and the last session; the next start offers to restore it and to save the report.

Storage lives in `%APPDATA%\Rusty` (settings, `rusty.db`), `%LOCALAPPDATA%\Rusty` (session, `cache.db`, index). **Portable mode:** if `rusty.toml` sits next to the executable, everything lives beside it instead.

## Speed: caching, lazy loading, pre-warming

### Start-up states

| State | Meaning | Target to first usable frame |
| --- | --- | --- |
| Cold | First launch after boot; OS file cache empty; our caches may exist | ≤ 400 ms |
| Warm | Launched again; OS cache and our caches warm | ≤ 150 ms |
| Hot | Already running in the tray; summoned by hotkey | ≤ 50 ms |

Start-up order:

1. Read the session snapshot (small, one file) and draw the last layout immediately. The snapshot also holds about 100 visible rows per pane, marked as cached, so the first frame needs one file read and **no database**.
2. Open `rusty.db` and `cache.db` in the background, fill the rest of the panes from the listing cache and revalidate everything.
3. Start everything else **lazily**: plugins, global index connection, git, thumbnails and terminals start on first use or after the app is idle.

Targets are measured with `tracing` spans in every build and checked by a start-up benchmark in CI on Windows.

### Listing folders

- **Phase 1, names and basics:** `FindFirstFileExW` with `FindExInfoBasic` and `FIND_FIRST_EX_LARGE_FETCH` returns names, attributes, sizes and times in one pass. Results stream to the pane in batches, so the first rows appear before a 100k-entry folder finishes.
- **Phase 2, enrichment, only for what is visible:** icons, thumbnails, git status, folder sizes, hashes and plugin columns are computed for rows in or near the viewport, through a priority queue. Scrolling away cancels the work.
- Lists are virtualised (GPUI `uniform_list`); sorting keys are computed once per listing; filtering runs on a background thread.

### Caches

| Cache | Key | Budget | Invalidation |
| --- | --- | --- | --- |
| Listings (memory) | path + volume serial | 64 MB, LRU | File watcher for open panes; folder change time on revisit |
| Listings (`cache.db`) | same | pinned and workspace folders only, 32 MB, `lz4` compressed | Same; never trusted without revalidation |
| Icons (memory and `cache.db`) | extension, or file for `.exe`, `.lnk`, `.ico` | 8 MB | Icon theme change, or the file's change time; the Windows shell is not touched before the first frame |
| Thumbnails (`cache.db` blobs) | path + size + change time | 256 MB, LRU | Key change; purged when the file is deleted through Rusty |
| Enrichments (git, folder sizes) | path + change time | 16 MB | Watcher events |

- **Stale while revalidating:** a cached listing shows at once and is replaced by a diff when fresh data arrives; selection and scroll position are kept.
- **Network shares** get a timeout and an "offline, showing cached" state instead of a frozen pane.
- When the window is hidden or minimised, enrichment pauses and thumbnails are dropped from memory; listings stay.
- Privacy: thumbnails stay in `%LOCALAPPDATA%`, can be turned off, and can be cleared from settings.

### Pre-warming

- The cursor resting on a folder for 150 ms prefetches its listing (at most two prefetches at once).
- After start-up goes idle: pins and workspace folders are listed, the Everything connection is opened, and fonts and icons for the visible panes are loaded.
- A terminal is pre-started only if the drawer's terminal view was open in the last session.

## Runtime and libraries

No Tokio in the core (D18). GPUI already has a foreground and a background executor whose tasks are cancelled when dropped, and file-system calls on Windows block anyway.

| Work | Runs on |
| --- | --- |
| UI and pane-owned tasks (listing, enrichment) | GPUI executors |
| Copy, move, recycle, delete | The job engine's own pool of `std` threads with bounded channels; copies use `CopyFileExW` for progress, cancel and attributes |
| CPU-parallel work (folder sizes, large sorts) | `rayon` |
| Folder walks | `ignore` or `jwalk` |
| Watching | `notify` (ReadDirectoryChangesW) |
| Network (remotes, downloads) | Inside the module that needs it; a module may start its own Tokio runtime on first use |

Main libraries (versions are pinned and checked in the Foundation plan):

| Role | Crate |
| --- | --- |
| UI | `gpui`, `gpui-component` |
| Windows API | `windows` |
| Errors | `thiserror` in libraries, `anyhow` only in `rusty-app` |
| Logging and timing | `tracing`, `tracing-subscriber`, `tracing-appender` (size-limited) |
| Serialisation | `serde`, `toml`, `postcard`, `rkyv` |
| Database | `rusqlite` (bundled SQLite) |
| Fuzzy matching | `nucleo`; `frizbee` is compared in the spike |
| Channels | `crossbeam-channel` (bounded) |
| Hashing | `xxhash` for cache keys, `sha2` for copy verification |
| Compression | `lz4_flex` |
| File names | `compact_str` (short names stored inline) |
| Translation | `fluent-bundle` |
| Tests and benchmarks | `proptest`, `insta`, `dhat`, `divan` |

- Sorting by name uses `StrCmpLogicalW`, the same order as Explorer (`file2` before `file10`).
- A file-list row costs about 56 bytes, so 100,000 entries take about 6 MB.
- Release profile: `lto = "fat"`, `codegen-units = 1`, `strip = true`, `panic = "unwind"` so a panic in a background task stops that task, not the app. `mimalloc` is adopted only if the spike shows a gain.

## Safety

### Destructive operations

- **Delete goes to the Recycle Bin** (`IFileOperation` with recycle flags). **Shift+Del deletes permanently** after a warning that lists the count, total size and first paths; Enter on the warning is never the default action.
- **Plan, then act.** Every copy, move, rename or delete builds a plan first: sources, targets, conflicts, totals. Large or risky plans (over 100 items, over 1 GB, anything permanent, anything in a protected location) are shown before they run.
- **Protected locations** (drive roots, `C:\Windows`, `Program Files`, the user profile root, Rusty's own folders) need a typed confirmation.
- **Links are never followed when deleting or moving.** Symlinks and junctions are removed as links; recursive operations stop at reparse points.
- **Re-check at execution.** Paths are canonicalised and re-validated just before each step, so a changed folder can't redirect an operation.
- **Copies are safe:** written to a temporary name, verified (size; optional SHA-256), then renamed. Conflicts follow an explicit policy (ask, skip, rename, overwrite older).
- **Undo** covers rename, move, copy and Recycle Bin operations.
- **Keyboard and mouse guards:** F8 and Del act only when the file list has focus, repeated presses are debounced, and drag-and-drop between drives copies by default.

### Security

- **The app runs without admin rights.** Operations that need elevation run in a small separate helper process for that one operation, with the normal UAC prompt.
- **Starting programs:** files open with `ShellExecuteExW`, so Windows SmartScreen and Mark-of-the-Web checks apply. Programs downloaded from the internet get an extra confirmation.
- **No shell strings from file names:** processes start with argument lists and correct Windows quoting.
- **Untrusted file parsing** (previews of images, archives, PDFs) runs in a separate low-privilege worker process or in WASM, with size limits; extraction blocks path traversal (zip-slip).
- **Credentials** for remotes are kept in Windows Credential Manager, never in config files.
- **Plugins** are sandboxed and permission-checked; see [plugins.md](plugins.md).
- **Supply chain:** pinned dependencies, `cargo-deny` and `cargo-audit` in CI, minimal crate features.
- **No telemetry.** Diagnostic reports are created only on request and never leave the machine unless the user sends them.

## Theming

Modelled on Zed (D16). Themes and icon themes are data packages, so they need no WASM host and ship before v1.0.

- **Colour themes** are TOML files with semantic tokens (surface, rail, line, text, muted, accent, selection, folder, file kinds, ok, warn, danger). One file holds a family with light and dark variants.
- **Mode:** `system`, `light` or `dark`; `system` follows the Windows setting. Settings name one light and one dark theme.
- **Live reload:** editing a theme file updates the window. The theme picker previews each theme while you move through the list.
- **Validation:** a theme with a missing token falls back to the built-in value; text and background pairs below 4.5:1 are reported, not silently accepted.
- **Icon themes** are separate: SVG files mapped by file name, extension and folder name, with open and closed folders. Icons are rendered once per size and cached. Files whose icon lives inside them (`.exe`, `.lnk`, `.ico`) keep the Windows shell icon.
- Fonts, size and density are settings, not part of a theme.

## Drives and network locations

- **Drive bar:** one button per drive letter above the panes, as in Total Commander; mapped network drives show a network icon, disconnected ones are dimmed. It can be turned off in Layout. The rail also lists drives with free space.
- **Alt+F1** opens the drive menu for the focused pane.
- **Enumeration:** `GetLogicalDrives` and `GetDriveTypeW`; mapped drives are resolved to their UNC path with `WNetGetConnectionW`; remembered but disconnected drives come from `WNetOpenEnumW(RESOURCE_REMEMBERED)`. Clicking a disconnected drive reconnects it with `WNetAddConnection2W`, and Windows asks for credentials when it needs them.
- **Changes** arrive through `WM_DEVICECHANGE`, plus a slow periodic check for network drives.
- **Never blocking:** labels, free space and listings of network drives are read in the background with a timeout (2 s for metadata). A share that does not answer shows "offline, showing cached".
- **UNC paths** (`\\server\share`) work wherever a path works: the path bar, new tabs, pins and workspaces.
- **Refresh** per network location: watcher, interval or manual, because SMB change notifications are unreliable.
- Browsing the network neighbourhood comes after v1, as a module.

## Diagnostics

From the Foundation phase, so problems found in testing come with evidence (D20). Nothing is sent anywhere: the user saves a report and decides what to do with it.

**What a report holds:**

| Part | Content |
| --- | --- |
| Build and system | Rusty version and commit, Windows version, CPU count, RAM, GPU adapter class, display scale |
| Configuration | Enabled modules and their versions; settings that differ from the defaults, with paths redacted |
| Errors | Error kind, Windows error code, the operation and a backtrace of Rusty's own functions |
| Panics and crashes | Message, thread, backtrace, the last events before the crash |
| Recent events | The in-memory ring of the last structured events (bounded, about 2 MB) |
| Memory | Process working set and private bytes, allocator statistics, every cache's size against its budget, task and channel counts per owner |
| Performance | Start-up spans, slow-frame histogram, listing times by drive type |

**How it stays free of personal data.** Redaction happens when an event is recorded, not when the report is written:

- Paths are logged only through a `RedactedPath` type. It keeps the shape and drops the names: `C:\<user>\<d:3fa2>\<d:91bc>\<f:07e1>.jpg`, with the drive type (local, network, removable), depth, length class, long-path and non-ASCII flags. Tokens are salted per report, so the same folder gets the same token inside one report and cannot be matched across reports.
- UNC servers and shares become `\\<server:1>\<share:1>`. User, computer and domain names are replaced.
- Windows error texts that embed paths are not stored; the error code and Rusty's own message are.
- No file contents, clipboard data, search queries, file names typed by the user or credentials, ever.
- A test runs a session with canary values (a user name, paths, a server name, a search query) and fails if any of them appears in the logs or the report.

**Where it lives:** a rolling log in `%LOCALAPPDATA%\Rusty\logs` (3 × 10 MB), already redacted. **Help → Save diagnostic report** writes `rusty-report-<date>.zip` with a readable `report.json` and a summary of what it contains; the user can open it before sharing.

**Raw memory dumps** (`MiniDumpWriteDump`) contain whatever was in memory, including file names. They are off by default, can be turned on for one session, stay local, and are deleted after 7 days.

## Terminal

The terminal is a provider, chosen in settings:

| Provider | Behaviour |
| --- | --- |
| **Windows Terminal** (default) | `wt -w 0 nt -d "<folder>"` opens a tab in the existing window; also new window or split pane (`sp`), with an optional profile |
| External command | A template such as `wezterm start --cwd {folder}`, `alacritty --working-directory {folder}` or `cmd /k cd /d {folder}`; arguments are passed as a list, never a shell string |
| Embedded | ConPTY with `alacritty_terminal` in the drawer, following the focused pane; ships after v1 |

The command `terminal.open { where: Tab | Window | Split | Drawer }` works the same with every provider.

## Building and testing

- Development on Linux: everything except the Windows-only crates builds, runs and tests there; the UI runs on Linux for layout work.
- Windows builds: GitHub Actions on `windows-latest` produces a portable `.exe` for every push to `main`, for testing at work. `cargo-xwin` builds locally when needed.
- Corporate machines may block unsigned executables; the build will be signed once a certificate is available, and until then it may need IT approval.
- Quality gate: `cargo fmt`, `clippy -D warnings`, tests, the soak test, the start-up benchmark (Windows CI), `cargo-deny`, `cargo-audit`.
