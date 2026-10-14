use std::time::{Duration, Instant};

use super::memory::parse_proc_status;
use super::recorder::{Recorder, Tick};
use super::report::Destination;
use super::stats::{FrameStats, percentile};
use super::{Memory, Report};

const STATUS: &str =
    "Name:\tgpui-b\nVmPeak:\t  900000 kB\nVmHWM:\t   81920 kB\nVmRSS:\t   61440 kB\nThreads:\t12\n";

#[test]
fn percentile_uses_nearest_rank() {
    let sorted: Vec<f64> = (1..=100).map(f64::from).collect();
    assert_eq!(percentile(&sorted, 50.0), 50.0);
    assert_eq!(percentile(&sorted, 95.0), 95.0);
    assert_eq!(percentile(&sorted, 99.0), 99.0);
    assert_eq!(percentile(&[], 50.0), 0.0);
    assert_eq!(percentile(&[7.0], 99.0), 7.0);
}

#[test]
fn frame_budget_counters_are_strictly_above() {
    let stats = FrameStats::from_intervals(&[16.0, 16.7, 16.8, 33.3, 33.4, 50.0]);
    assert_eq!(stats.count, 6);
    assert_eq!(stats.over_16_7_ms, 4);
    assert_eq!(stats.over_33_3_ms, 2);
    assert_eq!(stats.max_ms, 50.0);
}

#[test]
fn recorder_collects_until_the_window_ends() {
    let t0 = Instant::now();
    let mut recorder = Recorder::begin(t0, Duration::from_millis(40));
    assert_eq!(
        recorder.tick(t0 + Duration::from_millis(16)),
        Tick::Continue
    );
    assert_eq!(
        recorder.tick(t0 + Duration::from_millis(33)),
        Tick::Continue
    );
    assert_eq!(recorder.tick(t0 + Duration::from_millis(50)), Tick::Done);
    let stats = recorder.finish();
    assert_eq!(stats.count, 2);
    assert!(stats.max_ms >= 17.0 && stats.max_ms < 18.0);
}

#[test]
fn proc_status_gives_rss_and_peak_in_bytes() {
    let memory = parse_proc_status(STATUS);
    assert_eq!(memory.rss_bytes, Some(61_440 * 1024));
    assert_eq!(memory.peak_rss_bytes, Some(81_920 * 1024));
    assert_eq!(parse_proc_status("Name:\tx\n"), Memory::default());
}

#[test]
fn destination_dash_means_stdout() {
    assert_eq!(Destination::parse("-"), Destination::Stdout);
    assert!(matches!(Destination::parse("m.json"), Destination::File(_)));
}

#[test]
fn report_serialises_every_expected_key() {
    let report = Report::collect(
        Some("gpu".into()),
        Some(120.5),
        FrameStats::from_intervals(&[16.0, 17.0]),
        parse_proc_status(STATUS),
    );
    let value = serde_json::to_value(&report).expect("serialise");
    let keys = |v: &serde_json::Value| -> Vec<String> {
        let mut keys: Vec<_> = v.as_object().expect("object").keys().cloned().collect();
        keys.sort();
        keys
    };
    assert_eq!(
        keys(&value),
        [
            "app_version",
            "arch",
            "binary_bytes",
            "first_frame_ms",
            "gpu",
            "marks",
            "memory",
            "os",
            "scroll",
            "scroll_seconds"
        ]
    );
    assert_eq!(
        keys(&value["scroll"]),
        [
            "count",
            "max_ms",
            "over_16_7_ms",
            "over_33_3_ms",
            "p50_ms",
            "p95_ms",
            "p99_ms"
        ]
    );
    assert_eq!(keys(&value["memory"]), ["peak_rss_bytes", "rss_bytes"]);
    assert!(value["binary_bytes"].is_u64());
}
