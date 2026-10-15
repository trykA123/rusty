# P6 · F5 brief: hostile-name corpus

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p6-f5`, branch `p6-f5` (from `p6-fs`). Do not commit; the orchestrator does.

## Goal

Write the corpus of hostile file names that every provider must survive. Then write the tests that run it against `FakeFs` and against the text form of `ProviderPath`.

The local provider (F6–F8) reuses the corpus on real disks, on Linux and Windows. So each name says on which systems it can exist.

This atom writes the fixture and its tests. Tests on `FakeFs` should pass. A test that fails shows a defect in `rusty-core` or `FakeFs`. Keep that test as it is and report it; do not fix product code.

## Read first

- `plans/2026-10-14-p6-locations-fs.md` (whole); `docs/decisions.md` D21.
- `crates/rusty-core/src/location/path.rs` (`ProviderPath`, the plane-16 escapes) and `location/mod.rs`.
- `crates/rusty-fs/src/` (`provider`, `fake` and their tests; reuse the helpers in `fake/tests/mod.rs` where they fit).
- `~/.agents/rules/rust.md`, `~/.agents/rules/code-quality.md` "Tests".

## Files you create

```text
crates/rusty-fs/src/hostile_names/
├── mod.rs     the corpus (public, compiled always; no test-only cfg, F6 uses it from src/local tests)
└── tests.rs
```

Add `pub mod hostile_names;` to `src/lib.rs`. Keep `#![forbid(unsafe_code)]`.

## The API (exact)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Family { Unix, Windows }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostileName {
    pub label: &'static str,       // unique, snake_case, says what it is: "lone_high_surrogate"
    pub name: ProviderPath,        // one path segment; never empty, never NUL, never '/'
    pub unix: bool,                // can exist on Linux ext4/btrfs
    pub windows: bool,             // can exist on NTFS through a \\?\ path
}

pub fn corpus() -> Vec<HostileName>;
pub fn for_family(family: Family) -> Vec<HostileName>;   // corpus() filtered by the flag
pub fn long_path_segments() -> Vec<ProviderPath>;      // folder names whose joined length passes 260 UTF-16 units: 6 × 60 ASCII chars
```

## What the corpus holds (at least one name each)

- **Length:**
  - a 255-character ASCII name (both systems);
  - 255 UTF-16 units of `é`. This is Windows only, since it is 510 bytes in UTF-8.
- **Invalid UTF-16** (Windows only): a lone high surrogate, a lone low surrogate, a reversed pair and a surrogate between letters. Build them with `ProviderPath::from_wide`.
- **Invalid UTF-8** (Unix only): `0xFF`, the overlong `0xC0 0xAF`, a truncated 3-byte sequence and a Latin-1 `café`. Build them with `ProviderPath::from_bytes`.
- **Reserved DOS names** (both systems; Windows creates them through `\\?\`): `CON`, `nul`, `AUX.txt`, `COM1`, `LPT9.log` and `COM¹`.
- **Trailing and leading characters** (both systems): `name.`, `name `, `name. .`, ` name`, `.hidden`, `-rf`, `...`.
- **Characters that are illegal on Windows** (Unix only): `a:b`, `a\b`, `a*b`, `a?b`, `a<b>c`, `a|b`, `a"b`, a control character `\x01` and a newline.
- **Case:** `Readme.md` (both), and `README.md` in the same folder (Unix only, because NTFS folders are case-insensitive).
- **Unicode** (both systems):
  - NFC `é` and NFD `e` + U+0301 as two different names;
  - an emoji with a ZWJ sequence;
  - the right-to-left override U+202E;
  - a zero-width space;
  - CJK, Greek final sigma, Turkish dotless `ı`, full-width letters and `ß`.
- **Escape collisions** (both systems): names that already hold characters from the text-form escape ranges U+100000–U+1008FF:
  - one such character alone;
  - one between ASCII letters;
  - one of each range together.
- **Separators in display:** `%2F` and a name with U+2215 (division slash). Both systems.

Each label is unique. Every name is a single segment: no `/` and no NUL. For the Windows-legal names, also no `\` and none of the Windows-illegal characters. Write tests for these invariants.

## Tests to write

1. **Invariants:**
   - labels are unique;
   - names are unique;
   - every name is non-empty, without NUL and without `/`;
   - names with `windows: true` have no `\ : * ? " < > |` and no character below 0x20;
   - names with `unix: true` have a byte form (`to_bytes()` is `Some`) of at most 255 bytes;
   - names with `windows: true` have a UTF-16 form (`to_wide()` is `Some`) of at most 255 units;
   - `for_family` filters correctly;
   - the joined `long_path_segments` pass 260 UTF-16 units.
2. **Fake round trip:** add every corpus name to one `FakeFs` folder with `add_entry` (files and folders mixed). List the folder and get every name back byte-for-byte, in insertion order. `metadata` of each child also returns the name unchanged.
3. **Text form:** for every corpus name, `ProviderPath::from_text(&name.to_text()) == name`. A `Location` built with `Location::with_provider` on `fake` from a parent text plus the name's text form survives `Location::new(loc.as_str())`.
4. **Display:** `display()` of every name is non-empty and holds no NUL.

## Rules

- No `unwrap` or `expect` in `mod.rs` (D31). Tests may use them.
- Files under 400 lines; tests are exempt. Functions under 50 lines: split the corpus by family into small functions. Run `cargo fmt`.
- Run `export CARGO_TARGET_DIR=<targets>/rusty-p6-f5`.
- `typos` runs in the gate. If a test string trips it, change the string; do not add exceptions.

## Check

```sh
cargo nextest run -p rusty-fs --no-fail-fast 2>&1 | tail -30
cargo clippy -p rusty-fs --all-targets -- -D warnings 2>&1 | tail -5
```

## Stop and report

Report:
- the files, the corpus size per family, and the test count by group;
- the check output tail;
- **every failing test, with the label of the name and the exact wrong value.** I expect the escape-collision names to fail the text-form round trip; confirm or refute it;
- every ambiguity or error in this brief, with the decision you took.
