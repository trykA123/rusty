# P16 · Automotive pack: viewers for embedded and vehicle-network files

Status: planned (after P15 A1) · Repo: `<repo>` · Branch: `p16-automotive` · Started: —

## Goal

The owner works in automotive and opens large embedded and vehicle-network files every day ("m-ar ajuta si extensii pentru mamutii astia… .map, .hex, .elf"). After P16, F3 shows the meaning of these files, not just their bytes:
- memory maps of HEX and S-record images;
- the sections and symbols of an ELF;
- who uses the flash in a linker map;
- the signals in a DBC or A2L;
- a CAN trace as a filterable table.

Every view works on files of hundreds of MB without freezing. This is Ferrite's first real module pack ("Automotive", D13), built on P15's viewer kinds.

Input: the crate research of 2026-10-15 (summary under Decisions).

## Decisions

- **D1 — One module, "Automotive".** It registers viewer kinds and languages, and can be turned off like any module. Each kind sniffs by extension and content, so `.hex` that is really Intel HEX opens here, and anything else falls back to text or hex.
- **D2 — Intel HEX and Motorola S-record** (`.hex`, `.ihex`, `.s19`, `.s28`, `.s37`, `.srec`, `.mot`, `.sx`). Our own streaming parser (the format is simple, and the existing crates are from 2020). The view shows:
  - record counts by type;
  - contiguous address ranges and gaps (a memory-map bar);
  - the start address;
  - checksum errors with line numbers;
  - overlaps and a missing EOF record.

  A hex view on real addresses fills the gaps with `--`. The same image can be exported as a `.bin` later.
- **D3 — ELF** (`.elf`, `.axf`, `.out`), with `object` and `gimli` over a memory map. The view shows:
  - the header;
  - sections (address, size, flags);
  - LOAD segments;
  - a searchable and sortable symbol table (value, size, type, bind, section);
  - totals of flash and RAM used;
  - with DWARF, the source file and line for a symbol or address (`addr2line`).
- **D4 — Linker maps** (`.map`). One parser per toolchain feeds a common model: memory regions (origin, length, used, free), output sections, per-object contributions, symbols and discarded sections. Order: GNU ld, IAR, TASKING, Green Hills, Wind River Diab, armlink. The text view keeps colours; the summary view answers "who uses the flash" with a sortable table.
- **D5 — Calibration and description files.**
  - **A2L.** `a2lfile` reads it. Collapsible `/begin` and `/end` blocks; MEASUREMENT and CHARACTERISTIC tables (address, type, conversion, unit); IF_DATA (XCP and CCP).
  - **DCM and PAR.** Rule-lexer colours.
  - **CDFX.** XML tree.
- **D6 — Networks and diagnostics.**
  - **DBC.** `can-dbc` reads it. Tables of nodes, messages (hex ID, DLC, cycle time) and signals (start bit, length, byte order, factor, offset, range, unit), plus value tables.
  - **LDF.** `lin-ldf` reads it. Nodes, frames, signals and schedules.
  - **ARXML.** The P15 streaming XML tree, with an AUTOSAR package-path breadcrumb. `autosar-data` is used only if a 100 MB benchmark shows it is fast enough.
  - **ODX, CDD and CDFX.** XML tree. `.pdx` opens as an archive.
- **D7 — Bus logs and measurements.**
  - **Formats.** Vector ASC and PEAK TRC (our own text parsers); BLF (`ablf`, streaming); MDF4 (`mf4-rs` or `falcon_mdf`, memory-mapped, after a benchmark).
  - **CAN logs** are a virtualised table: time, channel, ID, DLC, data, direction, error frames. Filtering is by ID, with per-ID counts and bus load. Follow mode works on growing ASC and TRC logs.
  - **MDF4** lists channel groups and channels (unit, sample count). Plots come later.
- **D8 — Scripts and sources.**
  - **Tree-sitter grammars:** TRACE32 `.cmm` (`tree-sitter-t32`), GNU linker scripts (`tree-sitter-linkerscript`) and assembly (`tree-sitter-asm`).
  - **Rule lexer:** IAR, NXP and TASKING linker scripts (`.icf`, `.lcf`, `.lsl`), OSEK `.oil` and `.m4`.
- **D9 — VBF.** A small own parser: header fields, then the blocks shown as hex on real addresses.
- **D10 — Performance contract.** Every view opens a 500 MB file within 1 s to first content and stays under 200 MB of memory. Indexes are built in the background with progress, and only the visible part is decoded. Each format gets a benchmark fixture in CI.

- **D11 — Layout: direction B, "inspector" (owner, 2026-10-19).** From the Opus prototype (`<worktrees>/prototypes/automotive/opus`, shots `B-*`): a navigator on the left (ranges, sections, messages or IDs with counts), the content in the middle (hex on real addresses, symbol or signal table, virtualised trace), an inspector on the right for the selected item (size, position, records by type, checks, decoded signals). Text, hex and the rich view stay on Alt+1/3/5.
- **D12 — Simple by default, rich parts opt-in (owner, 2026-10-19).** The owner wants a calm default and full control over the rich parts. The rich view opens in **Simple** mode: navigator as a plain list (name, address, size), content, a one-line status with the checks (checksum errors, EOF, gaps) and no charts. Each rich part is a setting under `[automotive.view]` in `ferrite.toml`, live like every setting, and shown as a toggle group in the settings sheet's Automotive section:
  - `inspector` — the right-hand panel (default off);
  - `memory_strip` — the address-map strip beside the navigator and the position bar (default off);
  - `charts` — bars, sparklines, bus load and signal curves, wherever they appear (default off);
  - `row_bars` — the per-row bars and counts in the navigator (default off);
  - `preset = "simple" | "rich" | "custom"` sets all four at once; changing one toggle makes it `custom`.
  
  In the viewer, `Ctrl+I` shows or hides the inspector for this file only, without changing the setting. Every part works with every combination; the Simple layout is designed and screenshot-tested first, Rich second.

## Atoms (cut into Red/Green pairs when P15 A1 lands)

| Atom | What | Role |
| --- | --- | --- |
| B1 | Module "Automotive", sniffers and file associations | orchestrator |
| B2 | HEX and S-record parser and memory map (D2) | Red checker, Green orchestrator |
| B3 | ELF sections, segments, symbols and DWARF lines (D3) | Red checker, Green general-purpose (Opus medium) |
| B4 | Linker map model and GNU ld parser (D4), then IAR, TASKING, GHS, Diab and armlink | Red checker, Green general-purpose |
| B5 | A2L and DBC tables, LDF (D5, D6) | Red checker, Green general-purpose |
| B6 | ASC, TRC and BLF CAN table with filter and follow (D7) | Red checker, Green orchestrator |
| B7 | MDF4 channel browser (D7) | general-purpose |
| B8 | ARXML breadcrumb and benchmark; ODX, CDD, CDFX and PDX wiring (D6) | general-purpose |
| B9 | Grammars and rules for `.cmm`, linker scripts, assembly, `.oil`, `.m4`, DCM/PAR; VBF (D8, D9) | general-purpose |
| B10 | Benchmarks (D10), UI for the summary views | ui-builder-high |
| B11 | Review | reviewer |

## Done when

- A 50 MB S19 file shows its address ranges and any checksum error in under 1 s.
- An ELF shows sorted symbols, and a GNU ld `.map` shows flash use per object.
- A DBC lists messages and signals, and an ASC trace filters by ID.
- A 300 MB ARXML opens as a navigable tree.
- The whole pack turns off in settings.
- The gate, Windows CI and the reviewer are green.

## Log

- 2026-10-19 — Owner picked direction B (inspector) from the Opus prototypes and asked for a simple default with every rich part switchable in settings (D11, D12).
