# P3 · C1 brief: `command` Red

Role: `checker` (Sonnet, high). Worktree: `<worktrees>/rusty-p3-c1`, branch `p3-c1` (from `p3-core`). Do not commit; the orchestrator does.

## Goal

Write the public API of `rusty-core`'s `command` module as stubs, and the tests that define it. Stubs return `todo!()`. The tests must compile and fail because of the stubs. C2 (Opus) makes them pass without changing them.

## Read first

- `plans/2026-10-14-p3-core-model.md` (whole file) and `plans/README.md` sections "Test-driven" and "Size limits".
- `crates/rusty-core/src/` (all of it, under 150 lines): `Location`, `Direction`, ids. Use them; do not change them.
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-core/src/command/
├── mod.rs        Command, CursorMove, re-exports; `#[cfg(test)] mod tests;`
├── id.rs         CommandId
├── error.rs      ParseError, ParseErrorKind
├── parse.rs      stub: fn parse(text: &str) -> Result<Command, ParseError>
├── print.rs      stub: impl Display for Command
├── tests.rs      unit tests (or tests/ folder: tests/parse.rs, tests/print.rs, tests/props.rs …)
└── snapshots/    insta snapshots (accept them only after C2; leave them pending)
```

Add `mod command;` and `pub use command::{Command, CommandId, CursorMove, ParseError, ParseErrorKind};` to `src/lib.rs`. Touch nothing else.

## The API (exact)

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Command {
    PaneOpenTab { location: Option<Location> }, // pane.open-tab      None: duplicate the current tab
    PaneCloseTab { tab: Option<u32> },          // pane.close-tab     0-based index in the focused pane; None: current
    PaneNavigate { location: Location },        // pane.navigate
    PaneBack,                                   // pane.back
    PaneForward,                                // pane.forward
    PaneCursorMove { to: CursorMove },          // pane.cursor-move
    SelectionToggle,                            // selection.toggle        (Space)
    SelectionToggleDown,                        // selection.toggle-down   (Insert)
    SelectionRange { to: u64 },                 // selection.range         anchor ..= to
    SelectionAddPattern { pattern: String },    // selection.add-pattern
    SelectionRemovePattern { pattern: String }, // selection.remove-pattern
    SelectionInvert,                            // selection.invert
    SelectionAll,                               // selection.all
    SelectionClear,                             // selection.clear
    LayoutSplit { direction: Direction },       // layout.split   new pane on that side of the focused one
    LayoutClose,                                // layout.close
    LayoutFocus { direction: Direction },       // layout.focus
    AppSaveSession,                             // app.save-session
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CursorMove { Up, Down, PageUp, PageDown, First, Last, Row(u64) }
// keywords: up, down, page-up, page-down, first, last; Row(n) is the integer n

impl Command {
    pub fn id(&self) -> CommandId;
    pub fn parse(text: &str) -> Result<Command, ParseError>;
}
impl std::fmt::Display for Command { /* the text form */ }
impl std::str::FromStr for Command { type Err = ParseError; /* = parse */ }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CommandId { /* one variant per Command variant, same names */ }
impl CommandId {
    pub const ALL: &'static [CommandId];        // every id once, in the enum's order
    pub const fn as_str(self) -> &'static str;   // "pane.open-tab"
    pub fn from_name(name: &str) -> Option<CommandId>;
}
impl std::fmt::Display for CommandId { /* as_str */ }

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("at byte {offset}: {kind}")]
pub struct ParseError { pub offset: usize, pub kind: ParseErrorKind }

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum ParseErrorKind {
    UnexpectedEnd,                                        // offset = text.len()
    UnexpectedChar(char),                                 // offset = that char
    UnknownCommand(String),                               // offset = start of the id
    UnknownField { command: CommandId, field: String },   // offset = start of the field name
    DuplicateField(String),                               // offset = start of the second occurrence's name
    MissingField { command: CommandId, field: &'static str }, // offset = the `}`, or text.len() when there are no braces
    WrongType { field: String, expected: &'static str },  // offset = start of the value
    InvalidValue { field: String, reason: String },       // offset = start of the value (overflow, empty or NUL location, unknown keyword)
    BadEscape,                                            // offset = the backslash
    UnterminatedString,                                   // offset = the opening quote
}
// Give every variant an #[error("…")] message in plain English; C2 may not change them.
```

## Text form

```text
command := ws id ws ( "{" ws fields? ws "}" )? ws END
id      := seg "." seg          seg := [a-z][a-z0-9]* ( "-" [a-z0-9]+ )*
fields  := field ( ws "," ws field )* ( ws "," )?        trailing comma allowed
field   := name ws ":" ws value                          name := [a-z][a-z0-9-]*
value   := string | integer | keyword
string  := '"' ( any char except '"' '\' | escape )* '"'
escape  := \" | \\ | \n | \r | \t | \u{1–6 hex digits}    (a scalar value; surrogates are BadEscape)
integer := "-"? [0-9]+        must fit the field's type, else InvalidValue
keyword := [a-z][a-z0-9-]*
ws      := [ \t\r\n]*
```

- Fields may come in any order. Unknown, duplicate and missing required fields are errors. Optional fields may be absent.
- `pane.back` and `pane.back {}` both parse. Fields on a command that has none → `UnknownField`.
- `to` in `pane.cursor-move` takes a keyword or an integer. `direction` takes `left|right|up|down`. `location` and `pattern` take strings; `tab` and `to` (range) take integers.
- Printing: the id alone when there are no fields to print; else `id { a: v, b: v }` with fields in the enum's order, one space inside the braces, `, ` between fields. `None` fields are omitted.
- Strings print with `\"`, `\\`, `\n`, `\r`, `\t`, other control characters as `\u{…}` (lowercase hex, no padding); everything else (non-ASCII too) prints as is.

## Tests to write

1. **Round trip, unit:** for every `CommandId`, at least one command parses from hand-written text and prints back to its canonical form.
2. **Parsing variants:** extra whitespace and newlines, trailing comma, empty braces, fields in another order, `\u{1F4C1}` and other escapes, negative integer into an unsigned field (`InvalidValue`), `u64` overflow, a location with quotes and backslashes (`"C:\\Users\\admin\\\"x\""`).
3. **Every `ParseErrorKind`** at least once, asserting both `kind` and `offset`.
4. **Snapshots (`insta`):** one snapshot with the printed form of one example of every command (one per line); one with the `Display` text of one error per kind.
5. **`CommandId`:** `ALL` holds each variant once; `from_name(as_str())` round-trips; every name matches the `id` grammar above; `Command::id` agrees with the name used to parse it.
6. **Properties (`proptest`):**
   - for any `Command` (write a strategy; strings include quotes, backslashes, control characters, non-ASCII, emoji; never NUL in locations), `parse(&c.to_string()) == Ok(c)`;
   - printing is canonical: `parse(s)` then print, then parse and print again gives the same text;
   - `parse` never panics on any `String` input (it may return errors).

## Rules

- Tests through the public API only. One reason to fail per test, named as the behaviour.
- Stubs are `todo!()` only; no real implementation. Make the type definitions real (enums, structs, `thiserror` messages, `CommandId::ALL` and `as_str` can be real: they are data).
- Files under 400 lines (tests exempt). `cargo fmt`.

## Check

```sh
cargo nextest run -p rusty-core --no-fail-fast 2>&1 | tail -40
```

The id, direction and location tests pass; your `command` tests compile and fail with `not yet implemented` (data-only tests like `CommandId::ALL` may pass). `cargo clippy -p rusty-core --all-targets` may report only `todo` lints.

## Stop and report

Stop when the check holds. Report: files, test count by group, the check output tail, and any place where this brief is ambiguous or wrong (do not guess silently). Stop early and report if the API above cannot be written as given.
