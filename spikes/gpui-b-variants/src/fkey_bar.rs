use crate::data::FKEYS;
use crate::primitives::kbd;
use crate::tokens::{KbdLook, Theme};
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{Div, FontWeight, IntoElement, ParentElement, Styled, div, px};

pub fn render(t: &Theme) -> impl IntoElement {
    div()
        .flex()
        .flex_none()
        .h(t.m.fkey_h)
        .border_t_1()
        .border_color(t.c.line)
        .when(t.m.cards, |d| {
            d.gap(px(4.)).p(px(4.)).bg(t.c.bg).border_color(t.c.bg)
        })
        .when(!t.m.cards, |d| d.gap(px(1.)).bg(t.c.line))
        .children(FKEYS.iter().map(|(key, label)| cell(t, key, label)))
}

fn cell(t: &Theme, key: &str, label: &'static str) -> Div {
    let hint = kbd(t, &key.to_lowercase()).map(|k| match t.m.kbd {
        KbdLook::Boxed => k,
        _ => k
            .border_0()
            .px_0()
            .bg(gpui_kit::transparent_black())
            .text_color(t.c.accent_text)
            .font_weight(FontWeight::BOLD),
    });
    div()
        .flex()
        .items_center()
        .justify_center()
        .gap(px(8.))
        .flex_1()
        .text_size(t.m.small)
        .font_weight(FontWeight::MEDIUM)
        .when(t.m.cards, |d| d.rounded(t.m.radius).bg(t.c.surface))
        .when(!t.m.cards, |d| d.bg(t.c.rail))
        .children(hint)
        .child(label)
}
