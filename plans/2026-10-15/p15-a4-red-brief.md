# P15 · A4 Red brief: rule lexer and Notepad++ UDL import (D6, second half)

Role: `checker` (Opus 5.5, medium). Worktree: `<worktrees>/rusty-p15-a4`, branch `p15-a4` (from `main`). You write the **failing tests** and a compiling stub. The orchestrator writes the real code (Green) afterwards. Commit on this branch; never push.

## Goal

Languages without a tree-sitter grammar still get colours. A small line-based lexer runs from rules:
- rules written in TOML (Ferrite's own format);
- rules imported from Notepad++ UDL XML files, so the community's ~400 UDLs work.

Built-in rule sets ship for m4, OSEK OIL and ETAS DCM. Later, the editor and the paged viewer use the lexer (Green wires that; not your part).

## Decided shape

A new pure crate `crates/rusty-syntax` (no GPUI, no I/O except the one folder loader). Workspace lints apply. Dependencies: `serde`, `toml`, `quick-xml`, `thiserror` (use the workspace's existing versions where they exist).

```rust
pub enum TokenKind {
    Keyword, Type, Function, Constant, Attribute, Tag, Property, Variable, // keyword groups 1–8
    Comment, String, Number, Operator, Delimiter,
}
impl TokenKind { pub fn highlight_name(self) -> &'static str }
// Must return names gpui-component knows: keyword, type, function, constant, attribute, tag,
// property, variable.special, comment, string, number, operator, punctuation.delimiter.

pub struct Token { pub range: std::ops::Range<usize>, pub kind: TokenKind } // byte range in the line

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum LineState { #[default] Normal, Block(u16), Delimited(u16) } // index of the open block comment or delimiter; u16 (review), an index past u16::MAX does not carry

pub struct Language {
    pub name: String,
    pub extensions: Vec<String>,           // lower case, without the dot
    pub case_ignored: bool,
    pub keywords: Vec<KeywordGroup>,
    pub line_comments: Vec<String>,
    pub block_comments: Vec<(String, String)>,
    pub delimiters: Vec<Delimiter>,         // strings and other delimited spans
    pub operators: Vec<String>,
    pub numbers: bool,                      // the built-in number rule
}
pub struct KeywordGroup { pub kind: TokenKind, pub words: Vec<String>, pub prefix: bool }
pub struct Delimiter { pub open: String, pub close: String, pub escape: Option<char>, pub multiline: bool, pub kind: TokenKind }

pub fn lex_line(lang: &Language, line: &str, state: LineState) -> (Vec<Token>, LineState);

pub fn from_toml(src: &str) -> Result<Vec<Language>, RulesError>;
pub fn from_udl(xml: &str) -> Result<Vec<Language>, RulesError>;   // one file may hold several <UserLang>
pub fn builtin() -> Vec<Language>;                                  // m4, oil, dcm

pub struct Registry { /* … */ }
impl Registry {
    pub fn builtin() -> Self;
    pub fn load_dir(&mut self, dir: &std::path::Path) -> Vec<LoadError>; // *.toml and *.xml; a bad file is reported, the rest still load; same name replaces
    pub fn for_name(&self, file_name: &str) -> Option<&Language>;       // by extension, case-insensitive
    pub fn get(&self, name: &str) -> Option<&Language>;
}
```

You may add fields or rename things if a test shows the shape is wrong; report every change.

### Lexer rules

- Tokens are ordered, non-overlapping, and lie on UTF-8 char boundaries. Text with no token gets none (the caller fills the gaps).
- Precedence at a position: an open block comment or delimiter carried in `state`, then line comment, then block comment open, then delimiter open, then number, then keyword, then operator.
- Keywords match whole words only. Word characters are alphanumerics and `_`. `case_ignored` makes keywords case-insensitive. A `prefix` group matches any word that starts with a listed keyword.
- A block comment or a `multiline` delimiter left open at the end of the line returns `Block(i)` or `Delimited(i)`, and the next line continues it.
- A non-multiline delimiter that is not closed ends at the end of the line and returns `Normal`.
- An escape character before the close does not close the delimiter.
- Numbers: decimal, `0x` hex, `0b` binary, decimals with a point or exponent, and an optional suffix (`u`, `l`, `f`). A digit inside a word (`x1`) is not a number.
- The lexer runs in linear time; a 1 MB line must lex in well under a second in a test.

### UDL 2.1 mapping (verify against the Notepad++ user manual, UDL chapter: https://npp-user-manual.org/docs/user-defined-language-system/, and real files from https://github.com/notepad-plus-plus/userDefinedLanguages)

- `<UserLang name ext>`: `ext` is a space-separated list.
- `<Settings><Global caseIgnored>`: `"yes"` makes keywords case-insensitive.
- `<Prefix KeywordsN="yes">`: sets `prefix` on group N.
- `<Keywords name="Comments">` uses the `00`–`04` codes: 00 line-comment open, 01 line continue, 02 line close, 03 block open, 04 block close. Several values of one code are separated by spaces.
- `Keywords1`–`Keywords8` become the eight keyword groups. Words in `"double quotes"` may contain spaces.
- `Operators1` holds operators separated by spaces. `Operators2` holds operators that need spaces around them; treat both as operators.
- `Delimiters` uses the codes `00`–`23`: for delimiter group *i* (0–7), `3i` is open, `3i+1` the escape and `3i+2` the close. Groups with an empty open are skipped.
- `Numbers, prefix1`, `Numbers, extras1` and the like may be ignored, but they must not break parsing.
- Styles and folding are ignored.
- Malformed XML or a missing name gives a `RulesError` that says what is wrong.

## Tests to write (all must fail on the stub, for the right reason)

Put them in `crates/rusty-syntax/src/**/tests.rs` (or `tests/`), following the repo's test layout. Use `insta` snapshots only where a table of tokens is clearer than asserts.

1. `TokenKind::highlight_name` returns only names from the list above.
2. TOML: a full language parses; missing `name` errors; unknown keys error (follow how `rusty-store` settings handles unknown keys).
3. UDL:
   - a realistic multi-group UDL 2.1 file (write one, modelled on a real community file) maps every field above;
   - a file with two `<UserLang>` gives two languages;
   - quoted multi-word keywords work;
   - malformed XML errors.
4. Lexer, one test per rule above:
   - whole-word keywords (`if` matches in `if x`, not in `gift`), with and without case-insensitivity;
   - prefix groups;
   - each comment kind, and a block comment that spans three lines with state carried;
   - delimiters with an escape, unterminated single-line delimiters, multiline delimiters;
   - number forms and `x1`;
   - operators;
   - precedence (`//` inside a string is not a comment; `"` inside a comment is not a string);
   - non-ASCII text (`ä`, `日本`, emoji) gives char-boundary ranges;
   - output is ordered and non-overlapping (a `proptest` over random lines and rules is welcome);
   - a 1 MB line lexes under one second.
5. Built-ins: `builtin()` has m4, oil and dcm. For each, a short real-looking sample gives the expected kinds:
   - m4: `define`, `dnl` comments, `` `quotes' ``;
   - OIL: `CPU`, `TASK`, `ALARM`, `/* */` and `//` comments, `TRUE`/`FALSE`;
   - DCM: `KONSERVIERUNG_FORMAT`, `FESTWERT`, `KENNLINIE`, `WERT`, `END`, `*` line comments, numbers.
6. Registry:
   - `for_name("Board.OIL")` finds oil;
   - `load_dir` on a temp folder with one good TOML, one good UDL and one broken file loads two languages and reports one error naming the broken file;
   - a user file with an existing name replaces the built-in one.

## Stub

Make the crate compile with the API above: functions return empty vectors, `Normal`, or a `RulesError`. The workspace lints deny `todo!`, `unimplemented!`, `panic!`, `unwrap` and `expect`, so return values instead.

## Check

```sh
export CARGO_TARGET_DIR=<targets>/p15-a4
cargo test -p rusty-syntax --no-fail-fast > <scratch>/a4-red.log 2>&1; echo $?
```

It must exit non-zero, and every new test must fail by assertion, not by a compile error or a panic in the stub. Also run `cargo clippy -p rusty-syntax --all-targets -- -D warnings` (it must pass) and `cargo fmt --check`.

Commit the crate (stub + tests) with a message that starts `syntax: Red tests for the rule lexer and UDL import (P15 A4)`. It ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` only. No absolute local paths in committed files.

## Do not touch

Anything outside `crates/rusty-syntax`, except `Cargo.lock`. A3 (grammars and detection) and A5 (search and marks) run in parallel in other worktrees.

## Report

Commit hash, test count by group, the failing-test summary (names and the assertion that fails), every API change you made and why, and the UDL facts you verified (with links).
