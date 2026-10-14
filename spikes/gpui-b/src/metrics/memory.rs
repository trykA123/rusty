use serde::Serialize;

#[derive(Debug, Default, Serialize, PartialEq)]
pub struct Memory {
    pub rss_bytes: Option<u64>,
    pub peak_rss_bytes: Option<u64>,
}

impl Memory {
    pub fn read() -> Self {
        read()
    }
}

pub fn parse_proc_status(text: &str) -> Memory {
    let kib = |key: &str| {
        text.lines()
            .find_map(|line| line.strip_prefix(key)?.strip_prefix(':'))
            .and_then(|rest| rest.split_whitespace().next()?.parse::<u64>().ok())
            .map(|kib| kib * 1024)
    };
    Memory {
        rss_bytes: kib("VmRSS"),
        peak_rss_bytes: kib("VmHWM"),
    }
}

#[cfg(target_os = "linux")]
pub fn read() -> Memory {
    std::fs::read_to_string("/proc/self/status")
        .map(|text| parse_proc_status(&text))
        .unwrap_or_default()
}

#[cfg(windows)]
pub fn read() -> Memory {
    use windows_sys::Win32::System::ProcessStatus::{
        GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS,
    };
    use windows_sys::Win32::System::Threading::GetCurrentProcess;

    let mut counters = PROCESS_MEMORY_COUNTERS {
        cb: size_of::<PROCESS_MEMORY_COUNTERS>() as u32,
        ..unsafe { std::mem::zeroed() }
    };
    // SAFETY: counters is a valid, writable PROCESS_MEMORY_COUNTERS with cb set to its size, and the pseudo-handle from GetCurrentProcess is always valid.
    let ok = unsafe { GetProcessMemoryInfo(GetCurrentProcess(), &mut counters, counters.cb) };
    if ok == 0 {
        return Memory::default();
    }
    Memory {
        rss_bytes: Some(counters.WorkingSetSize as u64),
        peak_rss_bytes: Some(counters.PeakWorkingSetSize as u64),
    }
}

#[cfg(not(any(target_os = "linux", windows)))]
pub fn read() -> Memory {
    Memory::default()
}
