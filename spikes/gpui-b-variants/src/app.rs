use std::ops::Range;
use std::time::Instant;

use crate::data::folders;
use crate::pane::{self, PaneProps, PaneState};
use crate::tokens::{self, Mode, Theme, Variant};
use crate::{command_line, drawer, file_list, fkey_bar, rail, top_bar};
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    AnyElement, App, Context, FocusHandle, InteractiveElement, IntoElement, KeyBinding,
    ParentElement, Render, SharedString, Styled, Window, div, px,
};

gpui_kit::actions!(
    commander,
    [
        NextPane,
        PrevPane,
        CursorUp,
        CursorDown,
        PageUp,
        PageDown,
        CursorHome,
        CursorEnd,
        ToggleMark,
        MarkAndDown,
        ToggleTheme,
        ShowVariant1,
        ShowVariant2,
        ShowVariant3,
    ]
);

const CONTEXT: &str = "Commander";
const PANE_CHROME: f32 = 46. + 36. + 32. + 26. + 24. + 34. + 40.;

pub fn bind_keys(cx: &mut App) {
    let ctx = Some(CONTEXT);
    cx.bind_keys([
        KeyBinding::new("tab", NextPane, ctx),
        KeyBinding::new("shift-tab", PrevPane, ctx),
        KeyBinding::new("up", CursorUp, ctx),
        KeyBinding::new("down", CursorDown, ctx),
        KeyBinding::new("pageup", PageUp, ctx),
        KeyBinding::new("pagedown", PageDown, ctx),
        KeyBinding::new("home", CursorHome, ctx),
        KeyBinding::new("end", CursorEnd, ctx),
        KeyBinding::new("space", ToggleMark, ctx),
        KeyBinding::new("insert", MarkAndDown, ctx),
        KeyBinding::new("ctrl-t", ToggleTheme, ctx),
        KeyBinding::new("ctrl-shift-1", ShowVariant1, ctx),
        KeyBinding::new("ctrl-shift-2", ShowVariant2, ctx),
        KeyBinding::new("ctrl-shift-3", ShowVariant3, ctx),
        // Linux reports Ctrl+Shift+digit as the shifted symbol (US layout).
        KeyBinding::new("ctrl-!", ShowVariant1, ctx),
        KeyBinding::new("ctrl-@", ShowVariant2, ctx),
        KeyBinding::new("ctrl-#", ShowVariant3, ctx),
    ]);
}

pub struct Launch {
    pub variant: Variant,
    pub mode: Mode,
    pub segoe: Option<SharedString>,
    pub started: Instant,
}

pub struct Workspace {
    launch: Launch,
    theme: Theme,
    panes: Vec<PaneState>,
    active: usize,
    focus: FocusHandle,
    is_first_frame: bool,
}

impl Workspace {
    pub fn new(launch: Launch, window: &mut Window, cx: &mut Context<Self>) -> Self {
        let theme = tokens::theme(launch.variant, launch.mode, launch.segoe.clone());
        tokens::kit::apply(&theme, cx);
        let focus = cx.focus_handle();
        window.focus(&focus, cx);
        Self {
            launch,
            theme,
            panes: folders().into_iter().map(PaneState::new).collect(),
            active: 0,
            focus,
            is_first_frame: true,
        }
    }

    fn retheme(&mut self, cx: &mut Context<Self>) {
        let l = &self.launch;
        self.theme = tokens::theme(l.variant, l.mode, l.segoe.clone());
        tokens::kit::apply(&self.theme, cx);
        cx.notify();
    }

    pub fn set_variant(&mut self, variant: Variant, window: &mut Window, cx: &mut Context<Self>) {
        self.launch.variant = variant;
        window.focus(&self.focus, cx);
        self.retheme(cx);
    }

    pub fn activate_pane(&mut self, ix: usize, window: &mut Window, cx: &mut Context<Self>) {
        self.active = ix;
        window.focus(&self.focus, cx);
        cx.notify();
    }

    pub fn click_row(
        &mut self,
        ix: usize,
        row: usize,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.panes[ix].set_cursor(row);
        self.activate_pane(ix, window, cx);
    }

    pub fn toggle_big(&mut self, ix: usize, window: &mut Window, cx: &mut Context<Self>) {
        self.panes[ix].toggle_big();
        self.activate_pane(ix, window, cx);
    }

    pub fn file_rows(
        &self,
        ix: usize,
        range: Range<usize>,
        cx: &mut Context<Self>,
    ) -> Vec<AnyElement> {
        file_list::rows(
            &self.theme,
            &self.panes[ix],
            ix,
            ix == self.active,
            range,
            cx,
        )
    }

    fn page_rows(&self, window: &Window) -> isize {
        let m = &self.theme.m;
        let list = window.viewport_size().height - m.drawer_h - m.fkey_h - px(PANE_CHROME);
        ((list / m.row_h).floor() as isize - 1).max(1)
    }

    fn with_cursor(&mut self, cx: &mut Context<Self>, edit: impl FnOnce(&mut PaneState)) {
        edit(&mut self.panes[self.active]);
        cx.notify();
    }

    fn cycle_pane(&mut self, step: usize, cx: &mut Context<Self>) {
        self.active = (self.active + step) % self.panes.len();
        cx.notify();
    }

    fn register_cursor_actions(
        &self,
        root: gpui_kit::Div,
        cx: &mut Context<Self>,
    ) -> gpui_kit::Div {
        root.on_action(cx.listener(|this, _: &NextPane, _, cx| this.cycle_pane(1, cx)))
            .on_action(cx.listener(|this, _: &PrevPane, _, cx| this.cycle_pane(2, cx)))
            .on_action(
                cx.listener(|this, _: &CursorUp, _, cx| {
                    this.with_cursor(cx, |p| p.move_cursor(-1))
                }),
            )
            .on_action(
                cx.listener(|this, _: &CursorDown, _, cx| {
                    this.with_cursor(cx, |p| p.move_cursor(1))
                }),
            )
            .on_action(cx.listener(|this, _: &PageUp, window, cx| {
                let page = this.page_rows(window);
                this.with_cursor(cx, |p| p.move_cursor(-page))
            }))
            .on_action(cx.listener(|this, _: &PageDown, window, cx| {
                let page = this.page_rows(window);
                this.with_cursor(cx, |p| p.move_cursor(page))
            }))
            .on_action(
                cx.listener(|this, _: &CursorHome, _, cx| {
                    this.with_cursor(cx, |p| p.set_cursor(0))
                }),
            )
            .on_action(cx.listener(|this, _: &CursorEnd, _, cx| {
                this.with_cursor(cx, |p| p.set_cursor(usize::MAX))
            }))
            .on_action(cx.listener(|this, _: &ToggleMark, _, cx| {
                this.with_cursor(cx, PaneState::toggle_mark)
            }))
            .on_action(cx.listener(|this, _: &MarkAndDown, _, cx| {
                this.with_cursor(cx, |p| {
                    p.toggle_mark();
                    p.move_cursor(1);
                })
            }))
    }

    fn register_view_actions(&self, root: gpui_kit::Div, cx: &mut Context<Self>) -> gpui_kit::Div {
        root.on_action(cx.listener(|this, _: &ToggleTheme, _, cx| {
            this.launch.mode = this.launch.mode.toggled();
            this.retheme(cx);
        }))
        .on_action(
            cx.listener(|this, _: &ShowVariant1, w, cx| this.set_variant(Variant::Faithful, w, cx)),
        )
        .on_action(
            cx.listener(|this, _: &ShowVariant2, w, cx| this.set_variant(Variant::Fluent, w, cx)),
        )
        .on_action(
            cx.listener(|this, _: &ShowVariant3, w, cx| this.set_variant(Variant::Dense, w, cx)),
        )
    }

    fn log_first_frame(&mut self, window: &mut Window) {
        if !self.is_first_frame {
            return;
        }
        self.is_first_frame = false;
        let started = self.launch.started;
        eprintln!(
            "[{:>8.1} ms] first render call",
            started.elapsed().as_secs_f64() * 1000.0
        );
        window.on_next_frame(move |_, _| {
            eprintln!("first frame: {:?} after main()", started.elapsed())
        });
    }
}

impl Render for Workspace {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        self.log_first_frame(window);
        let t = self.theme.clone();
        let panes = self.panes.iter().enumerate().map(|(ix, state)| {
            let props = PaneProps {
                t: &t,
                ix,
                state,
                is_active: ix == self.active,
            };
            pane::render(props, cx).into_any_element()
        });
        let panes: Vec<AnyElement> = panes.collect();
        let root = div()
            .key_context(CONTEXT)
            .track_focus(&self.focus)
            .flex()
            .flex_col()
            .size_full()
            .bg(t.c.bg)
            .text_color(t.c.text)
            .font_family(t.f.ui.clone())
            .text_size(t.m.text)
            .line_height(px(17.5))
            .child(top_bar::render(&t, self.launch.variant, cx))
            .child(
                div()
                    .flex()
                    .flex_1()
                    .min_h_0()
                    .child(rail::render(&t))
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .flex_1()
                            .min_w_0()
                            .child(
                                div()
                                    .flex()
                                    .flex_1()
                                    .min_h_0()
                                    .when(t.m.cards, |d| d.gap(t.m.pane_gap).p(t.m.pane_gap))
                                    .children(panes),
                            )
                            .child(drawer::render(&t))
                            .child(command_line::render(&t, self.panes[self.active].prompt())),
                    ),
            )
            .child(fkey_bar::render(&t));
        let root = self.register_cursor_actions(root, cx);
        self.register_view_actions(root, cx)
    }
}
