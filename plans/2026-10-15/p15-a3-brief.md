# P15 · A3 brief: extra grammars and language detection (D6, first half)

Role: `general-purpose` (Opus 5.5, medium). Worktree: `<worktrees>/rusty-p15`, branch `p15-a3` (from `main`). Commit on this branch after the gate passes; never push, never merge.

## Goal

F3 and Ctrl+E colour far more languages. Two parts:

1. **Grammars.** Compiled-in tree-sitter grammars, registered once in gpui-component's `LanguageRegistry` before any editor opens. Priority order:
   1. XML (also xaml, svg, plist, csproj/vcxproj/props/targets, resx, nuspec, xsd, xsl/xslt, `.config`, arxml);
   2. SQL (prefer gpui-kit's own `tree-sitter-sql` feature);
   3. PowerShell;
   4. INI, properties and conf;
   5. batch (`.bat`, `.cmd`);
   6. Dockerfile (`Dockerfile`, `Containerfile`, `*.dockerfile`);
   7. JSON5 and JSONC;
   8. R;
   9. Perl;
   10. LaTeX;
   11. Objective-C;
   12. VB and VBS;
   13. linker scripts (`.ld`, `.lds`);
   14. TRACE32 `.cmm`;
   15. assembly (`.s`, `.S`, `.asm`).

   Register as many as build cleanly. A grammar without a usable crate is not vendored or hand-written here: list it in the report. A4's rule lexer covers it.
2. **Detection.** One function picks the language from the file name **and** the first bytes:
   - the extension map (all existing entries plus the new ones);
   - special names (`Makefile`, `Dockerfile`, `Containerfile`, `CMakeLists.txt`);
   - content sniffing when the extension is unknown, `text`, or ambiguous:
     - `<?xml` (after an optional BOM) gives xml;
     - shebang lines (`#!/usr/bin/env python3`, `#!/bin/bash`, `sh`, `perl`, `pwsh`, `Rscript`, `node`) give their language;
     - first-line mode hints (`-*- mode: x -*-`, `vim: set ft=x`) give theirs.
   - Ambiguous extensions are decided by content: `.m` (Objective-C or text), `.cls` (LaTeX `\documentclass`/`\ProvidesClass` or VB `VERSION`/`Attribute VB_`), `.inc`, `.conf`.

## Decided rules

- Detection lives in its own module in `rusty-ui` (for example `src/languages/`), with no GPUI types: `pub fn detect(name: &str, head: &[u8]) -> &'static str`. Replace `viewer::language_of` and its `KNOWN` list with it. The text kind and the editor pass the head bytes the viewer already reads for sniffing (`Sniff.head`).
- Registration: one `register_languages()` guarded by `std::sync::Once`, called from `rusty-ui`'s init path (find where gpui-kit is initialised).
- Map every new grammar's highlight captures onto the names gpui-component knows (`HIGHLIGHT_NAMES` in `gpui-component-0.7.3/src/highlighter/registry.rs`). A capture that has no match is dropped or remapped, not left to fail.
- Grammar crates must link against the workspace's `tree-sitter` 0.26 (through `tree-sitter-language`). Pin exact versions. Check licences with `cargo deny check` (MIT, Apache-2.0 and similar are fine).
- Dependencies are welcome (D37). Report the release `ferrite` binary size before and after (`cargo xtask binsize <path>`); the CI limit is 60 MB.
- Code style: `~/.agents/rules/rust.md` and `code-quality.md`. No explanatory comments. Files under the size limits; split by language family if the table grows.

## Read first

- `plans/2026-10-15-p15-viewer.md` (D1, D6).
- `crates/rusty-ui/src/window_view/viewer/mod.rs` (`language_of`, `KNOWN`), `viewer/kinds.rs` (`Sniff`), `viewer/kinds/text.rs`, `viewer/editor/mod.rs` (`EditorState::language`).
- `crates/rusty-ui/src/window_view/tests.rs` `extensions_pick_their_language` (keep every assertion true).
- `crates/rusty-ui/Cargo.toml` (gpui-kit features).
- gpui-component's registry: `~/.cargo/registry/src/index.crates.io-*/gpui-component-0.7.3/src/highlighter/registry.rs` (`LanguageConfig::new`, `LanguageRegistry::singleton().register`) and `src/highlighter/languages.rs` for how built-in grammars are wired.

## Tests (write them first)

1. Detection, table-driven: every extension and special name above; each sniff rule; each ambiguous extension both ways; unknown stays `text`; the existing `extensions_pick_their_language` cases.
2. Every language `detect` can return is either `text` or registered with a grammar after `register_languages()`.
3. For every registered new grammar, its highlights query compiles against its grammar (`tree_sitter::Query::new`), and highlighting a short sample yields at least one capture from `HIGHLIGHT_NAMES`. This catches query/ABI mismatches that only fail at runtime.
4. One headless viewer test: F3 on a `.ps1` and on an `.arxml` file sets the editor's language to the new grammar.

## Do not touch

- `crates/rusty-core`, `crates/rusty-store`, the paged viewer (`viewer/paged/`), hex.
- A4 (rule lexer) and A5 (search and marks) run in parallel in other worktrees. Keep your changes to detection, registration, the text kind/editor call sites and their tests.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/p15
cargo xtask gate > <scratch>/a3-gate.log 2>&1; echo $?
```

It must print 0. Never pipe the gate. Then commit. The commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` only. No absolute local paths in committed files.

## Stop if

- the grammar crates cannot share one `tree-sitter` version with gpui-component and no clean option exists (report the conflicts);
- the change needs edits outside `crates/rusty-ui` (Cargo.lock and `deny.toml` are fine);
- an existing test's intent would have to change.

## Report

Commit hash, grammars registered (crate and version each), grammars left for A4 and why, files with line counts, tests added, binary size before and after, the gate result, deviations.
