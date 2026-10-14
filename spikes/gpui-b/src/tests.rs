use std::time::Instant;

use crate::app::{Launch, Workspace, bind_keys};
use crate::tokens::Mode;
use gpui_kit::test::TestWindowExt;
use gpui_kit::{
    AppContext, Bounds, Entity, Point, Role, TestAppContext, WindowBounds, WindowOptions, px, size,
};

fn open(cx: &mut TestAppContext) -> (gpui_kit::AnyWindowHandle, Entity<Workspace>) {
    cx.update(|cx| {
        gpui_kit::init(cx);
        bind_keys(cx);
        let options = WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(Bounds {
                origin: Point::default(),
                size: size(px(1440.), px(900.)),
            })),
            ..Default::default()
        };
        let launch = Launch {
            mode: Mode::Light,
            big: true,
            started: Instant::now(),
            metrics: None,
        };
        let (window, content) = gpui_kit::open_window(options, cx, |window, cx| {
            cx.new(|cx| Workspace::new(launch, window, cx))
        })
        .expect("open test window");
        (window, content)
    })
}

fn cursor_and_marks(
    content: &Entity<Workspace>,
    pane: usize,
    cx: &mut TestAppContext,
) -> (usize, Vec<usize>) {
    content.read_with(cx, |workspace, _| {
        let state = workspace.pane(pane);
        (state.cursor, state.marked.iter().copied().collect())
    })
}

#[gpui_kit::test]
fn every_pane_holds_one_hundred_thousand_rows(cx: &mut TestAppContext) {
    let (_, content) = open(cx);
    let lens = content.read_with(cx, |workspace, _| {
        (0..3)
            .map(|ix| workspace.pane(ix).len())
            .collect::<Vec<_>>()
    });
    assert_eq!(lens, vec![100_000; 3]);
}

#[gpui_kit::test]
fn end_reaches_row_99_999_and_space_selects_it(cx: &mut TestAppContext) {
    let (window, content) = open(cx);
    cx.update_window(window, |_, window, cx| {
        window.render_frame(cx);
        window.press("end", cx);
        window.press("space", cx);
        window.render_frame(cx);
        let row = window.find(("row", 99_999usize));
        assert!(row.visible(), "row 99,999 is not on screen");
    })
    .expect("window");
    assert_eq!(cursor_and_marks(&content, 0, cx), (99_999, vec![99_999]));
}

#[gpui_kit::test]
fn insert_marks_and_moves_down(cx: &mut TestAppContext) {
    let (window, content) = open(cx);
    cx.update_window(window, |_, window, cx| {
        window.render_frame(cx);
        window.press("insert", cx);
        window.press("insert", cx);
    })
    .expect("window");
    assert_eq!(cursor_and_marks(&content, 0, cx), (2, vec![0, 1]));
}

#[gpui_kit::test]
fn page_down_then_home_returns_to_the_top(cx: &mut TestAppContext) {
    let (window, content) = open(cx);
    cx.update_window(window, |_, window, cx| {
        window.render_frame(cx);
        window.press("pagedown", cx);
        window.press("pagedown", cx);
    })
    .expect("window");
    let (paged, _) = cursor_and_marks(&content, 0, cx);
    assert!(paged > 20, "two pages moved only {paged} rows");
    cx.update_window(window, |_, window, cx| window.press("home", cx))
        .expect("window");
    assert_eq!(cursor_and_marks(&content, 0, cx).0, 0);
}

#[gpui_kit::test]
fn tab_moves_the_keyboard_to_the_next_pane(cx: &mut TestAppContext) {
    let (window, content) = open(cx);
    cx.update_window(window, |_, window, cx| {
        window.render_frame(cx);
        window.press("tab", cx);
        window.press("down", cx);
    })
    .expect("window");
    let active = content.read_with(cx, |workspace, _| workspace.active_pane());
    assert_eq!(active, 1);
    assert_eq!(cursor_and_marks(&content, 1, cx).0, 1);
    assert_eq!(cursor_and_marks(&content, 0, cx).0, 0);
}

#[gpui_kit::test]
fn file_lists_expose_list_and_list_item_roles_with_names(cx: &mut TestAppContext) {
    let (window, content) = open(cx);
    cx.update_window(window, |_, window, cx| {
        window.render_frame(cx);
        let expected = [
            (0usize, "core files"),
            (1usize, "Downloads files"),
            (2usize, "homelab files"),
        ];
        for (pane, name) in expected {
            let list = window.find(("filelist", pane));
            assert_eq!(list.role(), Some(Role::List));
            assert_eq!(list.label(), Some(name));
        }
        let rows = [
            (0usize, "src, folder"),
            (1, "tests, folder"),
            (2, "Cargo, 812 B, 13/10/26 19:40"),
            (3, "layout, 14 KB, 13/10/26 21:22"),
        ];
        for (index, name) in rows {
            let row = window.within(("filelist", 0usize)).find(("row", index));
            assert_eq!(row.role(), Some(Role::ListItem), "row {index}");
            assert_eq!(row.label(), Some(name), "row {index}");
            assert_eq!(row.selected(), Some(false), "row {index}");
        }
        window.press("down", cx);
        window.press("space", cx);
        window.render_frame(cx);
        assert_eq!(
            window
                .within(("filelist", 0usize))
                .find(("row", 0usize))
                .selected(),
            Some(false)
        );
        assert_eq!(
            window
                .within(("filelist", 0usize))
                .find(("row", 1usize))
                .selected(),
            Some(true)
        );
        assert_eq!(
            window
                .within(("filelist", 0usize))
                .find(("row", 2usize))
                .selected(),
            Some(false)
        );
        assert_eq!(
            window
                .within(("filelist", 0usize))
                .find(("row", 1usize))
                .focused(),
            None
        );
    })
    .expect("window");
    assert_eq!(cursor_and_marks(&content, 0, cx), (1, vec![1]));
}
