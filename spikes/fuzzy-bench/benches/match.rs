use std::sync::OnceLock;

use fuzzy_bench::{
    NAME_COUNT, QUERIES, SEED,
    corpus::generate,
    matching::{Engine, NucleoIndex},
};

static NAMES: OnceLock<Vec<Box<str>>> = OnceLock::new();
static INDEX: OnceLock<NucleoIndex<'static>> = OnceLock::new();

fn main() {
    let names = NAMES.get_or_init(|| generate(NAME_COUNT, SEED));
    INDEX.get_or_init(|| NucleoIndex::new(names));
    divan::main();
}

fn measure(bencher: divan::Bencher, query: &str, engine: Engine) {
    let names = NAMES.get().expect("main initializes the corpus");
    let index = INDEX.get().expect("main prepares the nucleo index");
    bencher.bench_local(|| engine.search(divan::black_box(names), index, divan::black_box(query)));
}

#[divan::bench(args = QUERIES, sample_count = 9, sample_size = 1)]
fn nucleo(bencher: divan::Bencher, query: &str) {
    measure(bencher, query, Engine::Nucleo);
}

#[divan::bench(args = QUERIES, sample_count = 9, sample_size = 1)]
fn frizbee(bencher: divan::Bencher, query: &str) {
    measure(bencher, query, Engine::Frizbee);
}

#[divan::bench(args = QUERIES, sample_count = 9, sample_size = 1)]
fn frizbee_typos(bencher: divan::Bencher, query: &str) {
    measure(bencher, query, Engine::FrizbeeTypos);
}
