mod memory;
mod recorder;
mod report;
mod stats;

#[cfg(test)]
mod tests;

pub use memory::Memory;
pub use recorder::{Recorder, Tick};
pub use report::{Destination, Report, marks};

pub const SCROLL_SECONDS: u64 = 10;
pub const IDLE_SECONDS: u64 = 5;
