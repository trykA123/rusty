# P8 · O1 brief: `op_plan` Red

Role: `checker` (Opus, medium; D34). Worktree: `<worktrees>/rusty-p8-o1`, branch `p8-o1` (from `p8-operate`). Do not commit; the orchestrator does.

## Goal

Every copy, move, recycle and permanent delete first builds a plan: sources, targets, conflicts, totals and risks. Only after that does anything touch the disk.

The planner is **pure data in `rusty-core`**. It never lists folders; the file-system layer scans first and passes the scan in.

Write the stubs and the tests that define the planner. O2 (orchestrator) makes them pass without changing them.

## Read first

- `plans/2026-10-14-p8-poc-operate.md`.
- `docs/architecture.md` sections "Safety" → "Destructive operations" and "Copy engine".
- `docs/decisions.md`: D7, D22 and D31 (no panics outside tests).
- `crates/rusty-core/src/location/` (`Location`, `ProviderPath`, `join`, `parent`, `same_place`); `Location` is `Serialize`/`Deserialize`.
- `~/.agents/rules/rust.md`, `code-quality.md` "Tests".

## Files

```text
crates/rusty-core/src/op_plan/
├── mod.rs        public types, plan() and is_protected() as stubs
└── tests/        mod.rs, copy.rs, move_.rs, delete.rs, conflicts.rs, risks.rs, props.rs
```

In `src/lib.rs`, add `mod op_plan;` and a `pub use` for every public item.

## The API (exact)

All the types below derive `Debug, Clone, PartialEq, Eq, Serialize, Deserialize`.

```rust
pub enum OpKind { Copy, Move, Recycle, Delete }                // Delete = permanent (Shift+Del)
pub enum ItemKind { File, Folder, Link }
pub enum ConflictPolicy { Ask, Skip, Rename, OverwriteOlder, OverwriteAll }

pub struct ScannedItem {
    pub location: Location,        // the item itself
    pub depth: u32,                // 0 for a selected item, 1 for its children, …
    pub kind: ItemKind,
    pub size: u64,                 // files only; 0 for folders and links
    pub modified_ms: Option<i64>,
}
// The scan lists each selected item, then, for a folder, its whole subtree depth-first in pre-order
// (a folder comes before its children). Links are listed but never descended into.

pub struct ExistingItem { pub location: Location, pub kind: ItemKind, pub size: u64, pub modified_ms: Option<i64> }
// What already exists at the target paths (the scanner checks only the would-be targets).

pub struct PlanRequest {
    pub kind: OpKind,
    pub items: Vec<ScannedItem>,
    pub target: Option<Location>,  // the destination folder; None for Recycle and Delete
    pub existing: Vec<ExistingItem>,
    pub policy: ConflictPolicy,
    pub same_volume: bool,         // source and target on one volume (move = rename)
    pub protected: Vec<Location>,  // extra protected folders: the user profile root, Ferrite's own folders
}

pub enum Step {
    MakeFolder { target: Location },
    CopyFile { source: Location, target: Location, size: u64 },
    Rename { source: Location, target: Location },
    Recycle { location: Location },
    RemoveFile { location: Location },
    RemoveLink { location: Location },
    RemoveFolder { location: Location },   // only after its contents, and only when it is empty by then
}

pub enum Resolution { Skip, Rename(Location), Overwrite, Ask }
pub struct Conflict { pub source: Location, pub target: Location, pub resolution: Resolution }

pub enum Risk { Permanent, Protected(Location), ManyItems(u64), Large(u64), LinksSkipped(u64) }

pub struct Totals { pub files: u64, pub folders: u64, pub bytes: u64 }

pub struct OperationPlan {
    pub kind: OpKind,
    pub steps: Vec<Step>,
    pub totals: Totals,
    pub conflicts: Vec<Conflict>,
    pub risks: Vec<Risk>,
}
impl OperationPlan { pub fn needs_confirmation(&self) -> bool; }   // any risk at all

pub fn plan(request: &PlanRequest) -> OperationPlan;
pub fn is_protected(location: &Location, extra: &[Location]) -> bool;
```

## Behaviour

- **Targets.** An item's target is `target` joined with its path relative to the parent of its depth-0 ancestor. For example, copying `C:\a\b` (a folder) with child `C:\a\b\c.txt` into `D:\x` gives `D:\x\b` and `D:\x\b\c.txt`. Build targets with `Location::join` segment by segment.
- **Copy:**
  - a folder becomes `MakeFolder`, and its children come after it;
  - a file becomes `CopyFile` with its size;
  - a link is not copied in this PoC: it is left out of the steps and counted in `Risk::LinksSkipped(n)`.
- **Move:**
  - **Same volume:** one `Rename` per depth-0 item, and nothing for its children.
  - **Across volumes:** the copy steps. Then, for every source in **reverse pre-order** (children before folders): `RemoveFile`, `RemoveLink` or `RemoveFolder`. A link's source is removed with `RemoveLink` and never followed.
- **Recycle:** one `Recycle` per depth-0 item.
- **Delete (permanent):** every item in reverse pre-order, as `RemoveFile`, `RemoveLink` or `RemoveFolder`. Always add `Risk::Permanent`.
- **Conflicts** (copy and move only): a file whose target is in `existing` is a conflict. It resolves by `policy`:
  - `Skip`: no step for that file.
  - `Rename`: the target becomes `name (2).ext`, or the first free `(n)` that is neither in `existing` nor already planned.
  - `OverwriteAll`: `Overwrite`.
  - `OverwriteOlder`: `Overwrite` when the source is newer (`modified_ms` greater), else `Skip`.
  - `Ask`: `Ask`; the step is kept, and the engine asks before running it.

  A folder whose target exists as a folder is **merged**: no `MakeFolder`, and no conflict. A folder whose target exists as a file is a conflict that resolves to `Skip` for the whole subtree, whatever the policy.

- **Same place:** copying or moving an item into the folder it is already in:
  - `Rename` and `Ask` give `name (2).ext`;
  - `Skip` skips;
  - `OverwriteOlder` and `OverwriteAll` skip, because a file is never copied onto itself.

  Use `Location::same_place`.
- **Into itself:** moving or copying a folder into itself or into its own subtree has no steps for that item and adds `Risk::Protected(item)`. Use `same_place` on the target's ancestors.
- **Totals** count what the steps will do:
  - files: `CopyFile`, plus `RemoveFile` for Delete;
  - folders: `MakeFolder` for Copy/Move, `RemoveFolder` for Delete;
  - bytes: the sum of the `CopyFile` sizes. For Delete and Recycle it is the scanned file sizes.
- **Risks** (only when they apply):
  - `ManyItems(n)` when the steps touch more than 100 items;
  - `Large(bytes)` when the bytes exceed 1 GiB (1 073 741 824);
  - `Protected(location)` for any source or target that `is_protected` reports, and for into-itself moves;
  - `Permanent` for Delete.
- **`is_protected`:**
  - drive roots (`C:\`, `D:\`);
  - UNC share roots (`\\srv\share`);
  - `C:\Windows`;
  - `C:\Program Files` and `C:\Program Files (x86)` (any drive letter, Windows case rules);
  - the Unix root `/`;
  - every location in `extra`.

  Only these exact folders are protected, not their children. For example `C:\Windows\System32\x.dll` alone is not.

## Tests to write

- **Copy:**
  - one file;
  - a folder with nested files, checking the step order and targets;
  - a link skipped and counted;
  - totals.
- **Move:**
  - same volume gives one rename per top item;
  - across volumes gives copy, then remove in reverse order;
  - a link is removed as a link.
- **Recycle and Delete:**
  - steps;
  - reverse order;
  - `Permanent`.
- **Conflicts:**
  - each policy;
  - `(2)` and `(3)` naming;
  - a folder merge;
  - a folder onto a file;
  - the same-place copy.
- **Risks:**
  - 101 items;
  - more than 1 GiB;
  - each protected kind;
  - `extra`;
  - into itself;
  - `needs_confirmation`.
- **Property (`proptest`):** for random trees (up to 40 items, depth up to 4) and each `OpKind`:
  - the totals equal the counts over the steps;
  - every `RemoveFolder` comes after every step inside that folder;
  - every `MakeFolder` comes before every step inside it;
  - the plan round-trips through `serde_json`.

## Rules

- Stubs are `todo!()` only; the types are real. One reason to fail per test. Files under 400 lines; tests are exempt. Run `cargo fmt`.
- Run `export CARGO_TARGET_DIR=<targets>/rusty-p8-o1`.
- Lint with `cargo clippy -p rusty-core --all-targets -- -A clippy::todo -A dead_code`.
- Delete any `proptest-regressions/` your runs create.
- `typos` runs in the gate. Change any flagged test string; never add exceptions.

## Check

```sh
cargo nextest run -p rusty-core op_plan --no-fail-fast 2>&1 | tail -20
```

## Stop and report

Report:
- the files, the test count by group and the check tail;
- every ambiguity in this brief, with the decision you took.
