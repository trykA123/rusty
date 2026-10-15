use serde::Serialize;

pub const BUDGET_60HZ_MS: f64 = 16.7;
pub const BUDGET_30HZ_MS: f64 = 33.3;

#[derive(Debug, Serialize, PartialEq)]
pub struct FrameStats {
    pub count: usize,
    pub p50_ms: f64,
    pub p95_ms: f64,
    pub p99_ms: f64,
    pub max_ms: f64,
    pub over_16_7_ms: usize,
    pub over_33_3_ms: usize,
}

pub fn percentile(sorted: &[f64], pct: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    let rank = (pct / 100.0 * sorted.len() as f64).ceil() as usize;
    sorted[rank.clamp(1, sorted.len()) - 1]
}

impl FrameStats {
    pub fn from_intervals(intervals_ms: &[f64]) -> Self {
        let mut sorted = intervals_ms.to_vec();
        sorted.sort_by(f64::total_cmp);
        Self {
            count: sorted.len(),
            p50_ms: percentile(&sorted, 50.0),
            p95_ms: percentile(&sorted, 95.0),
            p99_ms: percentile(&sorted, 99.0),
            max_ms: sorted.last().copied().unwrap_or(0.0),
            over_16_7_ms: sorted.iter().filter(|&&ms| ms > BUDGET_60HZ_MS).count(),
            over_33_3_ms: sorted.iter().filter(|&&ms| ms > BUDGET_30HZ_MS).count(),
        }
    }
}
