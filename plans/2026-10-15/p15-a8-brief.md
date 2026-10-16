# P15 · A8 brief: archives and fonts in F3 (D10)

Role: `general-purpose` (Opus 5.5, medium). Worktree: `<worktrees>/rusty-p15-a8`, branch `p15-a8` (from `main`). Commit on this branch after the gate passes; never push, never merge.

## Goal

D10 in `plans/2026-10-15-p15-viewer.md`: two new viewer kinds in the Rich slot (key 5).

- **Archive.**
  - Zip, tar, tar.gz/tgz, tar.xz/txz, tar.zst and 7z contents are listed, with name (full path inside the archive), size, packed size (when the format has one), date, and a folder or file icon.
  - The list is virtualised and keyboard-first: Up/Down, PageUp/PageDown, Home/End, type-to-filter (as in the file list).
  - Enter on a file entry of up to 64 MB reads it into memory and shows it in a nested text or hex view, chosen with the existing sniff (`Sniff::looks_binary`, now encoding-aware). Esc returns to the listing.
  - Encrypted entries show a lock and say "Encrypted: not supported yet". A corrupt archive shows a clear message and no panic.
- **Font.**
  - TTF, OTF, TTC (first face) and WOFF/WOFF2 if a pure-Rust decoder is cheap; otherwise list WOFF2 as a follow-up.
  - Show the family, style and glyph count.
  - Show a sample sentence at 12, 16, 24, 36, 48 and 72 px rendered in that font (register the bytes with GPUI's text system, as gpui supports adding fonts from memory), and a glyph grid of the font's first few hundred glyphs.
  - The header shows the file name, format and version.

## Decided rules

- **Never on the UI thread** (D3).
  - Archive listing and entry reads go through new `FileHooks` entries, run on the background executor:
    - `archive: Fn(&Location) -> Result<ArchiveListing, String>`;
    - `archive_entry: Fn(&Location, entry_index) -> Result<Vec<u8>, String>`, with the 64 MB cap enforced inside.
  - Font bytes come from a hook `bytes: Fn(&Location, limit) -> Result<Vec<u8>, String>` (cap 32 MB).
  - `FileHooks::none()` gives erroring versions, and the test hooks give in-memory fakes.
- **Where the code lives.**
  - The archive reading logic lives in `crates/rusty-fs` (new module `archive/`), pure over a `Read + Seek` or a path, unit-tested with archives built in temp dirs.
  - `rusty-app`'s `hooks()` wires it.
  - `rusty-ui` holds only the types and the views; the kinds go in `viewer/kinds/archive.rs` and `viewer/kinds/font.rs`, plus one line each in `Kinds::builtin()`.
- **Dependencies: pure Rust and small, pinned exactly.** Prefer:
  - `zip` (already in the lock as a dev-dependency) with deflate only, plus bzip2/zstd if pure-Rust features exist;
  - `tar`, `flate2` (already present, miniz backend);
  - `lzma-rs` or `xz` pure decoders;
  - `ruzstd`;
  - `sevenz-rust2` (or the maintained pure-Rust 7z reader of the day);
  - `ttf-parser` (already present).

  No C libraries. Check licences with `cargo deny check`.
- **Exe size matters right now.**
  - The Windows exe is about 81.8 MB against an 83.9 MB (80 MiB) CI limit, and raising the limit is the owner's decision.
  - Measure the release `ferrite` size before and after with `cargo xtask binsize <path>` (Linux build) and report the delta.
  - Prefer the smallest crates and disable default features.
- **Scores (sniff).**
  - The archive kind scores high for zip/7z/tar magic bytes and those extensions (`.zip .jar .apk .docx .xlsx .nupkg .7z .tar .tgz .gz` when it holds a tar, `.txz .tar.xz .tar.zst`).
  - The font kind scores high for TTF/OTF/TTC/WOFF magic.
  - Both stay below Text for text files. Hex stays reachable with key 3.
- **Look:** use the existing tokens and primitives, and keep it polished and modern (decision D41: Ferrite is not a visual clone of Total Commander). No flashing.

## Read first

- `plans/2026-10-15-p15-viewer.md` (D1, D3, D10), `docs/decisions.md` (D13, D41).
- `crates/rusty-ui/src/window_view/viewer/`: `kinds.rs` and `kinds/{text,hex}.rs` (the `ViewerKind` trait: score/load/attach/reuse), `body.rs` (`ViewerBody`), `files.rs` (`FileHooks`), `mod.rs`, `lister.rs`, `keys_bar.rs`, `paged/` (how a body draws virtualised rows), `tests/` (headless pattern).
- `crates/rusty-app/src/files/` (hooks wiring), `crates/rusty-fs/src/lib.rs` (module layout).
- `~/.agents/rules/rust.md`, `code-quality.md`, `web-ui.md`. The strict clippy config: excessive_nesting, too_many_arguments (max 4), too_many_lines, no unwrap/expect/panic outside tests.

## Tests (write first)

1. **rusty-fs archive:**
   - list and read an entry for every format;
   - nested folders; a zip with a directory entry;
   - an entry over the cap is refused;
   - a corrupt archive errors, never panics;
   - an encrypted zip entry is flagged;
   - a path-traversal name (`../evil`) is listed as-is but never used to touch the disk.
2. **Kinds:** the scores pick Archive for each format, Font for each font type, and Text or Hex for other files.
3. **Headless views:**
   - F3 on a zip lists its entries; Enter on a text entry shows its text and Esc returns to the list;
   - a font file shows its family name and renders the sample lines (assert on text elements, not pixels);
   - all reads go through the hooks on the background executor.
4. **Screenshots:** headless only, never on the owner's desktop. Save `design/screens/p15-archive-{light,dark}.png` and `p15-font-{light,dark}.png` and look at them.

## Do not touch

The paged and editor bodies (A5b changes them in another worktree), encodings (A2), languages (A3/A4), `rusty-core` and `rusty-store`.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/p15-a8
cargo xtask gate > <scratch>/a8-gate.log 2>&1; echo "gate exit $?"; tail -1 <scratch>/a8-gate.log
```

It must print `gate exit 0`, and the last line must read `gate: all 9 steps passed`. Never pipe the gate. Then commit: stage files explicitly, and end the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` only. No absolute local paths in committed files.

## Stop if

- GPUI cannot render a font from memory at all (report what you found, and ship the archive part plus the font metadata without the sample);
- the formats need C libraries to work;
- an existing test's intent would have to change.

## Report

Commit hash, crates added (version, licence, size impact), the exe size before and after, files with line counts, tests, screenshot paths, gate result, and deviations.
