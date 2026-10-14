mod faithful;
pub mod kit;

use gpui_kit::component::theme::oklch;
use gpui_kit::{Hsla, Pixels, SharedString};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Mode {
    Light,
    Dark,
}

impl Mode {
    pub fn toggled(self) -> Self {
        match self {
            Mode::Light => Mode::Dark,
            Mode::Dark => Mode::Light,
        }
    }

    pub fn is_dark(self) -> bool {
        self == Mode::Dark
    }
}

#[derive(Clone, Debug)]
pub struct Palette {
    pub bg: Hsla,
    pub surface: Hsla,
    pub rail: Hsla,
    pub zebra: Hsla,
    pub line: Hsla,
    pub text: Hsla,
    pub muted: Hsla,
    pub faint: Hsla,
    pub hover: Hsla,
    pub sel_bg: Hsla,
    pub accent: Hsla,
    pub accent_text: Hsla,
    pub mark: Hsla,
    pub folder: Hsla,
    pub k_code: Hsla,
    pub k_image: Hsla,
    pub k_archive: Hsla,
    pub k_app: Hsla,
    pub ok: Hsla,
    pub warn: Hsla,
    pub term_bg: Hsla,
    pub term_text: Hsla,
    pub term_muted: Hsla,
}

#[derive(Clone, Debug)]
pub struct Fonts {
    pub ui: SharedString,
    pub numbers: SharedString,
    pub mono: SharedString,
}

#[derive(Clone, Debug)]
pub struct Metrics {
    pub text: Pixels,
    pub small: Pixels,
    pub tiny: Pixels,
    pub row_h: Pixels,
    pub radius: Pixels,
    pub tab_h: Pixels,
    pub path_h: Pixels,
    pub rail_w: Pixels,
    pub rail_item_h: Pixels,
    pub drawer_h: Pixels,
    pub fkey_h: Pixels,
    pub size_w: Pixels,
    pub date_w: Pixels,
}

#[derive(Clone, Debug)]
pub struct Theme {
    pub mode: Mode,
    pub c: Palette,
    pub m: Metrics,
    pub f: Fonts,
}

pub fn theme(mode: Mode) -> Theme {
    faithful::theme(mode)
}

pub(crate) fn ok(lightness_pct: f32, chroma: f32, hue: f32) -> Hsla {
    oklch(lightness_pct / 100.0, chroma, hue)
}
