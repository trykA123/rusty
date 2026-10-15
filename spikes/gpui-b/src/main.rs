#![allow(
    clippy::too_many_arguments,
    reason = "spike code; the product splits these in P7"
)]

mod app;
mod command_line;
mod data;
mod drawer;
mod file_list;
mod fkey_bar;
mod metrics;
mod pane;
mod primitives;
mod rail;
mod tokens;
mod top_bar;

#[cfg(test)]
mod tests;

use std::borrow::Cow;
use std::time::Instant;

use app::{Launch, Workspace};
use gpui_kit::assets::{Assets, icon_assets};
use gpui_kit::{
    App, AppContext, AssetSource, Bounds, SharedString, TitlebarOptions, WindowBounds,
    WindowOptions, px, size,
};
use metrics::Destination;
use tokens::Mode;

macro_rules! font {
    ($file:literal) => {
        Cow::Borrowed(
            include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/fonts/",
                $file,
                ".ttf"
            ))
            .as_slice(),
        )
    };
}

icon_assets!(
    SpikeIcons,
    [
        ArrowRight,
        ArrowUp,
        ChevronLeft,
        ChevronRight,
        Clipboard,
        Cloud,
        Columns2,
        Columns3,
        Copy,
        FileArchive,
        FileCode,
        FileImage,
        FileText,
        Files,
        Folder,
        HardDrive,
        Layers,
        LayoutGrid,
        PanelLeft,
        Pin,
        Plus,
        Search,
        SquarePlus,
        X,
    ]
);

struct SpikeAssets;

impl AssetSource for SpikeAssets {
    fn load(&self, path: &str) -> gpui_kit::Result<Option<Cow<'static, [u8]>>> {
        match SpikeIcons.load(path)? {
            Some(bytes) => Ok(Some(bytes)),
            None => Assets.load(path),
        }
    }

    fn list(&self, path: &str) -> gpui_kit::Result<Vec<SharedString>> {
        let mut names = SpikeIcons.list(path)?;
        names.extend(Assets.list(path)?);
        Ok(names)
    }
}

fn parse_args() -> Result<(Mode, bool, Option<Destination>), String> {
    let mut mode = Mode::Light;
    let mut big = false;
    let mut metrics = None;
    let mut args = std::env::args().skip(1);
    while let Some(flag) = args.next() {
        let value = args.next().ok_or(format!("{flag} needs a value"))?;
        match (flag.as_str(), value.as_str()) {
            ("--theme", "light") => mode = Mode::Light,
            ("--theme", "dark") => mode = Mode::Dark,
            ("--rows", "sample") => big = false,
            ("--rows", "100k") => big = true,
            ("--metrics", path) => metrics = Some(Destination::parse(path)),
            _ => return Err(format!("unknown argument {flag} {value}")),
        }
    }
    Ok((mode, big, metrics))
}

fn load_fonts(cx: &App) {
    let fonts = vec![
        font!("Archivo-Regular"),
        font!("Archivo-Medium"),
        font!("Archivo-SemiBold"),
        font!("Archivo-Bold"),
        font!("JetBrainsMono-Regular"),
        font!("JetBrainsMono-Medium"),
        font!("JetBrainsMono-SemiBold"),
        font!("JetBrainsMono-Bold"),
    ];
    if let Err(err) = cx.text_system().add_fonts(fonts) {
        eprintln!("bundled fonts failed to load: {err:#}");
    }
}

fn window_options(cx: &App) -> WindowOptions {
    let bounds = Bounds::centered(None, size(px(1440.), px(900.)), cx);
    WindowOptions {
        window_bounds: Some(WindowBounds::Windowed(bounds)),
        titlebar: Some(TitlebarOptions {
            title: Some("Ferrite spike".into()),
            ..Default::default()
        }),
        app_id: Some("ferrite-spike".into()),
        ..Default::default()
    }
}

fn mark(started: Instant, label: &str) {
    let ms = started.elapsed().as_secs_f64() * 1000.0;
    metrics::marks::push(label, ms);
    eprintln!("[{ms:>8.1} ms] {label}");
}

fn main() {
    let started = Instant::now();
    if std::env::var_os("RUST_LOG").is_some() {
        env_logger::init();
    }
    mark(started, "main");
    let (mode, big, metrics) = match parse_args() {
        Ok(parsed) => parsed,
        Err(message) => {
            eprintln!(
                "{message}\nusage: gpui-b [--theme light|dark] [--rows sample|100k] [--metrics <path|->]"
            );
            std::process::exit(2);
        }
    };
    let application = gpui_kit::application().with_assets(SpikeAssets);
    mark(started, "application created");
    application.run(move |cx| {
        mark(started, "run callback");
        gpui_kit::init(cx);
        mark(started, "gpui_kit::init");
        load_fonts(cx);
        mark(started, "fonts added");
        app::bind_keys(cx);
        let launch = Launch {
            mode,
            big,
            started,
            metrics: metrics.clone(),
        };
        let options = window_options(cx);
        let opened = gpui_kit::open_window(options, cx, |window, cx| {
            cx.new(|cx| Workspace::new(launch, window, cx))
        });
        mark(started, "open_window returned");
        if let Err(err) = opened {
            eprintln!("could not open the window: {err:#}");
            cx.quit();
        }
    });
}
