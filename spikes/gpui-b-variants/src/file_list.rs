use std::ops::Range;

use crate::app::Workspace;
use crate::data::{Entry, Git, Kind};
use crate::pane::PaneState;
use crate::primitives::{icon, inset_ring};
use crate::tokens::{Selection, Theme};
use gpui_kit::assets::IconName;
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    AnyElement, Context, Div, FontWeight, Hsla, InteractiveElement, IntoElement, MouseButton,
    ParentElement, Pixels, Styled, div, px, uniform_list,
};

const PILL_INSET: f32 = 4.;

fn side_pad(t: &Theme) -> Pixels {
    match t.m.selection {
        Selection::Square => px(10.),
        _ => px(12.),
    }
}

pub fn header(t: &Theme) -> Div {
    let label = |text: &'static str| -> String {
        if t.m.caps_heads {
            text.to_uppercase()
        } else {
            text.to_string()
        }
    };
    let cell = |text: &'static str, width: Pixels| {
        div()
            .w(width)
            .flex_none()
            .flex()
            .justify_end()
            .child(label(text))
    };
    div()
        .flex()
        .items_center()
        .gap(px(8.))
        .flex_none()
        .h(px(if t.m.caps_heads { 20. } else { 24. }))
        .px(side_pad(t))
        .text_size(if t.m.caps_heads { px(10.5) } else { t.m.tiny })
        .font_weight(FontWeight::SEMIBOLD)
        .text_color(if t.m.caps_heads { t.c.faint } else { t.c.muted })
        .border_b_1()
        .border_color(t.c.line)
        .when(!t.m.cards && !t.m.caps_heads, |d| {
            d.bg(t.c.rail).border_t_1()
        })
        .child(
            div()
                .flex()
                .items_center()
                .gap(px(5.))
                .flex_1()
                .child(label("Name"))
                .child(icon(IconName::ArrowUp, px(10.), t.c.accent_text)),
        )
        .child(cell("Size", t.m.size_w))
        .child(cell("Date", t.m.date_w))
}

pub fn list(
    t: &Theme,
    ix: usize,
    state: &PaneState,
    cx: &mut Context<Workspace>,
) -> impl IntoElement {
    uniform_list(
        ("files", ix),
        state.len(),
        cx.processor(move |this: &mut Workspace, range: Range<usize>, _, cx| {
            this.file_rows(ix, range, cx)
        }),
    )
    .track_scroll(&state.scroll)
    .flex_1()
    .min_h_0()
    .when(t.m.selection == Selection::Pill, |d| d.pt(px(2.)))
}

pub struct RowFlags {
    pub index: usize,
    pub is_cursor: bool,
    pub is_marked: bool,
    pub is_active_pane: bool,
}

pub fn rows(
    t: &Theme,
    pane: &PaneState,
    pane_ix: usize,
    is_active_pane: bool,
    range: Range<usize>,
    cx: &mut Context<Workspace>,
) -> Vec<AnyElement> {
    range
        .map(|index| {
            let flags = RowFlags {
                index,
                is_cursor: index == pane.cursor,
                is_marked: pane.marked.contains(&index),
                is_active_pane,
            };
            row(t, &pane.entry(index), &flags)
                .id(("row", index))
                .on_mouse_down(
                    MouseButton::Left,
                    cx.listener(move |this, _, window, cx| {
                        this.click_row(pane_ix, index, window, cx)
                    }),
                )
                .into_any_element()
        })
        .collect()
}

fn row(t: &Theme, entry: &Entry, f: &RowFlags) -> Div {
    let outer = div()
        .flex()
        .items_center()
        .h(t.m.row_h)
        .w_full()
        .flex_none();
    let cursor_active = f.is_cursor && f.is_active_pane;
    let cursor_idle = f.is_cursor && !f.is_active_pane;
    match t.m.selection {
        Selection::Fill => outer
            .px(side_pad(t))
            .when(t.m.zebra && f.index % 2 == 1, |d| d.bg(t.c.zebra))
            .when(cursor_active, |d| {
                d.bg(t.c.sel_bg).shadow(inset_ring(t.c.accent))
            })
            .when(cursor_idle, |d| d.shadow(inset_ring(t.c.line)))
            .child(cells(t, entry, f)),
        Selection::Square => outer
            .px(side_pad(t))
            .when(cursor_active, |d| d.bg(t.c.sel_bg))
            .when(cursor_idle, |d| d.shadow(inset_ring(t.c.line)))
            .child(cells(t, entry, f)),
        Selection::Pill => outer.px(px(PILL_INSET)).child(pill(t, entry, f)),
    }
}

fn pill(t: &Theme, entry: &Entry, f: &RowFlags) -> Div {
    let height = t.m.row_h - px(2.);
    let indicator = px(14.);
    div()
        .relative()
        .flex()
        .items_center()
        .flex_1()
        .min_w_0()
        .h(height)
        .px(side_pad(t) - px(PILL_INSET))
        .rounded(t.m.radius)
        .when(f.is_cursor, |d| {
            d.bg(if f.is_active_pane {
                t.c.sel_bg
            } else {
                t.c.hover
            })
        })
        .when(f.is_cursor && f.is_active_pane, |d| {
            d.child(
                div()
                    .absolute()
                    .left_0()
                    .top((height - indicator) / 2.)
                    .w(px(3.))
                    .h(indicator)
                    .rounded(px(2.))
                    .bg(t.c.accent),
            )
        })
        .child(cells(t, entry, f))
}

fn kind_icon(t: &Theme, kind: Kind) -> (IconName, Hsla) {
    match kind {
        Kind::Folder => (IconName::Folder, t.c.folder),
        Kind::Code => (IconName::FileCode, t.c.k_code),
        Kind::Doc => (IconName::FileText, t.c.muted),
        Kind::Image => (IconName::FileImage, t.c.k_image),
        Kind::Archive => (IconName::FileArchive, t.c.k_archive),
        Kind::App => (IconName::SquarePlus, t.c.k_app),
    }
}

fn git_badge(t: &Theme, git: Git) -> Div {
    let (label, color) = match git {
        Git::Modified => ("M", t.c.warn),
        Git::Added => ("A", t.c.ok),
    };
    div()
        .px(px(4.))
        .rounded(px(3.))
        .font_family(t.f.mono.clone())
        .text_size(px(10.))
        .font_weight(FontWeight::SEMIBOLD)
        .text_color(color)
        .bg(Hsla { a: 0.14, ..color })
        .child(label)
}

fn cells(t: &Theme, entry: &Entry, f: &RowFlags) -> Div {
    let (glyph, glyph_color) = kind_icon(t, entry.kind);
    let is_dir = entry.kind == Kind::Folder;
    let name_color = if f.is_marked { t.c.mark } else { t.c.text };
    let number_color = if f.is_marked { t.c.mark } else { t.c.muted };
    let number = |text, width| {
        div()
            .w(width)
            .flex_none()
            .flex()
            .justify_end()
            .font_family(t.f.numbers.clone())
            .text_size(t.m.small)
            .text_color(number_color)
            .when(f.is_marked, |d| d.font_weight(FontWeight::BOLD))
            .child(text)
    };
    let name = div()
        .flex()
        .items_center()
        .gap(px(8.))
        .flex_1()
        .min_w_0()
        .child(icon(glyph, px(14.), glyph_color))
        .child(
            div()
                .min_w_0()
                .truncate()
                .text_color(name_color)
                .when(is_dir || f.is_marked, |d| {
                    d.font_weight(FontWeight::SEMIBOLD)
                })
                .child(entry.name.clone()),
        )
        .when_some(entry.git, |d, git| d.child(git_badge(t, git)));
    div()
        .flex()
        .items_center()
        .gap(px(8.))
        .flex_1()
        .min_w_0()
        .child(name)
        .child(number(entry.size.clone(), t.m.size_w))
        .child(number(entry.date.clone(), t.m.date_w))
}
