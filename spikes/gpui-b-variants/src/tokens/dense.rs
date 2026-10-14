use super::{ActiveMark, Fonts, KbdLook, Metrics, Mode, Selection, Theme, faithful};
use gpui_kit::px;

pub(super) fn theme(mode: Mode) -> Theme {
    Theme {
        mode,
        c: faithful::palette(mode),
        m: Metrics {
            text: px(12.5),
            small: px(12.),
            tiny: px(11.),
            row_h: px(20.),
            radius: px(0.),
            card_radius: px(0.),
            pane_gap: px(0.),
            tab_h: px(26.),
            path_h: px(0.),
            rail_w: px(220.),
            rail_item_h: px(24.),
            drawer_h: px(176.),
            fkey_h: px(28.),
            size_w: px(72.),
            date_w: px(112.),
            zebra: false,
            selection: Selection::Square,
            active: ActiveMark::TopBorder,
            kbd: KbdLook::Boxed,
            merged_path: true,
            caps_heads: true,
            cards: false,
        },
        f: Fonts {
            ui: "Archivo".into(),
            numbers: "JetBrains Mono".into(),
            mono: "JetBrains Mono".into(),
        },
    }
}
