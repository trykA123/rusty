# Rust projects worth a look (GitHub scan, 2026-10-29)

Two scans by a researcher agent. Everything already in `Cargo.lock` or in the 2026-10-28 research is left out. Licences marked "check" were not verified. GPL, AGPL and LGPL crates are not usable.

## App structure and engines

| Project | Use for Navo |
| --- | --- |
| [yazi](https://github.com/sxyazi/yazi) (MIT) | design reference: `yazi-scheduler` (job queue), `yazi-adapter` (preview pipeline), `yazi-plugin` (Lua API), `yazi-sftp` |
| [usn-journal-rs](https://github.com/wangfu91/usn-journal-rs), [ntfs-reader](https://github.com/kikijiki/ntfs-reader), [mft](https://github.com/omerbenamram/mft) (check) | benchmarks and cross-checks for our MFT/USN index |
| [reflink-copy](https://github.com/cargo-bins/reflink-copy) (check) | block clone on ReFS and Btrfs in the copy engine |
| [gpui-ce](https://github.com/gpui-ce/gpui-ce) (Apache-2.0) | published, versioned GPUI; check API drift before switching pins |
| [pueue](https://github.com/Nukesor/pueue), [dua-cli](https://github.com/Byron/dua-cli) | persistent queue and parallel walk patterns |
| [rgitui](https://github.com/noahbclarkson/rgitui) (MIT) | a GPUI Git client to learn from for the Git milestone |

## Clipboard, system and keys

| Project | Use for Navo |
| --- | --- |
| [arboard](https://github.com/1Password/arboard) + [clipboard-win](https://github.com/DoumanAsh/clipboard-win) | clipboard history: text, images, file lists, the Windows exclude-from-history flag |
| [wl-clipboard-rs](https://github.com/YaLTeR/wl-clipboard-rs) | file lists on Wayland |
| [global-hotkey](https://github.com/tauri-apps/global-hotkey), [tray-icon](https://github.com/tauri-apps/tray-icon) | Win+Alt+N and the optional tray (not Wayland) |
| [crokey](https://github.com/Canop/crokey) | key-combination parsing and hints |
| [junction](https://github.com/tesuji/junction), [lnk](https://github.com/lilopkins/lnk-rs) | junctions and `.lnk` targets |
| [minijinja](https://github.com/mitsuhiko/minijinja), [navi](https://github.com/denisidoro/navi) (reference) | variables in the commands module and multi-rename |

## Viewers and archives

| Project | Use for Navo |
| --- | --- |
| [tree-sitter-highlight](https://github.com/tree-sitter/tree-sitter) | highlighting on the grammars we ship |
| [jxl-oxide](https://github.com/tirr-c/jxl-oxide) | JPEG XL preview, pure Rust |
| [turbojpeg](https://github.com/honzasp/rust-turbojpeg) | JPEG thumbnails at 1/8 size without a full decode |
| [zstd](https://github.com/gyscos/zstd-rs), [liblzma](https://github.com/portable-network-archive/liblzma-rs), [bzip2](https://github.com/trifectatechfoundation/bzip2-rs) | `.tar.zst`, `.tar.xz`, `.tar.bz2` |
| [backhand](https://github.com/wcampbell0x2a/backhand) | SquashFS and AppImage contents |
| [calamine](https://github.com/tafia/calamine) | spreadsheets in F3 (already in the library map) |

No permissive HEIC or RAW decoder is mature; Windows thumbnails (`IShellItemImageFactory`) stay the plan.

## Build, test and performance

| Project | Use for Navo |
| --- | --- |
| [cargo-deny](https://github.com/EmbarkStudios/cargo-deny) | CI gate against GPL/AGPL/LGPL crates and advisories |
| [gungraun](https://github.com/gungraun/gungraun) + [tracy-client](https://github.com/nagisa/rust_tracy_client) | stable instruction-count perf guards (Linux) and frame profiling |
| [cargo-mutants](https://github.com/sourcefrog/cargo-mutants) | check that data-safety tests catch real mistakes |
| [samply](https://github.com/mstange/samply) | sampling profiler on Windows and Linux |

Not usable: rawler (LGPL), jpegxl-rs (GPL), chardet (LGPL), cosmic-files (GPL), ImHex (GPL).
