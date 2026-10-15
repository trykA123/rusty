use crate::data::FKEYS;
use crate::primitives::kbd;
use crate::tokens::Theme;
use gpui_kit::{Div, FontWeight, IntoElement, ParentElement, Styled, div, px};

pub fn render(t: &Theme) -> impl IntoElement {
    div()
        .flex()
        .flex_none()
        .h(t.m.fkey_h)
        .border_t_1()
        .border_color(t.c.line)
        .gap(px(1.))
        .bg(t.c.line)
        .children(FKEYS.iter().map(|(key, label)| cell(t, key, label)))
}

fn cell(t: &Theme, key: &str, label: &'static str) -> Div {
    let hint = kbd(t, &key.to_lowercase()).map(|k| {
        k.border_0()
            .px_0()
            .bg(gpui_kit::transparent_black())
            .text_color(t.c.accent_text)
            .font_weight(FontWeight::BOLD)
    });
    div()
        .flex()
        .items_center()
        .justify_center()
        .gap(px(8.))
        .flex_1()
        .text_size(t.m.small)
        .font_weight(FontWeight::MEDIUM)
        .bg(t.c.rail)
        .children(hint)
        .child(label)
}
