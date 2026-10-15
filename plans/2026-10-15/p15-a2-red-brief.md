# P15 · A2 Red brief: encodings (D5)

Role: `checker` (Opus 5.5, medium). Worktree: `<worktrees>/rusty-p15-a2`, branch `p15-a2` (from `main`). You write the **failing tests** and a compiling stub. The orchestrator writes the real code (Green). Commit on this branch; never push.

## Goal

F3 opens text in any common encoding. Today it refuses UTF-16 and shows Windows-1252 accents as replacement characters.

Detection order, as in Notepad++:
1. BOM (UTF-8, UTF-16 LE/BE);
2. an XML declaration (`<?xml … encoding="…"?>`) or an HTML `<meta charset>` in the first 1 KB;
3. valid UTF-8;
4. a `chardetng` guess, when it is confident;
5. the fallback (the Windows ANSI code page; the caller passes it in).

Decoding uses `encoding_rs`. The encoding shows in the header and can be changed from a picker (UI, Green's part). A file that would not round-trip opens read-only. Saving writes the same encoding back, with the BOM if it had one.

## Decided shape

### `rusty-core::encoding` (new module; add `encoding_rs` and `chardetng`, latest stable, pinned)

```rust
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DetectedBy { Bom, Declaration, Utf8, Guess, Fallback, Chosen }

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TextEncoding { pub encoding: &'static encoding_rs::Encoding, pub bom: bool, pub by: DetectedBy }
impl TextEncoding { pub fn label(&self) -> String } // "UTF-8", "UTF-8 BOM", "UTF-16 LE BOM", "Windows-1252", …

pub fn detect(bytes: &[u8], fallback: &'static encoding_rs::Encoding) -> TextEncoding;

pub struct Decoded { pub text: String, pub encoding: TextEncoding, pub lossless: bool }
pub fn decode(bytes: &[u8], fallback: &'static encoding_rs::Encoding) -> Decoded;
pub fn decode_as(bytes: &[u8], encoding: &'static encoding_rs::Encoding) -> Decoded; // the picker; `by` is Chosen; a BOM that matches is kept and stripped

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum EncodeError { #[error("…")] Unmappable { line: u64, character: char } }
pub fn encode(text: &str, encoding: &TextEncoding) -> Result<Vec<u8>, EncodeError>; // BOM first when `bom`; UTF-16 written natively (encoding_rs encodes UTF-16 as UTF-8, so do it by hand)

pub fn looks_binary(head: &[u8]) -> bool; // NUL bytes, except text with a UTF-16 BOM or that is clearly UTF-16 by its NUL pattern
pub const PICKER: &[&str]; // encoding labels offered in the picker: UTF-8, UTF-16LE, UTF-16BE, windows-1250…1258, ISO-8859-1/2/15, KOI8-R, Shift_JIS, EUC-JP, GBK, Big5, EUC-KR, IBM866
```

- `lossless` is true when decoding had no malformed sequences **and** `encode(decode(bytes))` gives the same bytes back.
- The BOM is stripped from `text`.
- A declaration naming an unknown label is ignored, and detection goes on to the next step.
- A declaration that contradicts a BOM loses to the BOM.

### `rusty-app::files` (read and write hooks) and `rusty-ui::window_view::{FileText, Save}`

- `FileText` gains `encoding: rusty_core::encoding::TextEncoding`.
- `Save` gains `encoding: TextEncoding`.
- `read`:
  - UTF-16 files open (the refusal goes away);
  - `read_only` is true when `!lossless`;
  - the binary check uses `looks_binary`.
- `write` encodes with the file's encoding. An unmappable character fails with `SaveError::Failed` naming the line and the character; the file is left untouched.
- The fallback comes from `rusty_fs::ansi_code_page()`: Windows maps `GetACP()` to an `encoding_rs` encoding; elsewhere it is `windows-1252`. Add the stub there.

## Tests to write (all must fail on the stub, for the right reason)

1. `detect`, one test per step:
   - every BOM;
   - XML declarations in UTF-8 and in windows-1252 with accents;
   - an HTML meta charset;
   - plain ASCII and valid UTF-8 give UTF-8 (no BOM);
   - a long German or French windows-1252 sample gives windows-1252;
   - a Cyrillic windows-1251 sample gives windows-1251;
   - a Shift_JIS sample gives Shift_JIS;
   - a tiny ambiguous sample falls back to the fallback;
   - a contradicting declaration loses to the BOM;
   - an unknown declared label is ignored.
2. `decode` and `decode_as`:
   - the BOM is stripped;
   - UTF-16 LE/BE text decodes;
   - `lossless` is true for clean files and false for invalid UTF-8 forced as UTF-8;
   - choosing windows-1252 on a UTF-8 file gives mojibake with `by == Chosen`.
3. `encode`:
   - round trips for every `PICKER` encoding on text it can represent;
   - the BOM is written back;
   - UTF-16 LE/BE byte order;
   - an unmappable character (`日` in windows-1252) errors with the right line;
   - a `proptest` round trip for UTF-8 and UTF-16.
4. `looks_binary`: a PNG header and an ELF header are binary; UTF-16 text with and without a BOM is not; plain text is not.
5. `rusty-app` files tests (follow `files/tests.rs`):
   - a UTF-16 LE BOM file reads, edits and saves back as UTF-16 LE with BOM;
   - a windows-1252 file shows `café` and saves back byte-identical;
   - an invalid UTF-8 file opens read-only;
   - saving `日` into a windows-1252 file fails and leaves the file unchanged.

## Stub

Make everything compile with the API above. Return values instead of `todo!`: for example `detect` returns UTF-8 with `Fallback`, `decode` returns lossy UTF-8, and `encode` returns the UTF-8 bytes. Existing tests must keep passing. Adapt the existing `FileText`/`Save` constructions in tests and call sites to the new fields with the minimum change.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/p15-a2
cargo test -p rusty-core -p rusty-fs -p rusty-app --no-fail-fast > <scratch>/a2-red.log 2>&1; echo $?
```

It must exit non-zero. Every new test must fail by assertion, and every existing test must still pass. Also run:
- `cargo clippy --workspace --all-targets -- -D warnings` (it must pass);
- `cargo fmt --check`.

Commit (stub + tests + this brief) with a message that starts `core, app: Red tests for encodings (P15 A2)`. It ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` only. No absolute local paths in committed files.

## Do not touch

- The paged viewer.
- Anything A3, A4 and A5 own: language detection, `rusty-syntax`, `paging::count`, marks and the store.
- Every existing test's intent.

## Report

Commit hash, test count by group, the failing-test summary, API changes and why, the `chardetng` API you relied on (version, confidence call).
