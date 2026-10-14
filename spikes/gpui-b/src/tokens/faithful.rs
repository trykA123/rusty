use super::{Fonts, Metrics, Mode, Palette, Theme, ok};
use gpui_kit::px;

pub(super) fn palette(mode: Mode) -> Palette {
    match mode {
        Mode::Light => Palette {
            bg: ok(99.2, 0.002, 260.),
            surface: ok(99.2, 0.002, 260.),
            rail: ok(96.2, 0.005, 260.),
            zebra: ok(97.6, 0.004, 260.),
            line: ok(88., 0.008, 260.),
            text: ok(21., 0.012, 260.),
            muted: ok(46., 0.02, 260.),
            faint: ok(60., 0.016, 260.),
            hover: ok(95., 0.008, 260.),
            sel_bg: ok(93., 0.035, 262.),
            accent: ok(50., 0.18, 262.),
            accent_text: ok(46., 0.17, 262.),
            mark: ok(53., 0.2, 30.),
            folder: ok(60., 0.13, 80.),
            k_code: ok(50., 0.15, 262.),
            k_image: ok(52., 0.15, 340.),
            k_archive: ok(52., 0.12, 45.),
            k_app: ok(50., 0.12, 150.),
            ok: ok(50., 0.13, 150.),
            warn: ok(55., 0.13, 70.),
            term_bg: ok(97., 0.004, 260.),
            term_text: ok(25., 0.015, 260.),
            term_muted: ok(50., 0.02, 260.),
        },
        Mode::Dark => Palette {
            bg: ok(16., 0.008, 260.),
            surface: ok(16., 0.008, 260.),
            rail: ok(19., 0.01, 260.),
            zebra: ok(18., 0.009, 260.),
            line: ok(28., 0.012, 260.),
            text: ok(93., 0.006, 260.),
            muted: ok(72., 0.016, 260.),
            faint: ok(58., 0.014, 260.),
            hover: ok(22., 0.012, 260.),
            sel_bg: ok(30., 0.07, 262.),
            accent: ok(72., 0.13, 262.),
            accent_text: ok(78., 0.11, 262.),
            mark: ok(72., 0.16, 30.),
            folder: ok(80., 0.11, 85.),
            k_code: ok(76., 0.1, 262.),
            k_image: ok(75., 0.11, 340.),
            k_archive: ok(75., 0.1, 45.),
            k_app: ok(75., 0.1, 150.),
            ok: ok(76., 0.13, 150.),
            warn: ok(80., 0.12, 75.),
            term_bg: ok(12., 0.008, 260.),
            term_text: ok(90., 0.008, 260.),
            term_muted: ok(66., 0.016, 260.),
        },
    }
}

pub(super) fn theme(mode: Mode) -> Theme {
    Theme {
        mode,
        c: palette(mode),
        m: Metrics {
            text: px(13.),
            small: px(12.5),
            tiny: px(11.),
            row_h: px(24.),
            radius: px(6.),
            tab_h: px(28.),
            path_h: px(28.),
            rail_w: px(236.),
            rail_item_h: px(30.),
            drawer_h: px(220.),
            fkey_h: px(36.),
            size_w: px(70.),
            date_w: px(96.),
        },
        f: Fonts {
            ui: "Archivo".into(),
            numbers: "Archivo".into(),
            mono: "JetBrains Mono".into(),
        },
    }
}
