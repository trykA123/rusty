# Navo libs: find, compare, archives, file tools (checked 2026-10-28)

Versions and dates: crates.io API; commit dates: GitHub API. Windows support not seen in sources is marked UNVERIFIED.

## Find and search

| Need | Candidate | Version / date | License | Verdict | Reason |
|---|---|---|---|---|---|
| Content search | grep-searcher + grep-regex + grep-matcher | 0.1.17 (2026-07-15) / 0.1.14 / 0.1.9 | Unlicense OR MIT | ADOPT | Same memchr/regex core as ours, plus line buffering, context lines, multiline and binary detection (`BinaryDetection::quit/convert`). Saves writing it. |
| UTF-16 / legacy text in search | encoding_rs_io | 0.1.8 (2026-08-04) | MIT OR Apache-2.0 | ADOPT | BOM-sniffing transcoding reader; feeds grep-searcher. Uses encoding_rs, which we already have |
| Parallel walk + ignore rules | ignore | 0.4.34 (2026-10-27) | Unlicense OR MIT | ADOPT | Parallel walker, gitignore. Very active. |
| Name index, prefix/regex/Levenshtein | fst | 0.4.7 (2021-06; repo touched 2024-09) | Unlicense OR MIT | TRY | Immutable mmap set. Prefix and fuzzy via automata. No substring search. Stable, not active |
| Substring over millions of names | our flat lowercase arena + memchr memmem | n/a | n/a | KEEP OURS | One contiguous buffer scan is a few tens of ms for millions of names (my estimate, not benchmarked). No index to build or scan |
| Fuzzy picker over streaming list | nucleo | 0.5.0 (2024-04; last commit 2026-06-22, docs only) | MPL-2.0 | TRY | Adds a background thread pool, injector and snapshots for type-to-filter over huge lists. Same matcher |
| Faster/typo-tolerant matcher | frizbee | 0.13.0 (2026-09-18) | MIT | TRY | SIMD Smith-Waterman, stable Rust, Windows CI fix 2026-09. Author's benchmark (Ryzen 9950x3D, AVX-512) says ~4x nucleo with typos off. Young, with unsafe over-reads (README); benchmark on the laptop first |
| NTFS MFT/USN enumeration | usn-journal-rs; ntfs-reader; mft | 0.5.0 (2026-10-13); 0.6.0 (2026-10-01); 0.8.0 (2026-10-27) | MIT; MIT/Apache; MIT/Apache | SKIP (default) | Needs Administrator (usn-journal-rs README) and raw volume access, which EDR may flag. Optional elevated helper later |

## Compare, checksums, duplicates

| Need | Candidate | Version / date | License | Verdict | Reason |
|---|---|---|---|---|---|
| Line diff | similar (ours) | 3.2.1 (2026-10-24) | Apache-2.0 | KEEP OURS | Inline word/char diff |
| Fast line diff | imara-diff | 0.2.0 (2025-06; commit 2026-06-21) | Apache-2.0 | TRY | Histogram + Myers with git/gnu-diff heuristics, built to avoid slow pathological cases. Use for large files. Limit 2^31 tokens |
| Syntax-aware diff | difftastic | 0.71.0 (2026-09-18) | MIT | SKIP | Binary crate only (`[[bin]] difft`, no `[lib]` in Cargo.toml). Optional external tool |
| Folder compare | dirdiff | 0.1.0 (2019) | BSD-3 | SKIP | Dead. Write ours: parallel walk, size+mtime, then blake3 on demand |
| Delta sync | fast_rsync | 0.2.0 (2023-03; last commit 2024-04) | Apache-2.0 | SKIP | Only pays off over slow links. Local sync should copy |
| Image compare | image-compare | 0.5.0 (2025-08-18) | MIT | TRY | SSIM/RMS/histogram and diff image, on our `image` crate. (dssim is AGPL: out) |
| Fast hash / verify | blake3 | 1.8.7 (2026-08-20) | CC0 / Apache-2.0 | ADOPT | SIMD + multithreaded (`rayon`, `mmap` features) for verify and duplicates. |
| SHA-1 files | sha1 | 0.11.0 (2026-07-10) | MIT OR Apache-2.0 | ADOPT | Same RustCrypto family as our sha2/md-5, for .sha1 checks |
| Duplicate finder | czkawka_core | 12.0.2 (2026-09-09) | MIT | SKIP | Only 57k downloads. Tied to its GUIs (symphonia, chromaprint, lopdf, i18n). Copy the pipeline: size, 4-64 KB partial hash, full blake3 |
| Hard-link aware sizes | windows-sys (ours) + same-file (ours) | n/a | n/a | KEEP OURS | Use `GetFileInformationByHandleEx` (FileIdInfo, FileStandardInfo: link count, AllocationSize). file-id 0.2.3 gives ids only |

## Archives

| Need | Candidate | Version / date | License | Verdict | Reason |
|---|---|---|---|---|---|
| zip read/write | zip (ours) | 9.1.3 (2026-10-27) | MIT | KEEP OURS | Central directory gives random-access listing. Several security fixes in 9.1.1-9.1.3 (changelog): update often |
| 7z | sevenz-rust2 (ours) | 0.24.1 (2026-10-18) | Apache-2.0 | KEEP OURS | Pure Rust, write ok (README). Solid blocks force decoding up to the file |
| tar | tar (ours) | 0.4.46 (2026-05-18) | MIT OR Apache-2.0 | KEEP OURS | Listing `.tar.gz/xz/zst` needs a full stream scan: list in the background, cache the result |
| zstd write | zstd | 0.14.3 (2026-10-16) | BSD-3 | TRY | C binding, fast with multithreading, for writing .tar.zst. ruzstd stays for reading |
| xz | liblzma | 0.4.9 (2026-10-19) | MIT OR Apache-2.0 | TRY | C xz, faster than pure Rust. lzma-rust2 0.24.0 (2026-10-25) stays as fallback |
| RAR | unrar / unrar_sys | 0.5.8 (2025-02-19) | wrapper MIT OR Apache-2.0; bundled UnRAR source has its own licence | TRY (legal check) | List and extract only. UnRAR licence allows free use and redistribution inside other software if the licence text is kept, but forbids building RAR-compatible compressors (vendor/unrar/license.txt). It is not OSI. Needs owner sign-off. Windows build UNVERIFIED |
| libarchive | compress-tools | 0.16.1 (2026-04-23) | MIT OR Apache-2.0 | SKIP | Needs system libarchive (on Windows vcpkg). One more native DLL. |

CrowdStrike tip: show single archive entries by reading into memory instead of extracting to disk. Extract in one temp folder, not file by file.

## File operations

| Need | Candidate | Version / date | License | Verdict | Reason |
|---|---|---|---|---|---|
| Copy with progress, cancel | windows-sys `CopyFile2` | 0.61.2 (2025-10-06) | MIT OR Apache-2.0 | ADOPT | Documented progress routine, pause/cancel, ReFS and SMB support; `COPY_FILE_REQUEST_COMPRESSED_TRAFFIC` (Win10 1903+) for SMB (Microsoft Learn). `std::fs::copy` already calls `CopyFileExW` but gives no callback (std source) |
| Reflink / ReFS clone | reflink-copy | 0.1.30 (2026-06-18) | MIT/Apache-2.0 | TRY | Windows listed in README. Helps on Dev Drive/ReFS |
| Fast recursive delete | remove_dir_all | 1.0.0 (2024-11-22) | MIT OR Apache-2.0 | TRY | Windows-aware delete |
| Trash | trash (ours) | 5.2.9 (2026-09-13) | MIT | KEEP OURS | Already used |
| Split / combine | none | n/a | n/a | KEEP OURS | Streaming copy with chunk sizes, plus a crc32/blake3 manifest |
| Batch rename | none | n/a | n/a | KEEP OURS | regex, chrono, kamadak-exif, unicode-normalization already cover tokens and counters |

Other-language helpers: none clearly beats Rust here. rclone (Go, MIT) fits only cloud/remote sync. It costs a process start (slow under CrowdStrike) plus HTTP/JSON on localhost. Missed option: opendal 0.59.5 (2026-10-18, Apache-2.0), in-process Rust backends for S3/WebDAV/SFTP.

## Top 5 for Navo
1. grep-searcher + grep-regex + encoding_rs_io + ignore: ADOPT for content search.
2. blake3 (multithreaded) for verify and a size, partial-hash, full-hash duplicate pipeline of our own: ADOPT.
3. windows-sys CopyFile2 with a progress and cancel callback, plus FileIdInfo for hard-link-aware sizes: ADOPT.
4. Name index: keep a flat arena and memmem, rank with nucleo (full) or frizbee after a laptop benchmark: TRY.
5. imara-diff for large-file line diff, and unrar after an owner licence decision: TRY.

Sources: crates.io API (all crates); GitHub repos of unrar.rs (vendor/unrar/license.txt), zip2 (CHANGELOG), frizbee (BENCHMARKS), imara-diff, czkawka (czkawka_core/Cargo.toml), difftastic (Cargo.toml), usn-journal-rs, reflink-copy, sevenz-rust2; docs.rs grep-searcher BinaryDetection; learn.microsoft.com CopyFile2; rust-lang/rust library/std/src/sys/fs/windows.rs.
