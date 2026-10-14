# P3 · Core model

Status: drafting (briefs get exact `Read` ranges when G2 passes) · Branch: `p3-core` · After: G2

## Goal

`rusty-core` holds Rusty's whole model as pure, tested Rust: typed commands that round-trip through text, the layout tree, windows, panes and tabs with history, Total Commander selection, and `apply()` that changes state only through commands. Recorded command streams replay to the same state.

## Decisions

- D6 (one command system), D15 (selection model), D21 (serialisable commands, record and replay, multi-window state). No I/O in this crate.
- `apply(state, command) -> Result<Effects, CommandError>`; effects are data (`ListFolder { pane, location }`, `SaveSession`), run later by the runtime.
- Command text form: `name { field: value }`, parsed and printed by one module; ids are kebab-case with a dot (`pane.open-tab`).
- Panes hold a `Location` placeholder type from this plan; P6 replaces its inside, not its name.
- Coverage floor `rusty-core = 90` is added to `xtask/coverage-floors.toml` in C1.

## Components

| Component | Layer | Contract | Test |
| --- | --- | --- | --- |
| `command` | lib | `Command` enum ↔ text; `CommandId` | unit + `insta` snapshots + proptest round-trip |
| `layout` | lib | split tree: split, close, focus by direction, swap, resize | proptest: tree stays valid, one focused leaf, never empty |
| `state` | lib | `AppState { windows, panes, tabs, history }`, ids as newtypes | unit |
| `selection` | lib | TC model: toggle, insert-and-move, range, by pattern, invert, clear | unit + proptest |
| `apply` | lib | `apply(&mut AppState, Command) -> Result<Effects, CommandError>` | unit per command + proptest: invalid commands never change state |
| `replay` | lib | `CommandLog` (versioned) → replay from an initial state | snapshot + proptest: replay(record(s)) == s |

## Atoms

| Atom | Component | Tier | Role | Effort | After | Check |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | `command` Red | T2 | checker | high | G2 | tests compile, fail |
| C2 | `command` Green | T4 | orchestrator | high | C1 | `cargo nextest run -p rusty-core command` |
| C3 | `layout` Red | T2 | checker | high | G2 | tests compile, fail |
| C4 | `layout` Green | T4 | orchestrator | high | C3 | `… layout` |
| C5 | `state` Red | T2 | checker | high | C2, C4 | tests compile, fail |
| C6 | `state` Green | T4 | orchestrator | high | C5 | `… state` |
| C7 | `selection` Red | T2 | checker | high | C6 | tests compile, fail |
| C8 | `selection` Green | T4 | orchestrator | high | C7 | `… selection` |
| C9 | `apply` Red | T2 | checker | high | C6, C8 | tests compile, fail |
| C10 | `apply` Green | T4 | orchestrator | high | C9 | `… apply` |
| C11 | `replay` Red | T2 | checker | high | C10 | tests compile, fail |
| C12 | `replay` Green | T4 | orchestrator | high | C11 | `… replay` |
| G3 | gate | — | orchestrator + reviewer | high | C1–C12 | `cargo xtask gate --coverage`; CI green; review |

C1–C2 and C3–C4 run in parallel.

### Briefs (outline)

- **C1/C2:** `Command` covers the PoC set: `pane.open-tab`, `pane.close-tab`, `pane.navigate`, `pane.back`, `pane.forward`, `pane.cursor-move`, `selection.*`, `layout.split`, `layout.close`, `layout.focus`, `app.save-session`. Parsing errors carry the position. Unknown fields are errors.
- **C3/C4:** binary split tree with ratios; closing a leaf merges its sibling; focus moves by direction using the geometry of the ratios; the last leaf cannot close.
- **C5/C6:** ids are newtypes over `u64` from one counter; history is bounded (100 per tab); tabs keep cursor and scroll per location.
- **C7/C8:** selection works on row indices of the current listing: Space toggles the cursor row, Insert toggles and moves down, range from the anchor, pattern with `*` and `?` (case-insensitive), invert, clear. Space on a folder also emits a "measure folder" effect.
- **C9/C10:** one handler per command, each ≤ 30 lines; validation before any change, so a failed command leaves the state untouched (proptest).
- **C11/C12:** the log stores the initial state version and commands with relative times; a log from a newer version is refused with a clear error.

## Done when

- Every PoC command is typed, round-trips through text and changes state only through `apply()`.
- Replaying a recorded log gives the same state, checked by proptest.
- `rusty-core` coverage ≥ 90 %.
