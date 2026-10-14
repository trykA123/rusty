use crate::app::Workspace;
use crate::primitives::segment;
use crate::tokens::{Theme, Variant};
use gpui_kit::{Context, IntoElement, ParentElement, Styled, div, px};

pub fn render(t: &Theme, current: Variant, cx: &mut Context<Workspace>) -> impl IntoElement {
    let buttons = Variant::ALL.into_iter().enumerate().map(|(i, variant)| {
        segment(("variant", i), variant.label(), variant == current)
            .w(px(28.))
            .on_click(cx.listener(move |this, _, window, cx| this.set_variant(variant, window, cx)))
    });
    div()
        .flex()
        .items_center()
        .gap(px(2.))
        .p(px(2.))
        .ml(px(12.))
        .rounded(px(8.))
        .border_1()
        .border_color(t.c.line)
        .children(buttons)
}
