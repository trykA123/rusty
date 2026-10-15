use crate::tokens::{KbdLook, Theme};
use gpui_kit::assets::IconName;
use gpui_kit::component::button::{Button, ButtonVariants};
use gpui_kit::component::kbd::Kbd;
use gpui_kit::component::progress::Progress;
use gpui_kit::component::{Icon, Sizable, Size};
use gpui_kit::{
    BoxShadow, ElementId, FontWeight, Hsla, Keystroke, Pixels, SharedString, Styled, point, px,
    transparent_black,
};

pub fn icon(name: IconName, size: Pixels, color: Hsla) -> Icon {
    Icon::new(name).size(size).flex_none().text_color(color)
}

pub fn kbd(t: &Theme, keys: &str) -> Option<Kbd> {
    let stroke = Keystroke::parse(keys).ok()?;
    let base = Kbd::new(stroke)
        .font_family(t.f.mono.clone())
        .text_size(px(10.5))
        .font_weight(FontWeight::MEDIUM)
        .rounded(px(4.));
    Some(match t.m.kbd {
        KbdLook::Outline => base
            .outline()
            .bg(transparent_black())
            .border_color(t.c.line)
            .text_color(t.c.muted),
        KbdLook::Quiet => base.bg(t.c.hover).text_color(t.c.faint),
        KbdLook::Boxed => base
            .outline()
            .bg(t.c.surface)
            .border_color(t.c.line)
            .text_color(t.c.text)
            .rounded(px(2.)),
    })
}

pub fn meter(id: impl Into<ElementId>, percent: f32, color: Hsla) -> Progress {
    Progress::new(id)
        .value(percent)
        .color(color)
        .with_size(Size::Size(px(4.)))
}

pub fn action_button(t: &Theme, id: impl Into<ElementId>, label: &'static str) -> Button {
    Button::new(id)
        .label(label)
        .small()
        .outline()
        .font_family(t.f.ui.clone())
        .text_size(t.m.small)
        .text_color(t.c.text)
}

pub fn segment(id: impl Into<ElementId>, label: impl Into<SharedString>, active: bool) -> Button {
    let button = Button::new(id).label(label).xsmall().compact();
    if active {
        button.primary()
    } else {
        button.ghost()
    }
}

pub fn ring(color: Hsla, width: Pixels) -> Vec<BoxShadow> {
    vec![BoxShadow {
        color,
        offset: point(px(0.), px(0.)),
        blur_radius: px(0.),
        spread_radius: width,
        inset: false,
    }]
}

pub fn inset_ring(color: Hsla) -> Vec<BoxShadow> {
    vec![BoxShadow {
        color,
        offset: point(px(0.), px(0.)),
        blur_radius: px(0.),
        spread_radius: px(1.),
        inset: true,
    }]
}
