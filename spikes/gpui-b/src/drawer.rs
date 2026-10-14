use crate::app::Workspace;
use crate::data::{CLIPS, HITS, JOBS, Job, JobState, Shelf};
use crate::file_list::kind_icon;
use crate::primitives::{action_button, icon, meter};
use crate::tokens::Theme;
use gpui_kit::assets::IconName;
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    AnyElement, Context, Div, FontWeight, InteractiveElement, IntoElement, ParentElement,
    StatefulInteractiveElement, Styled, div, px,
};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum DrawerView {
    Transfers,
    Clipboard,
    Search,
}

impl DrawerView {
    pub const ALL: [DrawerView; 3] = [
        DrawerView::Transfers,
        DrawerView::Clipboard,
        DrawerView::Search,
    ];

    pub fn next(self) -> Self {
        match self {
            DrawerView::Transfers => DrawerView::Clipboard,
            DrawerView::Clipboard => DrawerView::Search,
            DrawerView::Search => DrawerView::Transfers,
        }
    }

    fn tab(self) -> (IconName, &'static str, Option<&'static str>) {
        match self {
            DrawerView::Transfers => (IconName::Files, "Transfers", Some("2")),
            DrawerView::Clipboard => (IconName::Clipboard, "Clipboard", None),
            DrawerView::Search => (IconName::Search, "Search", Some("4")),
        }
    }
}

pub fn render(t: &Theme, view: DrawerView, cx: &mut Context<Workspace>) -> impl IntoElement {
    let body: Vec<AnyElement> = match view {
        DrawerView::Transfers => JOBS
            .iter()
            .enumerate()
            .map(|(i, job)| job_row(t, i, job).into_any_element())
            .collect(),
        DrawerView::Clipboard => shelf_rows(t, &CLIPS),
        DrawerView::Search => shelf_rows(t, &HITS),
    };
    div()
        .flex()
        .flex_col()
        .flex_none()
        .h(t.m.drawer_h)
        .overflow_hidden()
        .border_t_1()
        .border_color(t.c.line)
        .bg(t.c.surface)
        .child(header(t, view, cx))
        .child(
            div()
                .flex()
                .flex_col()
                .flex_1()
                .min_h_0()
                .justify_around()
                .py(px(4.))
                .children(body),
        )
}

fn tab(t: &Theme, view: DrawerView, is_on: bool, cx: &mut Context<Workspace>) -> impl IntoElement {
    let (glyph, label, count) = view.tab();
    div()
        .id(label)
        .flex()
        .items_center()
        .gap(px(6.))
        .h(px(26.))
        .px(px(10.))
        .rounded(t.m.radius)
        .text_size(t.m.small)
        .text_color(if is_on { t.c.text } else { t.c.muted })
        .border_1()
        .border_color(if is_on { t.c.line } else { t.c.rail })
        .when(is_on, |d| {
            d.bg(t.c.surface).font_weight(FontWeight::SEMIBOLD)
        })
        .when(!is_on, |d| d.hover(|d| d.bg(t.c.hover)))
        .on_click(cx.listener(move |this, _, window, cx| this.show_drawer(view, window, cx)))
        .child(icon(glyph, px(12.), t.c.muted))
        .child(label)
        .children(count.map(|n| badge(t, n)))
}

fn header(t: &Theme, view: DrawerView, cx: &mut Context<Workspace>) -> Div {
    let tabs: Vec<AnyElement> = DrawerView::ALL
        .into_iter()
        .map(|v| tab(t, v, v == view, cx).into_any_element())
        .collect();
    div()
        .flex()
        .items_center()
        .gap(px(6.))
        .flex_none()
        .h(px(36.))
        .px(px(6.))
        .bg(t.c.rail)
        .border_b_1()
        .border_color(t.c.line)
        .children(tabs)
        .child(
            div()
                .flex()
                .items_center()
                .justify_center()
                .size(px(26.))
                .rounded(t.m.radius)
                .border_1()
                .border_dashed()
                .border_color(t.c.line)
                .child(icon(IconName::Plus, px(12.), t.c.faint)),
        )
        .child(
            div()
                .ml_auto()
                .pr(px(6.))
                .child(icon(IconName::X, px(12.), t.c.faint)),
        )
}

fn shelf_rows(t: &Theme, items: &[Shelf]) -> Vec<AnyElement> {
    items
        .iter()
        .map(|item| {
            let (glyph, color) = kind_icon(t, item.kind);
            div()
                .flex()
                .items_center()
                .gap(px(12.))
                .px(px(12.))
                .child(icon(glyph, px(14.), color))
                .child(
                    div()
                        .flex()
                        .items_baseline()
                        .gap(px(10.))
                        .flex_1()
                        .min_w_0()
                        .child(
                            div()
                                .flex_none()
                                .font_weight(FontWeight::SEMIBOLD)
                                .child(item.name),
                        )
                        .child(
                            div()
                                .min_w_0()
                                .truncate()
                                .font_family(t.f.mono.clone())
                                .text_size(t.m.small)
                                .text_color(t.c.muted)
                                .child(item.path),
                        ),
                )
                .child(
                    div()
                        .flex_none()
                        .text_size(t.m.small)
                        .text_color(t.c.muted)
                        .child(item.meta),
                )
                .into_any_element()
        })
        .collect()
}

fn badge(t: &Theme, count: &str) -> Div {
    div()
        .flex()
        .items_center()
        .justify_center()
        .min_w(px(16.))
        .h(px(16.))
        .px(px(4.))
        .rounded(px(8.))
        .bg(t.c.accent)
        .text_color(t.c.bg)
        .font_family(t.f.mono.clone())
        .text_size(px(10.))
        .font_weight(FontWeight::SEMIBOLD)
        .child(count.to_string())
}

fn job_lines(t: &Theme, i: usize, job: &Job) -> Div {
    let bar = if job.state == JobState::Done {
        t.c.ok
    } else {
        t.c.accent
    };
    div()
        .flex()
        .flex_col()
        .gap(px(3.))
        .flex_1()
        .min_w_0()
        .child(
            div()
                .font_weight(FontWeight::SEMIBOLD)
                .truncate()
                .child(job.name),
        )
        .child(
            div()
                .flex()
                .items_center()
                .gap(px(6.))
                .font_family(t.f.mono.clone())
                .text_size(t.m.small)
                .text_color(t.c.muted)
                .child(icon(IconName::ArrowRight, px(11.), t.c.muted))
                .child(job.target),
        )
        .child(meter(("job", i), job.progress, bar))
}

fn job_row(t: &Theme, i: usize, job: &Job) -> Div {
    let percent = match job.state {
        JobState::Done => "Done".to_string(),
        _ => format!("{}%", job.progress),
    };
    div()
        .flex()
        .items_center()
        .gap(px(14.))
        .px(px(12.))
        .child(icon(IconName::Files, px(14.), t.c.accent))
        .child(job_lines(t, i, job))
        .child(
            div()
                .w(px(42.))
                .flex()
                .justify_end()
                .font_weight(FontWeight::BOLD)
                .child(percent),
        )
        .child(
            div()
                .flex()
                .flex_col()
                .w(px(108.))
                .text_size(t.m.small)
                .text_color(t.c.muted)
                .child(job.detail[0])
                .child(job.detail[1]),
        )
        .child(div().w(px(60.)).flex().justify_end().child(action_button(
            t,
            ("job-action", i),
            job.action,
        )))
}
