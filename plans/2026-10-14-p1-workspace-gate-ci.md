# P1 · Workspace, gate and CI

Status: running · Repo: `<repo>` · Branch: `p1-workspace` · Started: 2026-10-14

## Goal

The repository builds as a Cargo workspace of the eleven crates plus the gallery and `xtask`. One command, `cargo xtask gate`, runs the whole quality gate, and CI runs it on Linux and Windows for every push. Every push to `main` produces a portable `rusty.exe`.

## Decisions

Final. Workers never reopen them; a worker that finds one wrong stops and reports.

- Architecture: `docs/architecture.md`; decisions D1–D28 in `docs/decisions.md`; plan rules in `plans/README.md`.
- Rust **1.99.0**, edition **2024**, resolver 3. Latest stable versions for every tool and crate (D26).
- `xtask` uses only the standard library and `toml` + `serde` + `serde_json`; no CLI framework.
- Lints live once in `[workspace.lints]`; every crate has `[lints] workspace = true`. Crate-level `allow` needs a `reason`.
- `#![forbid(unsafe_code)]` in `rusty-core`, `rusty-store`, `rusty-cache`, `rusty-diag`, `rusty-ui`, `rusty-ui-gallery`, `rusty-plugins` and `xtask`. The Windows crates (`rusty-fs`, `rusty-index`, `rusty-shell`, `rusty-term`, `rusty-app`) may use `unsafe` with a `// SAFETY:` line.
- GitHub Actions are pinned to full commit SHAs of their latest releases.
- Licences allowed by `cargo deny`: MIT, Apache-2.0, Apache-2.0 WITH LLVM-exception, BSD-2-Clause, BSD-3-Clause, ISC, Zlib, Unicode-3.0, MPL-2.0, CC0-1.0, BSL-1.0. Anything else stops the atom.

## Components

| Component | Layer | Contract (in → out) | New / change | Test |
| --- | --- | --- | --- | --- |
| `workspace` | config | root `Cargo.toml`, toolchain, lint and tool configs | new | `cargo metadata`, `taplo check` |
| `crate-skeletons` | scaffold | eleven crates, gallery, `xtask`; `rusty --version` | new | `cargo check --workspace` |
| `xtask-size` | tooling | `&[PathBuf], Exceptions → Vec<SizeViolation>` | new | `xtask/src/size/tests.rs` |
| `xtask-coverage` | tooling | llvm-cov JSON, floors → `Vec<FloorMiss>` | new | `xtask/src/coverage/tests.rs` |
| `xtask-binsize` | tooling | file path, limit → `Result<u64, TooLarge>` | new | `xtask/src/binsize/tests.rs` |
| `xtask-gate` | tooling | options → ordered steps, run, stop on first failure | new | `xtask/src/gate/tests.rs` |
| `tool-configs` | config | `deny.toml`, nextest, typos, taplo, size exceptions, coverage floors | new | `cargo deny check`, `typos` |
| `ci` | config | `.github/workflows/ci.yml` | new | `actionlint`, a green run |
| `dev-docs` | docs | README "Develop" section, `docs/dev-tools.md` | new / change | `typos` |

## Atoms

| Atom | Component | Tier | Role | Effort | After | Check | Status | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A0 | dev tools | — | orchestrator | — | — | every tool prints `--version` | done | |
| A1 | `workspace` | T1 | patcher | medium | A0 | `taplo check` on the new files; nesting calibration | done | |
| A2 | `crate-skeletons` | T1 | patcher | medium | A1 | `cargo check --workspace`; `rusty --version` | done | |
| A3 | `xtask-size` Red | T2 | checker | medium | A2 | tests compile and fail with `not yet implemented` | done | |
| A4 | `xtask-size` Green | T3 | api-builder | xhigh | A3 | `cargo nextest run -p xtask size` passes | running | |
| A5 | `xtask-coverage`, `xtask-binsize` Red | T2 | checker | medium | A2 | tests compile and fail | done | |
| A6 | `xtask-coverage`, `xtask-binsize` Green | T3 | api-builder | xhigh | A5 | `cargo nextest run -p xtask coverage binsize` passes | done | |
| A7 | `tool-configs` | T1 | patcher | medium | A2 | `cargo deny check`; `typos` | done | |
| A8 | `xtask-gate` | T3 | api-builder | xhigh | A4, A6, A7 | gate tests pass; `cargo xtask gate` green | blocked | |
| A9 | `ci` | T2 | infra-builder | high | A8 | `actionlint` clean | blocked | |
| A10 | `dev-docs` | T1 | patcher | medium | A8 | `typos` clean | blocked | |
| G1 | gate | — | orchestrator + reviewer | high | A0–A10 | CI green on both OS, artifact runs, review approved | blocked | |

A3 and A5 can run in parallel after A2; A4 and A6 in parallel after their Red atoms; A7 in parallel with all of them.

### A0 — Install the development tools (orchestrator)

- Install the latest stable releases from official sources: `cargo install --locked cargo-nextest cargo-llvm-cov cargo-deny cargo-audit typos-cli`; `actionlint` and `taplo` from the Arch repositories.
- Record each version in the A10 brief and in the Log.
- **Check:** each tool's `--version` prints.

### A1 — Root workspace files

- **Read:** `docs/architecture.md` "Runtime and libraries" (release profile line); `plans/README.md` "Size limits".
- **Change:** create these files with exactly this content.

`Cargo.toml`:

```toml
[workspace]
resolver = "3"
members = ["crates/*", "xtask"]
default-members = ["crates/*"]

[workspace.package]
version = "0.0.1"
edition = "2024"
rust-version = "1.99"
publish = false

[workspace.lints.rust]
unsafe_op_in_unsafe_fn = "deny"
unused_must_use = "deny"

[workspace.lints.clippy]
all = { level = "deny", priority = -1 }
allow_attributes_without_reason = "deny"
dbg_macro = "deny"
excessive_nesting = "deny"
print_stderr = "deny"
print_stdout = "deny"
todo = "deny"
too_many_arguments = "deny"
too_many_lines = "deny"
undocumented_unsafe_blocks = "deny"
unwrap_used = "deny"

[profile.release]
lto = "fat"
codegen-units = 1
strip = true
panic = "unwind"
```

`rust-toolchain.toml`:

```toml
[toolchain]
channel = "1.99.0"
components = ["rustfmt", "clippy", "llvm-tools"]
```

`clippy.toml`:

```toml
too-many-lines-threshold = 50
too-many-arguments-threshold = 4
excessive-nesting-threshold = 3
allow-unwrap-in-tests = true
allow-expect-in-tests = true
```

`.cargo/config.toml`:

```toml
[alias]
xtask = "run -q -p xtask --"
```

- Add `/target` to `.gitignore` if it is missing.
- **Nesting calibration:** in a scratch crate outside the repo, with this `clippy.toml`, a function whose deepest block is 3 levels inside the body must pass `cargo clippy -- -D warnings` and one 4 levels deep must fail. If clippy counts differently, change the threshold by one so that holds, and report the value.
- **Check:** `taplo check Cargo.toml rust-toolchain.toml clippy.toml .cargo/config.toml` prints no errors. (`cargo` checks come in A2, when members exist.)
- **Stop if:** any file already exists with different content.

### A2 — Crate skeletons

Scaffold atom: it creates many small generated files, which is allowed above the three-file limit.

- **Read:** `plans/README.md` "Repository layout"; this plan's Decisions.
- **Change:**
  - `cargo new --lib --vcs none crates/<name>` for `rusty-core rusty-store rusty-fs rusty-cache rusty-index rusty-shell rusty-term rusty-plugins rusty-diag rusty-ui`.
  - `cargo new --bin --vcs none crates/rusty-ui-gallery`, `cargo new --bin --vcs none crates/rusty-app`, `cargo new --bin --vcs none xtask`.
  - In every new `Cargo.toml`: `version.workspace = true`, `edition.workspace = true`, `rust-version.workspace = true`, `publish.workspace = true`, and a `[lints]` table with `workspace = true`.
  - In `crates/rusty-app/Cargo.toml` add `[[bin]]` with `name = "rusty"` and `path = "src/main.rs"`.
  - Every `lib.rs` contains only `#![forbid(unsafe_code)]` for the crates the Decisions list, and is empty otherwise. Remove the generated sample `add` function and its test.
  - `crates/rusty-app/src/main.rs`:

```rust
#![allow(clippy::print_stdout, reason = "prints the version for --version")]

fn main() {
    println!("rusty {}", env!("CARGO_PKG_VERSION"));
}
```

  - `xtask/src/main.rs` and `crates/rusty-ui-gallery/src/main.rs`: `#![forbid(unsafe_code)]` and `fn main() {}`.
- **Check:** `cargo check --workspace --all-targets` passes; `cargo clippy --workspace --all-targets -- -D warnings` passes; `cargo run -q -p rusty-app` prints `rusty 0.0.1`.
- **Stop if:** `cargo new` changes the root `Cargo.toml` members list (it must stay `crates/*` and `xtask`).

### A3 — `xtask-size` Red

- **Read:** `plans/README.md` "Size limits"; `xtask/src/main.rs`.
- **Change:** add `xtask/src/size/mod.rs` with stubs (`todo!()` bodies) and `xtask/src/size/tests.rs`; register `mod size;` in `main.rs`.
  - `pub fn count_code_lines(source: &str) -> usize`
  - `pub struct Exception { pub path: PathBuf, pub limit: usize, pub reason: String }`
  - `pub fn parse_exceptions(toml: &str) -> Result<Vec<Exception>, SizeError>` reading `[[exception]]` tables with `path`, `limit`, `reason`.
  - `pub fn check_files(files: &[(PathBuf, String)], exceptions: &[Exception]) -> Vec<SizeViolation>`; `SizeViolation { path, lines, limit }`.
  - Default limit 400, hard ceiling 800.
- **Tests (one behaviour each):** blank lines are not counted; `//` and `///` and `//!` lines are not counted; lines inside `/* … */` (also nested) are not counted; a `"http://x"` string line is counted; a 401-line file is a violation; a 400-line file is not; an exception raises the limit for that path only; an exception above 800 is rejected by `parse_exceptions`; an exception without a reason is rejected; files named `tests.rs` and files under a `tests/` folder are skipped.
- **Check:** `cargo nextest run -p xtask size` compiles and every test fails with `not yet implemented`.
- **Stop if:** a test needs anything outside `xtask/`.

### A4 — `xtask-size` Green

- **Read:** `xtask/src/size/mod.rs`, `xtask/src/size/tests.rs`.
- **Change:** implement the four functions so every test passes. Do not edit `tests.rs`. Add `toml` and `serde` (latest) to `xtask/Cargo.toml`. Wire `cargo xtask size`: walk `crates/` and `xtask/` for `.rs` files, read `size-exceptions.toml` if present, print each violation as `path: lines > limit`, exit 1 if any.
- **Check:** `cargo nextest run -p xtask size` passes; `cargo xtask size` exits 0 on the current tree; `cargo clippy -p xtask --all-targets -- -D warnings` passes.
- **Stop if:** a test looks wrong. Report it; do not change it.

### A5 — `xtask-coverage` and `xtask-binsize` Red

- **Read:** `plans/README.md` "Test-driven" (coverage floors); `xtask/src/main.rs`.
- **Change:** add `xtask/src/coverage/{mod.rs,tests.rs}` and `xtask/src/binsize/{mod.rs,tests.rs}` with stubs.
  - `pub fn parse_floors(toml: &str) -> Result<BTreeMap<String, f64>, CoverageError>` from `[floors]` (crate name → percent).
  - `pub fn crate_line_coverage(llvm_cov_json: &str) -> Result<BTreeMap<String, f64>, CoverageError>`: groups the `data[0].files[]` entries by the `crates/<name>/` or `xtask/` prefix of `filename` and returns covered ÷ count of `summary.lines` per crate.
  - `pub fn misses(coverage: &BTreeMap<String, f64>, floors: &BTreeMap<String, f64>) -> Vec<FloorMiss>`; a crate with a floor and no data is a miss.
  - `pub fn check_size(bytes: u64, limit: u64) -> Result<u64, TooLarge>`; limit for `rusty.exe` is 30 MiB.
- **Tests:** two crates aggregate correctly from a small hand-written JSON fixture; a crate exactly at its floor passes; 0.1 below fails; a missing crate is a miss; a malformed JSON is an error, not a panic; `check_size` accepts the limit and rejects limit + 1.
- **Check:** `cargo nextest run -p xtask coverage binsize` compiles and fails with `not yet implemented`.
- **Stop if:** a test needs anything outside `xtask/`.

### A6 — `xtask-coverage` and `xtask-binsize` Green

- **Read:** the four files from A5.
- **Change:** implement; do not edit tests. Add `serde_json` (latest). Wire `cargo xtask coverage` (runs `cargo llvm-cov nextest --workspace --json --output-path target/llvm-cov.json`, then checks `xtask/coverage-floors.toml`) and `cargo xtask binsize <path>`.
- **Check:** `cargo nextest run -p xtask coverage binsize` passes; clippy clean on `xtask`.
- **Stop if:** a test looks wrong.

### A7 — Tool configs

- **Read:** this plan's Decisions (licences); `plans/README.md` "Test-driven" (floors).
- **Change:** create
  - `deny.toml`: `[licenses]` with the allowed list and `private = { ignore = true }`; `[advisories]` with yanked crates denied; `[bans]` with `multiple-versions = "warn"`; `[sources]` with unknown registries and git sources denied.
  - `.config/nextest.toml`: a `ci` profile with `fail-fast = false` and JUnit output to `target/nextest/ci/junit.xml`.
  - `typos.toml`: exclude `design/prototype/fonts/`, `design/screens/`, `*.png`, `*.ttf`.
  - `taplo.toml`: format all `*.toml`, keep key order.
  - `size-exceptions.toml`: one heading line and no entries.
  - `xtask/coverage-floors.toml`: `[floors]` with `xtask = 85` only. Each later plan adds its crate's floor (from `plans/README.md`) in its first Red atom, so an empty crate never fails the gate.
- **Check:** `cargo deny check` passes; `typos` passes; `taplo check` passes.
- **Stop if:** a dependency's licence is outside the list.

### A8 — `xtask-gate`

- **Read:** `xtask/src/main.rs`, `xtask/src/size/mod.rs` (public items), `xtask/src/coverage/mod.rs` (public items).
- **Change:** add `xtask/src/gate/{mod.rs,tests.rs}`.
  - `pub struct GateOptions { pub with_coverage: bool }` and `pub fn steps(options: &GateOptions) -> Vec<Step>`; a `Step` has a name and a command line.
  - Order: `cargo fmt --all --check`, `cargo clippy --workspace --all-targets -- -D warnings`, `taplo check`, `typos`, `cargo xtask size`, `cargo deny check`, `cargo audit`, `cargo nextest run --workspace --profile ci`, `cargo test --workspace --doc`, then `cargo xtask coverage` when `with_coverage`.
  - `cargo xtask gate [--coverage]` runs the steps in order, prints one line per step with its time, and stops at the first failure with its exit code.
- **Tests:** the order above without coverage; coverage appended last when asked; no step repeats.
- **Check:** `cargo nextest run -p xtask gate` passes; `cargo xtask gate --coverage` runs every step green on the current tree.
- **Stop if:** a step fails for a reason outside `xtask/` (report the output).

### A9 — CI workflow

- **Read:** `xtask/src/gate/mod.rs` (the step list); `plans/README.md` "Test-driven" (the Windows row).
- **Change:** create `.github/workflows/ci.yml`, triggered on push and pull request, with `concurrency` cancelling older runs of the same ref.
  - `gate-linux` (ubuntu-latest): toolchain 1.99.0 with the components, cache, tools through `taiki-e/install-action`, then `cargo xtask gate --coverage`; upload the JUnit file.
  - `gate-windows` (windows-latest): same toolchain; `cargo clippy --workspace --all-targets -- -D warnings`, `cargo nextest run --workspace --profile ci`, `cargo test --workspace --doc`.
  - `build-windows` (windows-latest, needs both gates): `cargo build --release -p rusty-app`, `cargo xtask binsize target/release/rusty.exe`, run `target/release/rusty.exe` and require `rusty 0.0.1`, upload `rusty.exe` as artifact `rusty-windows-x64-${{ github.sha }}`.
  - Every action pinned to the full commit SHA of its latest release, with the version in a trailing comment.
- **Check:** `actionlint` prints nothing.
- **Stop if:** a needed tool has no official install action or release binary.

### A10 — Developer docs

- **Read:** `README.md`; A0's tool versions (given in the brief).
- **Change:** add a "Develop" section to `README.md`: prerequisites, `cargo xtask gate`, where plans live. Create `docs/dev-tools.md` with a table of every tool and its pinned version.
- **Check:** `typos` passes.
- **Stop if:** the README has changed since this brief was written.

### G1 — Gate

1. `cargo xtask gate --coverage` locally: every step green.
2. Push `p1-workspace`; CI green on `gate-linux`, `gate-windows` and `build-windows`.
3. Download the artifact; `rusty.exe` prints `rusty 0.0.1` (the owner runs it on the work PC).
4. `reviewer` (Opus, high) on the branch against this plan: verdict approve.
5. Merge to `main`, push, log the result.

## Done when

- `cargo xtask gate --coverage` passes locally and in CI on Linux; the Windows gate passes.
- Every push to `main` uploads a `rusty.exe` under 30 MiB that prints its version.
- A file over 400 lines, a function over 50 lines, an `unwrap()` outside tests or a coverage drop each fail the gate (checked by the xtask tests and a deliberate local trial before merge).

## Log

- 2026-10-14 — Plan written. Rust 1.99.0 and `gpui-kit` 0.7.3 are the current releases.
- 2026-10-14 — A0 done. From Arch packages (already the latest releases): cargo-deny 0.20.2, cargo-audit 0.22.2, cargo-llvm-cov 0.9.1, actionlint 1.7.12, taplo 0.10.0. From crates.io with `cargo install --locked` (newer than Arch): cargo-nextest 0.9.148, typos-cli 1.51.1.
- 2026-10-14 — Outside the plan, at the owner's request: GPUI prototype of design B in three variants (`spikes/gpui-b-variants`, branch `spike/gpui-b-variants`); its findings feed P2.
- 2026-10-14 — A1 done (patcher, Haiku, medium). Calibration: clippy counts the function body as a level, so `excessive-nesting-threshold = 4` makes 3 levels pass and 4 fail; `clippy.toml` uses 4.
- 2026-10-14 — A2 done (patcher, Haiku, medium). The four crates without `forbid` have a `lib.rs` of one newline. A3, A5 and A7 start in parallel, each in its own worktree.
- 2026-10-14 — A3 done (checker, Sonnet, medium): 19 size tests, all `not yet implemented`. A5 done (checker, Sonnet, medium): 13 tests plus one the orchestrator added (a crate with zero lines counts as 100 %); only the constant test passes. A7 done (patcher, Haiku, medium): `cargo deny check`, `typos`, `taplo check` green. Merged into `p1-workspace`.
- 2026-10-14 — Before A4 and A6, the orchestrator added `toml` 1.1.8, `serde` 1.0.229 and `serde_json` 1.0.154 to `xtask`, and a `main.rs` dispatcher calling `size::run`, `coverage::run`, `binsize::run` (stubs), so the two parallel Green atoms touch disjoint files.
- 2026-10-14 — The owner overruled the tiers (D28): Haiku never implements; T1 edits now run on Sonnet 5.5 medium (A10); `rusty-core` Green atoms and the hardest atoms are done by the orchestrator on Opus 5.5 high. A1, A2 and A7 had already run on Haiku; they are config and scaffold, verified by the orchestrator, and stay.
- 2026-10-14 — A6 done (api-builder, gpt-6.1-sol, xhigh): 14 tests pass; `binsize` and `coverage` wired. Without rustup, `cargo llvm-cov` needs `LLVM_COV=/usr/bin/llvm-cov LLVM_PROFDATA=/usr/bin/llvm-profdata` locally. Open: `xtask` measured 42 % against its 85 % floor (without the `size` tests); the untested parts are the thin `run.rs` shells and `main.rs`. To settle before A8.
