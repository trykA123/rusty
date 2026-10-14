use crate::app::Workspace;
use crate::picker;
use crate::primitives::{icon, kbd};
use crate::tokens::{Theme, Variant};
use gpui_kit::assets::IconName;
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{Context, Div, FontWeight, IntoElement, ParentElement, Styled, div, px};

pub fn render(t: &Theme, variant: Variant, cx: &mut Context<Workspace>) -> impl IntoElement {
    div()
        .flex()
        .items_center()
        .gap(px(16.))
        .flex_none()
        .h(px(46.))
        .px(px(12.))
        .border_b_1()
        .border_color(t.c.line)
        .when(t.m.cards, |d| d.bg(t.c.bg).border_color(t.c.bg))
        .child(brand(t))
        .child(tools(t))
        .child(search(t))
        .child(picker::render(t, variant, cx))
}

fn brand(t: &Theme) -> Div {
    div()
        .flex()
        .items_center()
        .gap(px(8.))
        .w(t.m.rail_w - px(30.))
        .text_size(px(14.))
        .font_weight(FontWeight::BOLD)
        .child(icon(IconName::Layers, px(16.), t.c.accent))
        .child("Rusty")
}

fn tool(t: &Theme, glyph: IconName, is_on: bool) -> Div {
    div()
        .p(px(6.))
        .rounded(t.m.radius.max(px(4.)))
        .when(is_on, |d| d.bg(t.c.hover))
        .child(icon(
            glyph,
            px(15.),
            if is_on { t.c.text } else { t.c.muted },
        ))
}

fn tools(t: &Theme) -> Div {
    div()
        .flex()
        .gap(px(2.))
        .child(tool(t, IconName::PanelLeft, false))
        .child(tool(t, IconName::Layers, true))
}

fn search(t: &Theme) -> Div {
    div()
        .flex()
        .items_center()
        .gap(px(10.))
        .ml_auto()
        .w(px(520.))
        .flex_shrink(1.)
        .h(px(30.))
        .pl(px(12.))
        .pr(px(6.))
        .border_1()
        .border_color(t.c.line)
        .rounded(t.m.radius + px(1.))
        .text_color(t.c.muted)
        .when(t.m.cards, |d| d.bg(t.c.surface))
        .child(icon(IconName::Search, px(14.), t.c.muted))
        .child(
            div()
                .flex_1()
                .child("Find anywhere: files, folders, commands"),
        )
        .children(kbd(t, "ctrl-k"))
}
