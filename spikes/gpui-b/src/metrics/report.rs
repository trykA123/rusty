use std::path::PathBuf;
use std::sync::Mutex;

use serde::Serialize;

use super::memory::Memory;
use super::stats::FrameStats;

static MARKS: Mutex<Vec<Mark>> = Mutex::new(Vec::new());

#[derive(Clone, Debug, Serialize)]
pub struct Mark {
    pub label: String,
    pub ms: f64,
}

pub mod marks {
    use super::{MARKS, Mark};

    pub fn push(label: &str, ms: f64) {
        if let Ok(mut marks) = MARKS.lock() {
            marks.push(Mark {
                label: label.to_owned(),
                ms,
            });
        }
    }

    pub fn all() -> Vec<super::Mark> {
        MARKS.lock().map(|m| m.clone()).unwrap_or_default()
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum Destination {
    Stdout,
    File(PathBuf),
}

impl Destination {
    pub fn parse(arg: &str) -> Self {
        if arg == "-" {
            Self::Stdout
        } else {
            Self::File(PathBuf::from(arg))
        }
    }
}

#[derive(Debug, Serialize)]
pub struct Report {
    pub app_version: &'static str,
    pub os: &'static str,
    pub arch: &'static str,
    pub gpu: Option<String>,
    pub first_frame_ms: Option<f64>,
    pub marks: Vec<Mark>,
    pub scroll_seconds: u64,
    pub scroll: FrameStats,
    pub memory: Memory,
    pub binary_bytes: Option<u64>,
}

impl Report {
    pub fn collect(
        gpu: Option<String>,
        first_frame_ms: Option<f64>,
        scroll: FrameStats,
        memory: Memory,
    ) -> Self {
        Self {
            app_version: env!("CARGO_PKG_VERSION"),
            os: std::env::consts::OS,
            arch: std::env::consts::ARCH,
            gpu,
            first_frame_ms,
            marks: marks::all(),
            scroll_seconds: super::SCROLL_SECONDS,
            scroll,
            memory,
            binary_bytes: std::env::current_exe()
                .and_then(std::fs::metadata)
                .ok()
                .map(|meta| meta.len()),
        }
    }

    pub fn write(&self, to: &Destination) -> std::io::Result<()> {
        let json = serde_json::to_string_pretty(self).map_err(std::io::Error::other)?;
        match to {
            Destination::Stdout => {
                println!("{json}");
                Ok(())
            }
            Destination::File(path) => std::fs::write(path, json + "\n"),
        }
    }
}
