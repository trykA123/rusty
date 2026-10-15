use crate::data::{DRIVES, Drive, PINS, SETS};
use crate::primitives::{icon, kbd, meter};
use crate::tokens::{KbdLook, Selection, Theme};
use gpui_kit::assets::IconName;
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{Div, FontWeight, IntoElement, ParentElement, SharedString, Styled, div, px};

const SET_GLYPHS: [IconName; 3] = [IconName::Columns3, IconName::Columns2, IconName::LayoutGrid];

fn pins(t: &Theme) -> Vec<Div> {
    let pins = PINS.iter().enumerate().map(|(i, pin)| {
        let glyph = if pin.is_remote {
            IconName::Cloud
        } else {
            IconName::Pin
        };
        let key = if t.m.kbd == KbdLook::Boxed {
            format!("ctrl-{}", i + 1)
        } else {
            (i + 1).to_string()
        };
        item(t, false)
            .child(icon(glyph, px(14.), t.c.muted))
            .child(label(pin.label))
            .children(kbd(t, &key))
    });
    pins.collect()
}

fn sets(t: &Theme) -> Vec<Div> {
    let sets = SETS
        .iter()
        .zip(SET_GLYPHS)
        .enumerate()
        .map(|(i, (name, glyph))| {
            let is_on = i == 0;
            item(t, is_on)
                .child(icon(
                    glyph,
                    px(15.),
                    if is_on { t.c.accent } else { t.c.muted },
                ))
                .child(label(name))
                .children(kbd(t, &format!("alt-{}", i + 1)))
        });
    sets.collect()
}

pub fn render(t: &Theme) -> impl IntoElement {
    div()
        .flex()
        .flex_col()
        .gap(px(1.))
        .flex_none()
        .w(t.m.rail_w)
        .h_full()
        .p(px(8.))
        .overflow_hidden()
        .bg(t.c.rail)
        .when(!t.m.cards, |d| d.border_r_1().border_color(t.c.line))
        .child(top(t))
        .child(heading(t, "Pinned"))
        .children(pins(t))
        .child(heading(t, "Sets"))
        .children(sets(t))
        .child(heading(t, "Drives"))
        .children(
            DRIVES
                .iter()
                .enumerate()
                .map(|(i, drive)| drive_item(t, i, drive)),
        )
}

fn top(t: &Theme) -> Div {
    div()
        .flex()
        .items_center()
        .gap(px(10.))
        .h(px(30.))
        .pl(px(8.))
        .pr(px(6.))
        .text_size(px(11.))
        .font_weight(FontWeight::BOLD)
        .text_color(t.c.faint)
        .child(div().flex_1().child("NAVIGATOR"))
        .child(icon(IconName::Pin, px(13.), t.c.faint))
        .child(icon(IconName::ChevronLeft, px(13.), t.c.faint))
}

fn heading(t: &Theme, text: &str) -> Div {
    div()
        .mt(px(12.))
        .mb(px(4.))
        .mx(px(8.))
        .text_size(px(11.))
        .font_weight(FontWeight::BOLD)
        .text_color(t.c.faint)
        .child(text.to_uppercase())
}

fn label(text: &'static str) -> Div {
    div()
        .flex_1()
        .min_w_0()
        .truncate()
        .child(SharedString::from(text))
}

fn item(t: &Theme, is_on: bool) -> Div {
    let base = div()
        .relative()
        .flex()
        .items_center()
        .gap(px(9.))
        .min_h(t.m.rail_item_h)
        .px(px(8.))
        .rounded(t.m.radius)
        .when(is_on, |d| d.bg(t.c.sel_bg));
    if is_on && t.m.selection == Selection::Pill {
        base.child(
            div()
                .absolute()
                .left_0()
                .top((t.m.rail_item_h - px(16.)) / 2.)
                .w(px(3.))
                .h(px(16.))
                .rounded(px(2.))
                .bg(t.c.accent),
        )
    } else {
        base
    }
}

fn drive_item(t: &Theme, i: usize, drive: &Drive) -> Div {
    let glyph = if drive.is_remote {
        IconName::Cloud
    } else {
        IconName::HardDrive
    };
    item(t, false)
        .py(px(4.))
        .child(icon(glyph, px(14.), t.c.muted))
        .child(
            div()
                .flex()
                .flex_col()
                .gap(px(5.))
                .flex_1()
                .min_w_0()
                .child(label(drive.label))
                .child(meter(("drive", i), drive.used, t.c.accent)),
        )
        .child(
            div()
                .flex_none()
                .text_size(px(11.))
                .text_color(t.c.faint)
                .font_family(t.f.numbers.clone())
                .child(drive.capacity),
        )
}
