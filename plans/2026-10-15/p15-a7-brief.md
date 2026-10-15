# P15 · A7 brief: tree, table and markdown in F3 (D9)

Role: `ui-builder-high` (Opus 5.5, high). Worktree: `<worktrees>/rusty-p15-a7`, branch `p15-a7` (from `main`). Commit on this branch after the gate passes; never push, never merge.

## Goal

D9 in `plans/2026-10-15-p15-viewer.md`: three viewer kinds in the Rich slot (key 5). They must feel modern and fast. Ferrite is not a visual clone of Total Commander (D41, D42).

- **Tree.**
  - JSON (and JSONC/JSON5 if cheap), YAML and XML show as a collapsible, virtualised tree.
  - Each row: key or tag, a type badge or child count, a value preview, and XML attributes inline.
  - Keys: Up/Down, Left collapses or goes to the parent, Right expands or goes to the first child, `*` expands the subtree, `-` collapses all, type-to-filter on keys.
  - Ctrl+Shift+C copies the selected node's path (`$.a.b[3]` for JSON and YAML, `/a/b[3]` for XML). The header shows the path of the selected node.
  - XML over 16 MB uses a streaming index built with `quick-xml` (already in `Cargo.lock`). The index stores byte offsets and child counts per element and reads children on expand, so an ARXML of hundreds of MB opens with bounded memory. Show "Indexing… N elements" progress; the index build can be cancelled with Esc.
  - JSON and YAML over a limit (say 64 MB) fall back to Text or Hex; say so in the header.
  - A parse error shows the message with line and column, plus a key to open the file as Text.
- **Table.**
  - CSV and TSV (`csv` crate). Sniff the delimiter (comma, semicolon, tab, pipe) and whether the first row is a header.
  - Virtualised rows and columns, with a sticky header and a row-number column. Column widths come from a sample of rows, and long cells are clipped with an ellipsis.
  - Keys: arrows move the cell cursor, Home/End, PageUp/PageDown. Ctrl+C copies the cell, Ctrl+Shift+C copies the row.
  - Click a header to sort, or use Ctrl+F3 on the cursor column. Sorting is numeric when the column is numeric; it reads all rows once on the background executor.
  - Files over 16 MB are indexed by line offsets in the background and read on demand. Sort is off for them, and the header says why.
- **Markdown.**
  - Rendered with gpui-component's markdown view if gpui-kit or the vendored gpui-component exposes it (check first). Otherwise render headings, paragraphs, lists, code blocks, tables, links, emphasis and block quotes with our own primitives, using the `markdown` crate already in `Cargo.lock` (it is a gpui-component dependency).
  - Links open externally only on Ctrl+click or Enter, never on a plain click.
  - Key 1 still shows the source as Text.

## Decided rules

- **Never on the UI thread** (D3).
  - Parsing, indexing and sorting run on the background executor.
  - File access goes through `FileHooks`. Reuse `bytes(&Location, limit)` if it exists on `main` when you start. If it does not, add it with exactly that name and signature: A6 and A8 add the same hook in other worktrees, so keep it identical for a trivial merge.
  - The XML streaming index needs ranged reads: add a `range(&Location, offset, len) -> Result<Vec<u8>, String>` hook.
  - `FileHooks::none()` gives erroring versions, and the test hooks give in-memory fakes.
- **Where the code lives.**
  - The pure parsing and indexing logic (the tree model for JSON, YAML and XML, the XML index, CSV sniffing and the line index) goes in a new GUI-free crate, `crates/rusty-structured`. Unit-test it there.
  - The views go in `viewer/kinds/{tree,table,markdown}.rs`, plus small modules under `viewer/tree/` and `viewer/table/` when they grow, and one line each in `Kinds::builtin()`.
- **Scores.**
  - Tree wins over Text for `.json .jsonc .json5 .yaml .yml .xml .arxml .xsd .xaml .csproj .plist .svg`, only when the content parses or looks like it (`{`, `[`, `<?xml`, `<`). SVG is claimed by A6's Image kind; let Image win for SVG.
  - Table wins for `.csv .tsv`. Markdown wins for `.md .markdown`.
  - Text stays reachable with key 1 and Hex with key 3.
- **Dependencies:** pure Rust, small, pinned exactly.
  - `serde_json` is already present.
  - For YAML pick a maintained crate: `serde_yaml` is deprecated; check `serde_yaml_ng`, `yaml-rust2` or `saphyr`.
  - `quick-xml` and `csv`.
  - Exe size matters: the Windows exe is about 81.8 MB against an 83.9 MB CI limit, and raising the limit is the owner's call. Measure the release `ferrite` before and after with `cargo xtask binsize <path>` (Linux build) and report the delta.
- **Look:**
  - Use the existing tokens and primitives (D41/D42: direction B, Mica cards, modern).
  - Tree guides and the expand chevrons are subtle. Type badges use the existing kind colours.
  - No flashing. Respect reduced motion.

## Read first

- `plans/2026-10-15-p15-viewer.md` (D1, D3, D9) and `docs/decisions.md` (D13, D41, D42).
- `crates/rusty-ui/src/window_view/viewer/`: `kinds.rs`, `kinds/{text,hex}.rs`, `body.rs`, `files.rs`, `mod.rs`, `lister.rs`, `keys_bar.rs`, `paged/` (virtualised rows), and `tests/` (the headless pattern).
- `crates/rusty-app/src/files/` (hooks wiring).
- `~/.agents/rules/rust.md` and `code-quality.md`.
- The strict clippy config: excessive_nesting, too_many_arguments (max 4), too_many_lines, and no unwrap/expect/panic outside tests.
- Memory pitfalls:
  - register GPUI window callbacks in constructors, never in render;
  - pane-level keys are actions in a deeper key context.

## Tests (written first, Red then Green)

1. **rusty-structured:**
   - The JSON, YAML and XML tree models have correct node counts, paths and values.
   - Malformed input gives an error with line and column, and never panics.
   - The XML index over a generated 50 MB file (built in a temp dir) keeps memory bounded: assert on the index size, not on RSS. Expanding a node reads only its range.
   - CSV delimiter and header sniffing works for comma, semicolon, tab and pipe, and for quoted fields with embedded delimiters and newlines.
   - Numeric sort orders rows correctly.
2. **Kinds:** the scores pick Tree, Table or Markdown for each format and Text for plain text, and SVG stays Image when that kind exists.
3. **Headless views:**
   - F3 on JSON shows a tree; Right expands, and the header shows the path.
   - F3 on CSV shows the header row and cells; clicking a header sorts.
   - F3 on Markdown shows a rendered heading, as a text element.
   - Every read goes through the hooks on the background executor.
4. **Screenshots:** headless only, never on the owner's desktop. Save `design/screens/p15-{tree,table,markdown}-{light,dark}.png` and look at them.

## Do not touch

- The paged and editor bodies (A5b is changing them in another worktree), apart from reusing their public types.
- The image kind (A6), the archive and font kinds (A8), and encodings (A2, merged).
- `rusty-core` and `rusty-store`.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/p15-a7
cargo xtask gate > <scratch>/a7-gate.log 2>&1; echo "gate exit $?"; tail -1 <scratch>/a7-gate.log
```

It must print `gate exit 0`, and the last line must read `gate: all 9 steps passed`. Never pipe the gate.

Then commit:
- Stage files explicitly.
- End the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` only.
- Keep absolute local paths out of committed files.

## Stop if

- the markdown view cannot render at all (ship tree and table, and report);
- a format needs a C library;
- an existing test's intent would have to change.

## Report

Commit hash, keys, crates added with version, licence and size impact, the exe size before and after, files with line counts, tests, screenshot paths, gate result, and deviations.
