mod app;
mod command_line;
mod data;
mod drawer;
mod file_list;
mod fkey_bar;
mod pane;
mod picker;
mod primitives;
mod rail;
mod tokens;
mod top_bar;

use std::borrow::Cow;
use std::time::Instant;

use app::{Launch, Workspace};
use gpui_kit::assets::{Assets, icon_assets};
use gpui_kit::{
    App, AppContext, AssetSource, Bounds, SharedString, TitlebarOptions, WindowBounds,
    WindowOptions, px, size,
};
use tokens::{Mode, Variant};

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

fn parse_args() -> Result<(Variant, Mode), String> {
    let mut variant = Variant::Faithful;
    let mut mode = Mode::Light;
    let mut args = std::env::args().skip(1);
    while let Some(flag) = args.next() {
        let value = args.next().ok_or(format!("{flag} needs a value"))?;
        match (flag.as_str(), value.as_str()) {
            ("--variant", n) => {
                variant = Variant::from_number(n).ok_or(format!("unknown variant {n}"))?;
            }
            ("--theme", "light") => mode = Mode::Light,
            ("--theme", "dark") => mode = Mode::Dark,
            _ => return Err(format!("unknown argument {flag} {value}")),
        }
    }
    Ok((variant, mode))
}

fn find_segoe(cx: &App) -> Option<SharedString> {
    let names = cx.text_system().all_font_names();
    let preferred = names
        .iter()
        .find(|n| n.as_str() == "Segoe UI Variable Text");
    preferred
        .or_else(|| names.iter().find(|n| n.starts_with("Segoe UI Variable")))
        .map(|n| SharedString::from(n.clone()))
}

fn load_fonts(cx: &App) {
    let fonts = vec![
        font!("Archivo-Regular"),
        font!("Archivo-Medium"),
        font!("Archivo-SemiBold"),
        font!("Archivo-Bold"),
        font!("GoogleSansFlex-Regular"),
        font!("GoogleSansFlex-Medium"),
        font!("GoogleSansFlex-SemiBold"),
        font!("GoogleSansFlex-Bold"),
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
            title: Some("Rusty spike: B variants".into()),
            ..Default::default()
        }),
        app_id: Some("rusty-spike".into()),
        ..Default::default()
    }
}

fn main() {
    let started = Instant::now();
    let (variant, mode) = match parse_args() {
        Ok(parsed) => parsed,
        Err(message) => {
            eprintln!("{message}\nusage: gpui-b-variants [--variant 1|2|3] [--theme light|dark]");
            std::process::exit(2);
        }
    };
    gpui_kit::application()
        .with_assets(SpikeAssets)
        .run(move |cx| {
            gpui_kit::init(cx);
            load_fonts(cx);
            app::bind_keys(cx);
            let launch = Launch {
                variant,
                mode,
                segoe: find_segoe(cx),
                started,
            };
            let options = window_options(cx);
            let opened = gpui_kit::open_window(options, cx, |window, cx| {
                cx.new(|cx| Workspace::new(launch, window, cx))
            });
            if let Err(err) = opened {
                eprintln!("could not open the window: {err:#}");
                cx.quit();
            }
        });
}
