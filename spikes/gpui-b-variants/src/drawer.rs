use crate::data::{JOBS, Job, JobState};
use crate::primitives::{action_button, icon, meter};
use crate::tokens::Theme;
use gpui_kit::assets::IconName;
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{Div, FontWeight, IntoElement, ParentElement, Styled, div, px};

const TABS: [(IconName, &str, Option<&str>); 3] = [
    (IconName::Files, "Transfers", Some("2")),
    (IconName::Clipboard, "Clipboard", None),
    (IconName::Search, "Search", Some("4")),
];

pub fn render(t: &Theme) -> impl IntoElement {
    div()
        .flex()
        .flex_col()
        .flex_none()
        .h(t.m.drawer_h)
        .overflow_hidden()
        .when(!t.m.cards, |d| {
            d.border_t_1().border_color(t.c.line).bg(t.c.surface)
        })
        .child(header(t))
        .child(
            div()
                .flex()
                .flex_col()
                .flex_1()
                .min_h_0()
                .justify_around()
                .py(px(4.))
                .children(JOBS.iter().enumerate().map(|(i, job)| job_row(t, i, job))),
        )
}

fn header(t: &Theme) -> Div {
    let tabs = TABS.iter().enumerate().map(|(i, (glyph, label, count))| {
        let is_on = i == 0;
        div()
            .flex()
            .items_center()
            .gap(px(6.))
            .h(px(26.))
            .px(px(10.))
            .rounded(t.m.radius)
            .text_size(t.m.small)
            .text_color(if is_on { t.c.text } else { t.c.muted })
            .when(is_on, |d| {
                d.bg(t.c.surface)
                    .font_weight(FontWeight::SEMIBOLD)
                    .border_1()
                    .border_color(t.c.line)
            })
            .child(icon(*glyph, px(12.), t.c.muted))
            .child(*label)
            .children(count.map(|n| badge(t, n)))
    });
    div()
        .flex()
        .items_center()
        .gap(px(6.))
        .flex_none()
        .h(px(36.))
        .px(px(6.))
        .when(!t.m.cards, |d| {
            d.bg(t.c.rail).border_b_1().border_color(t.c.line)
        })
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
