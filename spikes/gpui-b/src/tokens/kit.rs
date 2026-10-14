use super::Theme;
use gpui_kit::App;
use gpui_kit::component::theme::{Theme as KitTheme, ThemeMode};

pub fn apply(theme: &Theme, cx: &mut App) {
    let mode = if theme.mode.is_dark() {
        ThemeMode::Dark
    } else {
        ThemeMode::Light
    };
    KitTheme::change(mode, None, cx);
    let c = theme.c.clone();
    let font = theme.f.ui.clone();
    let mono = theme.f.mono.clone();
    let radius = theme.m.radius;
    KitTheme::update(cx, move |kit| {
        kit.font_family = font;
        kit.mono_font_family = mono;
        kit.radius = radius;
        kit.shadow = false;
        let k = &mut kit.colors;
        k.background = c.bg;
        k.foreground = c.text;
        k.border = c.line;
        k.input = c.line;
        k.ring = c.accent;
        k.muted = c.hover;
        k.muted_foreground = c.muted;
        k.accent = c.hover;
        k.accent_foreground = c.text;
        k.primary = c.accent;
        k.primary_hover = c.accent_text;
        k.primary_active = c.accent_text;
        k.primary_foreground = c.bg;
        k.button_primary = c.accent;
        k.button_primary_hover = c.accent_text;
        k.button_primary_active = c.accent_text;
        k.button_primary_foreground = c.bg;
        k.button = c.surface;
        k.button_hover = c.hover;
        k.button_active = c.sel_bg;
        k.button_foreground = c.text;
        k.secondary = c.surface;
        k.secondary_hover = c.hover;
        k.secondary_active = c.sel_bg;
        k.secondary_foreground = c.text;
        k.progress_bar = c.accent;
        k.scrollbar = c.surface;
        k.scrollbar_thumb = c.line;
        k.scrollbar_thumb_hover = c.faint;
        k.popover = c.surface;
        k.popover_foreground = c.text;
    });
}
