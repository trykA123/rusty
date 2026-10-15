# P5 · G5 fixes, Red brief: privacy leaks found in review

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p5`, branch `p5-diag`. Do not commit; the orchestrator does. Do not change product code (`src/**/*.rs` outside `tests/` folders and `#[cfg(test)]` modules).

## Goal

The G5 review found that file names and parts of user names reach logs and the report. Write one failing test per finding, so the orchestrator's fixes (Green) are proven. Each test fails today for exactly the reason named, and passes once the decided behaviour below holds.

## Read first

- `plans/2026-10-14-p5-diagnostics.md` (whole).
- `crates/rusty-diag/src/redact/` (`text.rs`, `path.rs`, `names.rs`, `mod.rs`), `log_layer/` (`visitor.rs`, `path_check.rs`), `report/` (`document.rs`, `mod.rs`), and their existing tests.

## Decided behaviour, one test group each

1. **A file name ends at its last extension word.** In free text, a path's last segment runs to the last word in that segment whose extension is on the allow-list (finding 2). Before that word, words with dots do not end it.
   - `failed D:\Clients\Report 2024.03 Acme Merger.pdf` keeps none of `Report`, `2024`, `03`, `Acme` or `Merger`.
   - `C:\x\v1.2 final draft for Bob.docx` keeps neither `final` nor `Bob`.
   - Existing tests on ends at quotes, angle brackets and hard boundaries must still hold.
2. **Allow-listed extensions only.** A file token keeps its extension only when the extension, in lower case, is on a fixed allow-list of common file types. Otherwise the token has no extension.
   - With user `john.smith`: `open D:\backup\john.smith` and `\\fs01\home$\john.smith` hold no `smith`, in any case.
   - `D:\Contacts\Jane.Doe` holds no `doe`.
   - `D:\a\report.PDF` still gives a token ending in `.pdf`.
   - `path_check` (`is_extension`) follows the same list: a `RedactedPath` with a non-listed extension is not accepted as redacted.
   - The list, for the tests to reference through a `pub(crate)` constant the orchestrator will add, named `ALLOWED_EXTENSIONS` in `redact/path.rs`: txt pdf doc docx xls xlsx xlsm csv ppt pptx odt ods odp rtf md log json xml yaml yml toml ini cfg html htm css js ts rs py ps1 bat cmd sh sql db sqlite zip 7z rar tar gz iso exe dll msi lnk png jpg jpeg gif bmp svg webp ico tif tiff mp3 wav flac mp4 mkv avi mov eml msg pst ost tmp bak.
   - Since the constant does not exist yet, your tests do not refer to it. Pick extensions from the list by hand.
3. **Forward-slash UNC paths.**
   - `open //fileserver01/finance/Payroll Q3.xlsx` holds none of `fileserver01`, `finance`, `Payroll` or `Q3`.
   - `parse_root` reads `//server/share/x` as UNC.
   - A URL `https://example.com/a` is not touched; `//` after `:` is not a path start.
4. **Name-carrying log fields.** These fields need a `RedactedPath`, like `path` today; a plain string in them is dropped and counted as a redaction miss:
   - exact names: `file`, `folder`, `dir`, `name`, `src`, `dst`, `dest`, `from`, `to`;
   - suffixes: `*_file`, `*_dir`, `*_name`.
   - `info!(file = "Secret Plan.docx", "x")` leaves no `Secret` in the ring and counts one miss.
5. **Quoted fragments in free text become `<text:N chars>`.** In log messages and in report free text (settings keys and values, error `operation` and `detail`), every fragment in `'…'`, `"…"` or `“…”` that is not already a redaction token becomes `<text:N chars>`. N is its length in chars.
   - `cannot rename 'Secret Plan.docx'` becomes `cannot rename '<text:16 chars>'`, quotes kept.
   - Add a needle `Secret Plan.docx` (no canary marker) to the report canary and to the log canary, used in quotes.
6. **Report events stay JSON.** In `report/document.rs`, a ring line is parsed first. Then each string value in it is redacted, recursively. The whole line is redacted as text only when it does not parse.
   - A ring line holding `open D:\<d:d903>\<f:7b6a>.txt` (already redacted, JSON-escaped) lands in `recent_events` as an object, with the same message string.
   - A line with a UNC root `\\<server:1>` decodes to `\\<server:1>`.
7. **Shares.**
   - `open \\fs01\finance$\a.txt then share finance$ was slow` holds no `finance$` anywhere.
   - Shares get `<share:N>`.
8. **Unix paths outside the profile.** A `/` at the start of the text, or after whitespace, `=` or a quote, starts a path. `/mnt/data/Medical Records/scan.pdf` holds neither `Medical` nor `scan`. `a/b` and `1/2` inside words are not touched.
9. **Debug-formatted query fields.** `query = ?"abc"` gives `<text:3 chars>`.
10. **Report writing:**
    - writing to an existing file fails with `AlreadyExists` and leaves the file byte-for-byte unchanged;
    - when the temp name `<name>.<pid>.tmp` already exists, a failed write leaves that file in place;
    - when the rename fails (for example the destination is an existing directory), no `.tmp` file is left.
11. **Property gaps:** in `redact/tests/props.rs`:
    - add `.` and digit-dot-digit words to the segment alphabet;
    - add an unwrapped case: a path followed by a space and trailing text;
    - assert that no segment text survives.

## Rules

- One reason to fail per test. Name tests by behaviour. Put them in the existing test files next to the code they cover, or in new files in the same `tests/` folder.
- Use `admin` and made-up names; never real people.
- `export CARGO_TARGET_DIR=<targets>/rusty-p5-red`. Delete any `proptest-regressions/` your runs create.
- `typos` runs in the gate. Change a flagged test string; do not add exceptions.

## Check

```sh
cargo nextest run -p rusty-diag --no-fail-fast 2>&1 | tail -40
cargo clippy -p rusty-diag --all-targets -- -D warnings 2>&1 | tail -5
```

## Stop and report

Report:
- each new test name with its group number, and whether it fails now;
- **every new test that passes already**, which means either the finding was wrong or the test misses it. Say which;
- the check output tail and any brief ambiguity, with the decision you took.
