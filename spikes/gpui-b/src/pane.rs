use std::collections::BTreeSet;

use crate::app::Workspace;
use crate::data::{Entry, Folder, GENERATED_ROWS, generated};
use crate::file_list;
use crate::primitives::{icon, inset_ring, ring};
use crate::tokens::Theme;
use gpui_kit::assets::IconName;
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    AnyElement, Context, Div, FontWeight, InteractiveElement, IntoElement, MouseButton,
    ParentElement, ScrollStrategy, SharedString, StatefulInteractiveElement, Styled,
    UniformListScrollHandle, div, px,
};

pub struct PaneState {
    pub folder: Folder,
    pub cursor: usize,
    pub marked: BTreeSet<usize>,
    pub is_big: bool,
    pub scroll: UniformListScrollHandle,
}

impl PaneState {
    pub fn new(folder: Folder) -> Self {
        Self {
            folder,
            cursor: 0,
            marked: BTreeSet::new(),
            is_big: false,
            scroll: UniformListScrollHandle::new(),
        }
    }

    pub fn len(&self) -> usize {
        self.folder.entries.len() + if self.is_big { GENERATED_ROWS } else { 0 }
    }

    pub fn entry(&self, index: usize) -> Entry {
        let samples = &self.folder.entries;
        samples
            .get(index)
            .cloned()
            .unwrap_or_else(|| generated(index - samples.len()))
    }

    pub fn set_cursor(&mut self, index: usize) {
        self.cursor = index.min(self.len().saturating_sub(1));
        self.scroll
            .scroll_to_item(self.cursor, ScrollStrategy::Nearest);
    }

    pub fn move_cursor(&mut self, delta: isize) {
        self.set_cursor(self.cursor.saturating_add_signed(delta));
    }

    pub fn toggle_mark(&mut self) {
        if !self.marked.remove(&self.cursor) {
            self.marked.insert(self.cursor);
        }
    }

    pub fn toggle_big(&mut self) {
        self.is_big = !self.is_big;
        let len = self.len();
        self.marked.retain(|&ix| ix < len);
        self.set_cursor(self.cursor);
    }

    pub fn prompt(&self) -> String {
        format!("{}>", self.folder.crumbs.join("\\"))
    }

    fn status(&self) -> SharedString {
        if self.is_big {
            format!("{} rows (100,000 generated)", group(self.len())).into()
        } else {
            self.folder.status.into()
        }
    }
}

fn group(n: usize) -> String {
    let digits = n.to_string();
    let mut out = String::new();
    for (i, ch) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i).is_multiple_of(3) {
            out.push(',');
        }
        out.push(ch);
    }
    out
}

pub struct PaneProps<'a> {
    pub t: &'a Theme,
    pub ix: usize,
    pub state: &'a PaneState,
    pub is_active: bool,
}

pub fn render(p: PaneProps, cx: &mut Context<Workspace>) -> impl IntoElement {
    let t = p.t;
    let ix = p.ix;
    let frame = div()
        .id(("pane", ix))
        .flex()
        .flex_col()
        .flex_1()
        .min_w_0()
        .min_h_0()
        .overflow_hidden()
        .on_mouse_down(
            MouseButton::Left,
            cx.listener(move |this, _, window, cx| this.activate_pane(ix, window, cx)),
        );
    let frame = frame.when(ix < 2, |d| d.border_r_1().border_color(t.c.line));
    frame
        .child(tab_strip(&p))
        .child(path_bar(&p))
        .child(file_list::header(t))
        .child(file_list::list(ix, p.state, cx))
        .child(status_line(&p, cx))
}

fn tab_strip(p: &PaneProps) -> Div {
    let t = p.t;
    let folder = &p.state.folder;
    let tabs = folder
        .tabs
        .iter()
        .enumerate()
        .map(|(i, title)| tab(t, title, i == folder.active_tab, folder.tabs.len() > 1));
    let strip = div()
        .flex()
        .items_end()
        .flex_none()
        .min_w_0()
        .overflow_hidden()
        .children(tabs)
        .child(
            div()
                .px(px(8.))
                .pb(px(6.))
                .child(icon(IconName::Plus, px(13.), t.c.faint)),
        );
    strip
        .px(px(6.))
        .pt(px(6.))
        .bg(t.c.rail)
        .border_b_1()
        .border_color(t.c.line)
}

fn tab(t: &Theme, title: &str, is_on: bool, closable: bool) -> Div {
    let base = div()
        .flex()
        .items_center()
        .gap(px(6.))
        .h(t.m.tab_h)
        .px(px(10.))
        .flex_none()
        .text_size(t.m.small)
        .text_color(if is_on { t.c.text } else { t.c.muted })
        .when(is_on, |d| d.font_weight(FontWeight::SEMIBOLD))
        .child(icon(IconName::Folder, px(13.), t.c.folder))
        .child(SharedString::from(title.to_string()))
        .when(is_on, |d| d.child(icon(IconName::Copy, px(11.), t.c.faint)))
        .when(closable, |d| d.child(icon(IconName::X, px(11.), t.c.faint)));
    if !is_on {
        return base;
    }
    base.mb(px(-1.))
        .rounded_t(t.m.radius)
        .border_1()
        .border_color(t.c.line)
        .bg(t.c.surface)
}

fn crumbs(t: &Theme, parts: &[&str]) -> Vec<AnyElement> {
    let last = parts.len().saturating_sub(1);
    let mut out = Vec::new();
    for (i, part) in parts.iter().enumerate() {
        if i > 0 {
            out.push(separator(t));
        }
        out.push(
            div()
                .px(px(4.))
                .flex_none()
                .text_color(if i == last { t.c.text } else { t.c.muted })
                .when(i == last, |d| d.font_weight(FontWeight::SEMIBOLD))
                .child(SharedString::from(part.to_string()))
                .into_any_element(),
        );
    }
    out
}

fn separator(t: &Theme) -> AnyElement {
    icon(IconName::ChevronRight, px(11.), t.c.faint).into_any_element()
}

fn path_bar(p: &PaneProps) -> Div {
    let t = p.t;
    let folder = &p.state.folder;
    let ringed = p.is_active;
    let drive_cell = div()
        .flex()
        .items_center()
        .h_full()
        .px(px(8.))
        .bg(t.c.rail)
        .border_r_1()
        .border_color(t.c.line)
        .rounded_l(t.m.radius)
        .font_weight(FontWeight::BOLD)
        .child(folder.drive);
    div()
        .flex()
        .items_center()
        .gap(px(6.))
        .flex_none()
        .m(px(6.))
        .h(t.m.path_h)
        .border_1()
        .border_color(if ringed { t.c.accent } else { t.c.line })
        .rounded(t.m.radius)
        .text_size(t.m.small)
        .when(ringed, |d| d.shadow(ring(t.c.accent, px(1.))))
        .bg(t.c.surface)
        .child(drive_cell)
        .child(
            div()
                .flex()
                .items_center()
                .flex_1()
                .min_w_0()
                .overflow_hidden()
                .children(crumbs(t, folder.crumbs)),
        )
        .child(
            div()
                .pr(px(8.))
                .child(icon(IconName::Copy, px(12.), t.c.faint)),
        )
}

fn status_line(p: &PaneProps, cx: &mut Context<Workspace>) -> impl IntoElement {
    let t = p.t;
    let marked = p.state.marked.len();
    let ix = p.ix;
    let line = div()
        .flex()
        .items_center()
        .gap(px(8.))
        .flex_none()
        .h(px(26.))
        .px(px(12.))
        .text_size(t.m.small)
        .text_color(t.c.muted)
        .bg(t.c.rail)
        .border_t_1()
        .border_color(t.c.line)
        .when(marked > 0, |d| {
            d.child(
                div()
                    .text_color(t.c.mark)
                    .font_weight(FontWeight::BOLD)
                    .child(format!("{marked} marked ·")),
            )
        })
        .child(div().flex_1().min_w_0().truncate().child(p.state.status()));
    line.when(p.state.folder.can_grow, |d| {
        d.child(
            div()
                .id(("grow", ix))
                .px(px(6.))
                .rounded(px(4.))
                .border_1()
                .border_color(if p.state.is_big { t.c.accent } else { t.c.line })
                .text_color(if p.state.is_big {
                    t.c.accent_text
                } else {
                    t.c.muted
                })
                .when(p.state.is_big, |d| d.shadow(inset_ring(t.c.accent)))
                .cursor_pointer()
                .child("100k")
                .on_click(cx.listener(move |this, _, window, cx| this.toggle_big(ix, window, cx))),
        )
    })
}
