const FOLDERS: &[&str] = &[
    "home",
    "admin",
    "projects",
    "Ferrite",
    "Atlas",
    "Website",
    "src",
    "tests",
    "config",
    "docs",
    "assets",
    "images",
    "Downloads",
    "Documents",
    "Reports",
    "workspace-2026",
    "release_12",
    "Client Work",
    "backend",
    "components",
    "crates",
    "rusty-index",
    "cache",
    "Archive",
    "Photos",
    "media",
    "srv",
    "Music",
];
const FILES: &[(&str, &str)] = &[
    ("main", "rs"),
    ("Cargo", "toml"),
    ("lib", "rs"),
    ("FileDialog", "rs"),
    ("app_config", "toml"),
    ("HeroBanner", "png"),
    ("Annual Report", "docx"),
    ("README", "md"),
    ("docker-compose", "yml"),
    ("package", "json"),
    ("DownloadTask", "rs"),
    ("test_parser", "rs"),
    ("user-profile", "tsx"),
    ("Meeting Notes", "docx"),
    ("screenshot", "png"),
    ("background", "jpg"),
    ("index", "html"),
    ("styles", "css"),
    ("backup", "tar.gz"),
    ("events", "log"),
    ("Track", "flac"),
    ("build", "sh"),
    ("Quarterly Sales", "xlsx"),
    ("config", "json"),
];
const UNICODE: &[(&str, &str)] = &[
    ("vacanță", "png"),
    ("Überblick", "docx"),
    ("日本語メモ", "md"),
    ("café", "toml"),
    ("résumé", "docx"),
    ("δοκιμή", "rs"),
    ("данные", "json"),
    ("서울", "png"),
];

pub struct QualityCase {
    pub kind: &'static str,
    pub query: &'static str,
    pub target: &'static str,
}

pub const QUALITY_CASES: [QualityCase; 20] = [
    QualityCase {
        kind: "abbreviation",
        query: "fbr",
        target: "/projects/Ferrite/docs/fuzzy_bench_report.md",
    },
    QualityCase {
        kind: "substitution",
        query: "fuzzy_bench_reporx",
        target: "/projects/Ferrite/docs/fuzzy_bench_report.md",
    },
    QualityCase {
        kind: "substitution",
        query: "cargp.toml",
        target: "/projects/Ferrite/Cargo.toml",
    },
    QualityCase {
        kind: "numbers",
        query: "rpt2026",
        target: "D:/Documents/Reports/Annual_Report_2026.docx",
    },
    QualityCase {
        kind: "path fragment",
        query: "src/main",
        target: "/projects/Ferrite/src/main.rs",
    },
    QualityCase {
        kind: "camel case",
        query: "RI",
        target: "/projects/Ferrite/src/RustyIndex.rs",
    },
    QualityCase {
        kind: "camel case",
        query: "FDlg",
        target: "/projects/Ferrite/ui/FileDialog.rs",
    },
    QualityCase {
        kind: "dashes",
        query: "fuzzy-bench/cargo",
        target: "/projects/Ferrite/spikes/fuzzy-bench/Cargo.toml",
    },
    QualityCase {
        kind: "snake case",
        query: "appcfg",
        target: "/projects/Atlas/config/app_config.toml",
    },
    QualityCase {
        kind: "transposition",
        query: "downlaodtask",
        target: "/projects/Atlas/src/DownloadTaskHandler.rs",
    },
    QualityCase {
        kind: "path fragment",
        query: "img/hero",
        target: "/projects/Website/img/hero-banner.png",
    },
    QualityCase {
        kind: "spaces",
        query: "launchplan",
        target: "D:/Documents/Product Launch Plan.docx",
    },
    QualityCase {
        kind: "path fragment",
        query: "db/mig",
        target: "/projects/Atlas/db/migrations/2026-10-01-init.sql",
    },
    QualityCase {
        kind: "path abbreviation",
        query: "jellycomp",
        target: "/srv/jellyfin/docker-compose.yml",
    },
    QualityCase {
        kind: "snake case",
        query: "testparse",
        target: "/projects/Ferrite/tests/parser_cases.rs",
    },
    QualityCase {
        kind: "extra character",
        query: "readmme",
        target: "/projects/Ferrite/README.md",
    },
    QualityCase {
        kind: "abbreviation",
        query: "tascfg",
        target: "/projects/Atlas/tsconfig.json",
    },
    QualityCase {
        kind: "Unicode Latin",
        query: "résumé",
        target: "D:/Documents/résumé_2026.docx",
    },
    QualityCase {
        kind: "Unicode CJK",
        query: "東京",
        target: "/media/Photos/東京-trip-2026.png",
    },
    QualityCase {
        kind: "Unicode Latin",
        query: "café",
        target: "/home/admin/Documents/café_notes.md",
    },
];

struct SplitMix64(u64);

impl SplitMix64 {
    fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9e37_79b9_7f4a_7c15);
        let mut value = self.0;
        value = (value ^ (value >> 30)).wrapping_mul(0xbf58_476d_1ce4_e5b9);
        value = (value ^ (value >> 27)).wrapping_mul(0x94d0_49bb_1331_11eb);
        value ^ (value >> 31)
    }

    fn pick(&mut self, count: usize) -> usize {
        (self.next() % count as u64) as usize
    }

    fn path(&mut self, index: usize) -> Box<str> {
        let mut path = String::from(["/", "/", "C:/", "D:/"][self.pick(4)]);
        for _ in 1..=self.pick(8) {
            let folder = if self.pick(64) == 0 {
                UNICODE[self.pick(UNICODE.len())].0
            } else {
                FOLDERS[self.pick(FOLDERS.len())]
            };
            path.push_str(folder);
            path.push('/');
        }
        let files = if self.pick(32) == 0 { UNICODE } else { FILES };
        let (stem, extension) = files[self.pick(files.len())];
        path.push_str(stem);
        path.push_str(["_", "-", " ", ""][self.pick(4)]);
        path.push_str(&index.to_string());
        path.push('.');
        path.push_str(extension);
        path.into_boxed_str()
    }
}

pub fn generate(count: usize, seed: u64) -> Vec<Box<str>> {
    let mut random = SplitMix64(seed);
    let mut names: Vec<_> = (0..count).map(|index| random.path(index)).collect();
    for (index, case) in QUALITY_CASES.iter().take(count).enumerate() {
        if QUALITY_CASES[..index]
            .iter()
            .any(|prior| prior.target == case.target)
        {
            continue;
        }
        let position = (index + 1) * count / (QUALITY_CASES.len() + 1);
        names[position] = case.target.into();
    }
    names
}

pub fn fingerprint(names: &[Box<str>]) -> u64 {
    names.iter().fold(0xcbf2_9ce4_8422_2325, |hash, name| {
        name.bytes().chain([0]).fold(hash, |value, byte| {
            (value ^ u64::from(byte)).wrapping_mul(0x0000_0100_0000_01b3)
        })
    })
}
