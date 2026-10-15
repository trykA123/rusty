#[path = "report/heap.rs"]
mod heap;

use std::{hint::black_box, time::Instant};

use fuzzy_bench::{
    FOLDER_COUNT, NAME_COUNT, QUERIES, SEED, TOP_COUNT,
    corpus::{QUALITY_CASES, fingerprint, generate},
    matching::{Engine, NucleoIndex},
};

#[global_allocator]
static ALLOCATOR: heap::CountingAllocator = heap::CountingAllocator;

const SAMPLES: usize = 3;

fn main() {
    let started = Instant::now();
    assert_eq!(generate(256, SEED), generate(256, SEED));
    assert_ne!(generate(256, SEED), generate(256, SEED + 1));
    assert_eq!(QUERIES.map(|query| query.chars().count()), [1, 3, 8]);
    let (names, raw_usage) = heap::measure(|| generate(NAME_COUNT, SEED));
    assert_eq!(names.len(), NAME_COUNT);
    let (index, index_usage) = heap::measure(|| NucleoIndex::new(&names));
    print_corpus(&names);
    println!(
        "\nTiming: median of {SAMPLES} fresh-query samples after one warm-up; preparation excluded."
    );
    println!(
        "Scoring every name, selecting and sorting top {TOP_COUNT}; score descending, input index ascending on ties."
    );
    println!("One thread; Rust 1.99.0 release defaults; heap tracking disabled during timing.");
    println!("Nucleo: match_paths, smart case/normalization, borrowed ASCII and prepared Unicode.");
    println!(
        "Frizbee: default delimiter bonuses, smart case/Unicode, no typos; +typos allows min(chars/4, 2)."
    );
    println!(
        "Both use literal fuzzy queries and identical partial selection; no incremental filtering or cancellation.\n"
    );
    println!("| Dataset | Matcher | Query | Characters | Median ms | Returned |");
    println!("|---|---|---|---:|---:|---:|");
    print_timings("2M paths", &names, &index);
    {
        let folder: Vec<_> = names
            .iter()
            .take(FOLDER_COUNT)
            .map(|name| name.rsplit('/').next().expect("every path has a filename"))
            .collect();
        let folder_index = NucleoIndex::new(&folder);
        print_timings("100k folder basenames", &folder, &folder_index);
    }
    print_memory(&names, &index, (raw_usage.retained, index_usage.retained));
    print_quality(&names, &index);
    println!(
        "\nReport elapsed: {:.2} s.",
        started.elapsed().as_secs_f64()
    );
}

fn print_corpus(names: &[Box<str>]) {
    let unicode = names.iter().filter(|name| !name.is_ascii()).count();
    let mut depths = [0_usize; 8];
    for name in names {
        let path = name
            .strip_prefix("C:/")
            .or_else(|| name.strip_prefix("D:/"))
            .or_else(|| name.strip_prefix('/'))
            .expect("generated paths have roots");
        let depth = path.split('/').count();
        assert!((1..=8).contains(&depth));
        depths[depth - 1] += 1;
    }
    assert!(depths.iter().all(|count| *count > 0));
    println!(
        "Corpus: {} paths; seed 0x{SEED:016x}; FNV-1a {:016x}; {unicode} Unicode paths; depths 1–8.",
        names.len(),
        fingerprint(names)
    );
    println!(
        "19 unique quality targets replace evenly spaced generated entries; folder rows use the first {FOLDER_COUNT} basenames."
    );
}

fn print_timings<S: AsRef<str>>(label: &str, names: &[S], index: &NucleoIndex<'_>) {
    for query in QUERIES {
        for engine in Engine::ALL {
            let warm = engine.search(names, index, query);
            assert!(warm.len() <= TOP_COUNT && warm.is_sorted());
            drop(warm);
            let mut times = [0.0; SAMPLES];
            let mut returned = 0;
            for time in &mut times {
                let started = Instant::now();
                let matches = black_box(engine.search(black_box(names), index, black_box(query)));
                *time = started.elapsed().as_secs_f64() * 1_000.0;
                assert!(matches.len() <= TOP_COUNT && matches.is_sorted());
                returned = matches.len();
            }
            times.sort_by(f64::total_cmp);
            println!(
                "| {label} | {} | `{query}` | {} | {:.3} | {returned} |",
                engine.label(),
                query.chars().count(),
                times[SAMPLES / 2]
            );
        }
    }
}

fn mib(bytes: usize) -> f64 {
    bytes as f64 / 1_048_576.0
}

fn print_memory(names: &[Box<str>], index: &NucleoIndex<'_>, retained: (usize, usize)) {
    println!("\nMemory: requested live heap, MiB; excludes allocator overhead, stack and RSS.");
    println!(
        "Each query starts a fresh matcher; peak extra excludes resident names/preparation and includes all candidate results and top-100 selection.\n"
    );
    println!(
        "| Matcher | Query | Raw names MiB | Extra prepared MiB | Total haystack MiB | Peak query extra MiB |"
    );
    println!("|---|---|---:|---:|---:|---:|");
    for engine in Engine::ALL {
        let prepared = if matches!(engine, Engine::Nucleo) {
            retained.1
        } else {
            0
        };
        for query in QUERIES {
            let (matches, usage) = heap::measure(|| engine.search(names, index, query));
            assert!(matches.len() <= TOP_COUNT && matches.is_sorted());
            println!(
                "| {} | `{query}` | {:.3} | {:.3} | {:.3} | {:.3} |",
                engine.label(),
                mib(retained.0),
                mib(prepared),
                mib(retained.0 + prepared),
                mib(usage.peak)
            );
        }
    }
}

fn print_quality(names: &[Box<str>], index: &NucleoIndex<'_>) {
    println!(
        "\nQuality: intended target's 1-based rank over all 2M paths; deterministic input-order ties.\n"
    );
    println!("| Kind | Query | Intended target | nucleo | frizbee | frizbee+typos |");
    println!("|---|---|---|---:|---:|---:|");
    let mut found = [0; 3];
    for case in &QUALITY_CASES {
        let target = names
            .iter()
            .position(|name| name.as_ref() == case.target)
            .expect("generator inserts every quality target");
        let ranks = Engine::ALL.map(|engine| {
            let matches = engine.search(names, index, case.query);
            assert!(matches.len() <= TOP_COUNT && matches.is_sorted());
            matches
                .iter()
                .position(|item| item.index as usize == target)
        });
        for (count, rank) in found.iter_mut().zip(ranks) {
            *count += usize::from(rank.is_some());
        }
        let [nucleo, frizbee, typos] = ranks.map(|rank| {
            rank.map_or_else(
                || "not in top 100".to_owned(),
                |rank| (rank + 1).to_string(),
            )
        });
        println!(
            "| {} | `{}` | `{}` | {nucleo} | {frizbee} | {typos} |",
            case.kind, case.query, case.target
        );
    }
    println!(
        "\nTargets in top 100: nucleo {}/20; frizbee {}/20; frizbee+typos {}/20.",
        found[0], found[1], found[2]
    );
}
