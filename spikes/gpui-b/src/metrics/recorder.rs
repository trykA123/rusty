use std::time::{Duration, Instant};

use super::stats::FrameStats;

#[derive(Debug, PartialEq)]
pub enum Tick {
    Continue,
    Done,
}

pub struct Recorder {
    window: Duration,
    began: Instant,
    last: Instant,
    intervals_ms: Vec<f64>,
}

impl Recorder {
    pub fn begin(now: Instant, window: Duration) -> Self {
        Self {
            window,
            began: now,
            last: now,
            intervals_ms: Vec::new(),
        }
    }

    pub fn tick(&mut self, now: Instant) -> Tick {
        let interval = now.saturating_duration_since(self.last);
        self.last = now;
        if now.saturating_duration_since(self.began) >= self.window {
            return Tick::Done;
        }
        self.intervals_ms.push(interval.as_secs_f64() * 1000.0);
        Tick::Continue
    }

    pub fn finish(&self) -> FrameStats {
        FrameStats::from_intervals(&self.intervals_ms)
    }
}
