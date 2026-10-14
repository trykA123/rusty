use crate::tokens::Theme;
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{IntoElement, ParentElement, Styled, div, px};

pub fn render(t: &Theme, prompt: String) -> impl IntoElement {
    div()
        .flex()
        .items_center()
        .gap(px(8.))
        .flex_none()
        .h(px(32.))
        .px(px(12.))
        .border_t_1()
        .border_color(t.c.line)
        .bg(t.c.term_bg)
        .when(t.m.cards, |d| {
            d.mx(px(6.)).mb(px(2.)).rounded(t.m.radius).border_1()
        })
        .font_family(t.f.mono.clone())
        .text_size(t.m.small)
        .child(div().text_color(t.c.term_text).child(prompt))
        .child(
            div()
                .text_color(t.c.term_muted)
                .child("type a command, or ! for PowerShell"),
        )
}
