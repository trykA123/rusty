use gpui_kit::SharedString;

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Kind {
    Folder,
    Code,
    Doc,
    Image,
    Archive,
    App,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Git {
    Modified,
    Added,
}

#[derive(Clone, Debug)]
pub struct Entry {
    pub name: SharedString,
    pub kind: Kind,
    pub size: SharedString,
    pub date: SharedString,
    pub git: Option<Git>,
}

pub struct Folder {
    pub tabs: &'static [&'static str],
    pub active_tab: usize,
    pub drive: &'static str,
    pub crumbs: &'static [&'static str],
    pub entries: Vec<Entry>,
    pub status: &'static str,
    pub can_grow: bool,
}

pub const GENERATED_ROWS: usize = 100_000;

fn entry(name: &'static str, kind: Kind, size: &'static str, date: &'static str) -> Entry {
    Entry {
        name: name.into(),
        kind,
        size: size.into(),
        date: date.into(),
        git: None,
    }
}

fn dir(name: &'static str) -> Entry {
    entry(name, Kind::Folder, "<DIR>", "11/10/26 21:40")
}

fn with_git(mut entry: Entry, git: Git) -> Entry {
    entry.git = Some(git);
    entry
}

pub fn generated(index: usize) -> Entry {
    let kinds = [
        Kind::Image,
        Kind::Image,
        Kind::Doc,
        Kind::Archive,
        Kind::Code,
    ];
    let kind = kinds[index % kinds.len()];
    let ext = match kind {
        Kind::Image => "jpg",
        Kind::Doc => "txt",
        Kind::Archive => "zip",
        _ => "rs",
    };
    let kib = (index * 7919) % 90_000 + 12;
    Entry {
        name: format!("bulk_{index:06}.{ext}").into(),
        kind,
        size: format!("{}.{} MB", kib / 1000, (kib / 100) % 10).into(),
        date: format!(
            "{:02}/09/26 {:02}:{:02}",
            index % 28 + 1,
            index % 24,
            index % 60
        )
        .into(),
        git: None,
    }
}

pub fn folders() -> [Folder; 3] {
    [core(), downloads(), homelab()]
}

fn core() -> Folder {
    Folder {
        tabs: &["commander", "core"],
        active_tab: 1,
        drive: "D:",
        crumbs: &["D:", "work", "commander", "crates", "core"],
        entries: vec![
            dir("[src]"),
            dir("[tests]"),
            entry("Cargo", Kind::Code, "812 B", "13/10/26 19:40"),
            with_git(
                entry("layout", Kind::Code, "14 KB", "13/10/26 21:22"),
                Git::Modified,
            ),
            entry("workspace", Kind::Code, "9.6 KB", "13/10/26 17:40"),
            entry("pane", Kind::Code, "7.2 KB", "13/10/26 17:40"),
            with_git(
                entry("fuzzy", Kind::Code, "5.5 KB", "12/10/26 21:40"),
                Git::Added,
            ),
        ],
        status: "5 files, 2 folders · 37 KB",
        can_grow: false,
    }
}

fn downloads() -> Folder {
    Folder {
        tabs: &["Downloads"],
        active_tab: 0,
        drive: "C:",
        crumbs: &["C:", "Users", "admin", "Downloads"],
        entries: vec![
            dir("[fonts-2026]"),
            dir("[drivers]"),
            entry("rustup-init", Kind::App, "9.0 MB", "12/10/26 21:40"),
            entry("WizTree_4.21", Kind::App, "6.8 MB", "10/10/26 21:40"),
            entry(
                "Everything-1.5a.x64-Setup",
                Kind::App,
                "2.2 MB",
                "09/10/26 21:40",
            ),
            entry("invoice-2026-10", Kind::Doc, "180 KB", "13/10/26 16:40"),
            entry(
                "hyprsunset-0.4.tar",
                Kind::Archive,
                "86 KB",
                "07/10/26 21:40",
            ),
            entry(
                "wallpaper-3440x1440",
                Kind::Image,
                "6.0 MB",
                "04/10/26 21:40",
            ),
            entry(
                "bios-x670e-3201",
                Kind::Archive,
                "33.0 MB",
                "01/10/26 21:40",
            ),
            entry("notes", Kind::Doc, "4.0 KB", "13/10/26 20:40"),
            entry(
                "screenshot 2026-10-13 2140",
                Kind::Image,
                "793 KB",
                "13/10/26 21:28",
            ),
        ],
        status: "9 files, 2 folders · 58.0 MB",
        can_grow: true,
    }
}

fn homelab() -> Folder {
    Folder {
        tabs: &["homelab"],
        active_tab: 0,
        drive: "D:",
        crumbs: &["D:", "work", "homelab"],
        entries: vec![
            dir("[caddy]"),
            dir("[jellyfin]"),
            dir("[lumen]"),
            dir("[musique]"),
            dir("[scripts]"),
            entry("compose", Kind::Code, "7.0 KB", "11/10/26 21:40"),
            entry(".env", Kind::Doc, "512 B", "13/09/26 21:40"),
            entry("AGENTS", Kind::Doc, "10 KB", "12/10/26 21:40"),
        ],
        status: "3 files, 5 folders · 18 KB",
        can_grow: false,
    }
}

pub struct Pin {
    pub label: &'static str,
    pub is_remote: bool,
}

pub const PINS: [Pin; 5] = [
    Pin {
        label: "Downloads",
        is_remote: false,
    },
    Pin {
        label: "Desktop",
        is_remote: false,
    },
    Pin {
        label: "work",
        is_remote: false,
    },
    Pin {
        label: "commander",
        is_remote: false,
    },
    Pin {
        label: "nas · media",
        is_remote: true,
    },
];

pub const SETS: [&str; 3] = ["Commander dev", "Photos", "Homelab"];

pub struct Drive {
    pub label: &'static str,
    pub capacity: &'static str,
    pub used: f32,
    pub is_remote: bool,
}

pub const DRIVES: [Drive; 3] = [
    Drive {
        label: "System (C:)",
        capacity: "1 TB",
        used: 62.,
        is_remote: false,
    },
    Drive {
        label: "Data (D:)",
        capacity: "4 TB",
        used: 41.,
        is_remote: false,
    },
    Drive {
        label: "nas · media",
        capacity: "24 TB",
        used: 77.,
        is_remote: true,
    },
];

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum JobState {
    Running,
    Done,
    Queued,
}

pub struct Job {
    pub name: &'static str,
    pub target: &'static str,
    pub progress: f32,
    pub state: JobState,
    pub detail: [&'static str; 2],
    pub action: &'static str,
}

pub const JOBS: [Job; 3] = [
    Job {
        name: "IMG_4120 … IMG_4159.jpg",
        target: "\\\\nas\\media\\photos\\2026-10 Sinaia",
        progress: 64.,
        state: JobState::Running,
        detail: ["212 MB/s", "0:41"],
        action: "Pause",
    },
    Job {
        name: "bios-x670e-3201.zip",
        target: "D:\\backups\\2026-10-08",
        progress: 100.,
        state: JobState::Done,
        detail: ["verified · sha256", "done"],
        action: "Show",
    },
    Job {
        name: "films\\Arrival (2016).mkv",
        target: "D:\\media\\films",
        progress: 12.,
        state: JobState::Queued,
        detail: ["—", "queued"],
        action: "Start",
    },
];

pub struct Shelf {
    pub kind: Kind,
    pub name: &'static str,
    pub path: &'static str,
    pub meta: &'static str,
}

pub const CLIPS: [Shelf; 4] = [
    Shelf {
        kind: Kind::Folder,
        name: "2026-10 Sinaia",
        path: "\\\\nas\\media\\photos",
        meta: "cut · 41 items",
    },
    Shelf {
        kind: Kind::Code,
        name: "layout.rs",
        path: "D:\\work\\commander\\crates\\core",
        meta: "copy · 14 KB",
    },
    Shelf {
        kind: Kind::Image,
        name: "IMG_4121.jpg",
        path: "\\\\nas\\media\\photos\\2026-10 Sinaia",
        meta: "copy · 6.1 MB",
    },
    Shelf {
        kind: Kind::Doc,
        name: "D:\\work\\commander\\README.md",
        path: "path text",
        meta: "text",
    },
];

pub const HITS: [Shelf; 4] = [
    Shelf {
        kind: Kind::Code,
        name: "fuzzy.rs",
        path: "D:\\work\\commander\\crates\\core",
        meta: "5.5 KB",
    },
    Shelf {
        kind: Kind::Folder,
        name: "fuzzy-bench",
        path: "D:\\work\\commander\\spikes",
        meta: "folder",
    },
    Shelf {
        kind: Kind::Doc,
        name: "fuzzy-matching.md",
        path: "D:\\work\\notes",
        meta: "3.2 KB",
    },
    Shelf {
        kind: Kind::Archive,
        name: "fuzzy-old.zip",
        path: "D:\\backups\\2025",
        meta: "48 MB",
    },
];

pub const FKEYS: [(&str, &str); 9] = [
    ("F2", "Rename"),
    ("F3", "View"),
    ("F4", "Edit"),
    ("F5", "Copy"),
    ("F6", "Move"),
    ("F7", "New folder"),
    ("F8", "Delete"),
    ("F9", "Drawer"),
    ("F10", "Palette"),
];
