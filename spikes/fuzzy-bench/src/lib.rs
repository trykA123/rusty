pub mod corpus;
pub mod matching;

pub const SEED: u64 = 0x5255_5354_595f_5032;
pub const NAME_COUNT: usize = 2_000_000;
pub const FOLDER_COUNT: usize = 100_000;
pub const QUERIES: [&str; 3] = ["r", "crt", "cargotom"];
pub const TOP_COUNT: usize = 100;
