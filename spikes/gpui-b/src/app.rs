use std::ops::Range;
use std::time::{Duration, Instant};

use crate::data::folders;
use crate::drawer::DrawerView;
use crate::metrics::{self, Destination, Recorder, Report, Tick};
use crate::pane::{self, PaneProps, PaneState};
use crate::tokens::{self, Mode, Theme};
use crate::{command_line, drawer, file_list, fkey_bar, rail, top_bar};
use gpui_kit::{
    AnyElement, App, Context, FocusHandle, InteractiveElement, IntoElement, KeyBinding,
    ParentElement, Render, Styled, Window, div, px,
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
        CycleDrawer,
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
        KeyBinding::new("f9", CycleDrawer, ctx),
    ]);
}

pub struct Launch {
    pub mode: Mode,
    pub big: bool,
    pub started: Instant,
    pub metrics: Option<Destination>,
}

pub struct Workspace {
    launch: Launch,
    theme: Theme,
    panes: Vec<PaneState>,
    active: usize,
    drawer: DrawerView,
    focus: FocusHandle,
    is_first_frame: bool,
    first_frame_ms: Option<f64>,
    recorder: Option<Recorder>,
}

impl Workspace {
    pub fn new(launch: Launch, window: &mut Window, cx: &mut Context<Self>) -> Self {
        let theme = tokens::theme(launch.mode);
        let big = launch.big;
        tokens::kit::apply(&theme, cx);
        let focus = cx.focus_handle();
        window.focus(&focus, cx);
        Self {
            launch,
            theme,
            panes: folders()
                .into_iter()
                .map(|folder| {
                    let mut pane = PaneState::new(folder);
                    if big {
                        pane.toggle_big();
                    }
                    pane
                })
                .collect(),
            active: 0,
            drawer: DrawerView::Transfers,
            focus,
            is_first_frame: true,
            first_frame_ms: None,
            recorder: None,
        }
    }

    #[cfg(test)]
    pub fn pane(&self, ix: usize) -> &PaneState {
        &self.panes[ix]
    }

    #[cfg(test)]
    pub fn active_pane(&self) -> usize {
        self.active
    }

    fn retheme(&mut self, cx: &mut Context<Self>) {
        self.theme = tokens::theme(self.launch.mode);
        tokens::kit::apply(&self.theme, cx);
        cx.notify();
    }

    pub fn show_drawer(&mut self, view: DrawerView, window: &mut Window, cx: &mut Context<Self>) {
        self.drawer = view;
        window.focus(&self.focus, cx);
        cx.notify();
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
        .on_action(cx.listener(|this, _: &CycleDrawer, window, cx| {
            this.show_drawer(this.drawer.next(), window, cx)
        }))
    }

    fn log_first_frame(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if !self.is_first_frame {
            return;
        }
        self.is_first_frame = false;
        let started = self.launch.started;
        eprintln!(
            "[{:>8.1} ms] first render call",
            started.elapsed().as_secs_f64() * 1000.0
        );
        let this = cx.weak_entity();
        window.on_next_frame(move |window, cx| {
            eprintln!("first frame: {:?} after main()", started.elapsed());
            let ms = started.elapsed().as_secs_f64() * 1000.0;
            this.update(cx, |this, cx| this.start_metrics(ms, window, cx))
                .ok();
        });
    }

    fn start_metrics(&mut self, first_frame_ms: f64, window: &mut Window, cx: &mut Context<Self>) {
        if self.launch.metrics.is_none() {
            return;
        }
        self.first_frame_ms = Some(first_frame_ms);
        let window_len = Duration::from_secs(metrics::SCROLL_SECONDS);
        self.recorder = Some(Recorder::begin(Instant::now(), window_len));
        self.scroll_step(window, cx);
    }

    fn scroll_step(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let Some(recorder) = self.recorder.as_mut() else {
            return;
        };
        if recorder.tick(Instant::now()) == Tick::Done {
            let idle = Duration::from_secs(metrics::IDLE_SECONDS);
            cx.spawn_in(window, async move |this, cx| {
                cx.background_executor().timer(idle).await;
                this.update_in(cx, |this, window, cx| this.finish_metrics(window, cx))
                    .ok();
            })
            .detach();
            return;
        }
        let page = self.page_rows(window);
        let pane = &mut self.panes[self.active];
        if pane.cursor + 1 >= pane.len() {
            pane.set_cursor(0);
        } else {
            pane.move_cursor(page);
        }
        cx.notify();
        let this = cx.weak_entity();
        window.on_next_frame(move |window, cx| {
            this.update(cx, |this, cx| this.scroll_step(window, cx))
                .ok();
        });
    }

    fn finish_metrics(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let (Some(dest), Some(recorder)) = (self.launch.metrics.as_ref(), self.recorder.as_ref())
        else {
            return;
        };
        let gpu = window.gpu_specs().map(|specs| specs.device_name);
        let report = Report::collect(
            gpu,
            self.first_frame_ms,
            recorder.finish(),
            metrics::Memory::read(),
        );
        if let Err(err) = report.write(dest) {
            eprintln!("could not write the metrics: {err}");
        }
        cx.quit();
    }
}

impl Render for Workspace {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        self.log_first_frame(window, cx);
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
            .child(top_bar::render(&t))
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
                            .child(div().flex().flex_1().min_h_0().children(panes))
                            .child(drawer::render(&t, self.drawer, cx))
                            .child(command_line::render(&t, self.panes[self.active].prompt())),
                    ),
            )
            .child(fkey_bar::render(&t));
        let root = self.register_cursor_actions(root, cx);
        self.register_view_actions(root, cx)
    }
}
