# Integrations, extensibility, distribution (checked 2026-10-28)

Versions and dates: crates.io API, fetched 2026-10-28.

| Need | Candidate (version, date) | License | Verdict | Reason |
|---|---|---|---|---|
| Git | gix 0.90.0, 2026-10-22 | MIT/Apache | TRY | Pure Rust, in-process: no `git.exe` spawn under CrowdStrike. Speed vs CLI UNVERIFIED; measure with hyperfine. |
| | git2 0.21.0, 2026-10-06 | MIT/Apache | SKIP | libgit2 C build, no gain over gix. |
| SFTP | russh 0.65.0 (2026-10-25) + russh-sftp 3.0.1 (2026-09-28) | Apache-2.0 | ADOPT | Pure Rust, async, active. |
| | ssh2 0.9.6, 2026-06-30 | MIT/Apache | SKIP | libssh2 C, blocking. |
| S3, WebDAV, SFTP unified | opendal 0.59.5, 2026-10-18 | Apache-2.0 | TRY | One async API; feature-gate each service. |
| | rust-s3, object_store, reqwest_dav | MIT/Apache | SKIP | OpenDAL covers them. |
| Cloud drives | rclone v1.75.2, 2026-10-09 (Go) | MIT | TRY (helper) | Only route to 70+ providers; see note. |
| WASM plugins | wasmtime 50.0.0, 2026-10-20 | Apache-2.0+LLVM | TRY (v2) | Zed's model: wasm32-wasip2 + WIT. |
| | extism 1.41.0, 2026-10-09 | BSD-3 | SKIP | Extra layer over wasmtime. |
| Scripting | mlua 0.12.2, 2026-10-03 (Lua 5.4 or sandboxed Luau) | MIT | ADOPT | Cheap user scripts, no compile step. |
| | rhai 1.27.0, 2026-10-21 (the missed option) | MIT/Apache | TRY | Pure Rust, easy sandbox; unfamiliar syntax. |
| Clipboard | clipboard-win 5.4.3, 2026-10-23 | BSL-1.0 | ADOPT | Win32 clipboard; has a change-listener `Monitor` for history. |
| | arboard 3.7.0, 2026-10-15 | MIT/Apache | TRY | Cross-platform text/image; useful for Linux later. |
| Secrets | keyring-core + windows-native-keyring-store 1.1.0, 2026-05-24 (keyring 4.2.0 is the facade) | MIT/Apache | TRY | Credential Manager holds one key. Blob size limit UNVERIFIED. |
| | age 0.12.1, 2026-07-14 | MIT/Apache | ADOPT | Encrypted snippet and secret file. |
| | windows-dpapi 0.2.0 | MIT/Apache | SKIP | Windows-only; age + keyring ports. |
| Terminal | alacritty_terminal 0.26.0, 2026-04-06 | Apache-2.0 | TRY (v2) | Grid + ConPTY backend; Zed uses a fork. |
| | portable-pty 0.9.0 (2025-02-11), termwiz 0.23.3 (2025-03-20), libghostty-vt 0.2.2 | MIT | SKIP | Stale or too new; wezterm-term not on crates.io. |
| Toasts | tauri-winrt-notification 0.8.1, 2026-07-17 | MIT/Apache | ADOPT | Maintained; needs an AppUserModelID set by the installer shortcut. |
| Jump list | `windows` crate `ICustomDestinationList` | MIT/Apache | KEEP OURS | No new crate. |
| Explorer menu | IExplorerCommand COM DLL + signed sparse package | n/a | TRY | Win11 new menu ([MS Learn](https://learn.microsoft.com/en-my/WINDOWS/APPS/desktop/modernize/integrate-packaged-app-with-file-explorer)). Fallback: HKCU `shell` verbs. |
| Installer, updates | Velopack crate 1.2.161, vpk 1.3.39, 2026-10-17 | MIT | ADOPT | Installer, portable package, delta updates, any HTTP host. Docs still say vpk needs .NET SDK 8 ([docs](https://docs.velopack.io/getting-started/rust)). |
| | cargo-packager 0.11.8, 2025-11-27 | Apache/MIT | SKIP | NSIS/WiX plus updater, but no release for 11 months. |
| | cargo-wix 0.3.9, 2025-03-13 | MIT/Apache | SKIP | Stale, WiX only. |
| Signing | Azure Artifact Signing (ex Trusted Signing) | service | ADOPT if eligible | Individuals: US/Canada only. Organizations: US, CA, EU, UK, AU, NZ, JP, KR, SG, CH, NO, IL ([quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)). Price UNVERIFIED. Else an OV/EV certificate. |
| Accessibility | accesskit 0.25.2 / accesskit_windows 0.35.2, 2026-10-25 | MIT/Apache | ADOPT | GPUI added AccessKit 2026-05-27 (zed PR 56065). Our vendored `gpui-pre-windows` 0.3.9 already holds the Windows adapter in `src/window.rs`. We must emit the tree nodes. |
| Localization | fluent-bundle 0.16.0, 2025-05-22 | MIT/Apache | KEEP OURS | Already in use. |
| Workflow engine | dagrs 0.9.0 (5.9k downloads), treadle, takeln | MIT/Apache | SKIP | Immature. Write a small step runner on petgraph; the visual builder is custom GPUI. |

## Notes

**Git.** Zed's `crates/git` uses neither git2 nor gix, and is GPL-3.0, so we cannot copy it. I found no reproducible `gix status` vs `git status` benchmark; the only claim is a work-in-progress speedup ([gitoxide discussion 1351](https://github.com/Byron/gitoxide/discussions/1351)). Measure on the CrowdStrike machine, cache status per repo, refresh on watcher events.

**rclone.** `rclone rcd` is a separate Go process with a JSON-over-HTTP API ([rclone.org/rc](https://rclone.org/rc/)). Cost: one process start, which CrowdStrike scans, then one loopback HTTP call per operation. I have no measured latency; it is small beside network time. Bind to 127.0.0.1 with a password. `librclone` avoids the process but needs cgo, Go and GCC, and is marked experimental ([README](https://github.com/rclone/rclone/blob/master/librclone/README.md)). Use the helper process, and OpenDAL for everything else.

**Plugins.** Zed runs extensions as wasip2 components with granted capabilities such as `process:exec` and `download_file` ([docs](https://github.com/zed-industries/zed/blob/main/docs/src/extensions/capabilities.md)). Copy that: deny by default, grant per plugin.

**Win+E.** Windows has no API to replace the file manager. Files uses an optional feature that intercepts Explorer calls ([Files docs](https://www.files.community/docs/customize-settings/advanced)). The exact registry key is UNVERIFIED. Make it opt-in with a revert path.

## Top 5

1. gix for git status, after a hyperfine check.
2. Velopack plus Azure Artifact Signing for installer, portable mode and delta updates.
3. russh + russh-sftp, with OpenDAL for S3 and WebDAV; rclone rcd later as an optional helper.
4. AccessKit tree nodes on the GPUI support we already vendor.
5. mlua (Luau) scripting now; wasmtime plugins and alacritty_terminal in v2.

## Sources
crates.io API; https://github.com/GitoxideLabs/gitoxide; https://github.com/zed-industries/zed (PR 56065, Cargo.toml); https://github.com/alacritty/alacritty; https://docs.velopack.io; https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart; https://docs.rs/keyring/latest/keyring/; local `vendor/gpui-pre-windows/src/window.rs`.
