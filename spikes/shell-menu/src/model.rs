use serde::Serialize;

#[derive(Serialize)]
pub struct Report {
    pub items: Vec<String>,
    pub passes: Vec<Pass>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invoke: Option<InvokeReport>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub explorer_commands: Option<ExplorerReport>,
}

#[derive(Serialize)]
pub struct Pass {
    pub flags: &'static str,
    pub query_ms: f64,
    pub command_count: u32,
    pub walk_ms: f64,
    pub stats: Stats,
    pub menu: Vec<Node>,
}

#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Node {
    Separator,
    Item(Item),
}

#[derive(Serialize)]
pub struct Item {
    pub id: u32,
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verb: Option<String>,
    pub enabled: bool,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub checked: bool,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub default: bool,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub owner_drawn: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<Icon>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub submenu: Option<Submenu>,
}

#[derive(Serialize)]
pub struct Icon {
    pub source: &'static str,
    #[serde(flatten)]
    pub rgba: Option<RgbaInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct RgbaInfo {
    pub width: u32,
    pub height: u32,
    pub source_bits: u16,
    pub rgba_bytes: usize,
    pub alpha_pixels: usize,
}

#[derive(Serialize)]
pub struct Submenu {
    pub items_before_init: usize,
    pub init_ms: f64,
    pub init_by: String,
    pub children: Vec<Node>,
}

#[derive(Serialize, Default, Debug, PartialEq)]
pub struct Stats {
    pub items: usize,
    pub separators: usize,
    pub submenus: usize,
    pub verbs: usize,
    pub owner_drawn: usize,
    pub icons: usize,
    pub icons_converted: usize,
    pub submenus_filled_by_init: usize,
    pub submenu_init_ms_total: f64,
    pub submenu_init_ms_max: f64,
}

impl Stats {
    pub fn of(nodes: &[Node]) -> Self {
        let mut stats = Self::default();
        stats.add(nodes);
        stats.submenu_init_ms_total = ms_round(stats.submenu_init_ms_total);
        stats
    }

    fn add(&mut self, nodes: &[Node]) {
        for node in nodes {
            match node {
                Node::Separator => self.separators += 1,
                Node::Item(item) => self.add_item(item),
            }
        }
    }

    fn add_item(&mut self, item: &Item) {
        self.items += 1;
        self.verbs += usize::from(item.verb.is_some());
        self.owner_drawn += usize::from(item.owner_drawn);
        if let Some(icon) = &item.icon {
            self.icons += 1;
            self.icons_converted += usize::from(icon.rgba.is_some());
        }
        if let Some(sub) = &item.submenu {
            self.submenus += 1;
            let filled = sub.items_before_init == 0 && !sub.children.is_empty();
            self.submenus_filled_by_init += usize::from(filled);
            self.submenu_init_ms_total += sub.init_ms;
            self.submenu_init_ms_max = self.submenu_init_ms_max.max(sub.init_ms);
            self.add(&sub.children);
        }
    }
}

pub fn ms_round(ms: f64) -> f64 {
    (ms * 1000.0).round() / 1000.0
}

pub fn find<'a>(nodes: &'a [Node], pred: &dyn Fn(&Item) -> bool) -> Option<&'a Item> {
    nodes.iter().find_map(|node| match node {
        Node::Separator => None,
        Node::Item(item) if pred(item) => Some(item),
        Node::Item(item) => item.submenu.as_ref().and_then(|s| find(&s.children, pred)),
    })
}

pub fn plain_text(text: &str) -> String {
    let label = text.split('\t').next().unwrap_or_default();
    let mut out = String::with_capacity(label.len());
    let mut chars = label.chars().peekable();
    while let Some(c) = chars.next() {
        if c != '&' {
            out.push(c);
        } else if chars.peek() == Some(&'&') {
            out.push('&');
            chars.next();
        }
    }
    out
}

#[derive(Serialize)]
pub struct InvokeReport {
    pub target: String,
    pub resolved: String,
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub ms: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clipboard: Option<Clipboard>,
}

#[derive(Serialize)]
pub struct Clipboard {
    pub format_count: i32,
    pub formats: Vec<String>,
}

#[derive(Serialize)]
pub struct ExplorerReport {
    pub registry_keys: Vec<String>,
    pub registry: Vec<RegistryCommand>,
    pub packaged: PackagedReport,
    pub ms: f64,
}

#[derive(Serialize)]
pub struct RegistryCommand {
    pub key: String,
    pub verb: String,
    pub clsid: String,
    pub in_classic_menu: bool,
    pub probe: CommandProbe,
}

#[derive(Serialize)]
pub struct PackagedReport {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub packages: usize,
    pub manifests_read: usize,
    pub commands: Vec<PackagedCommand>,
}

#[derive(Serialize)]
pub struct PackagedCommand {
    pub package: String,
    pub item_type: String,
    pub verb_id: String,
    pub clsid: String,
    pub applies_to_selection: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub probe: Option<CommandProbe>,
}

#[derive(Serialize, Default)]
pub struct CommandProbe {
    pub created: bool,
    pub ms: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initialize: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flags: Option<u32>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub sub_commands: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn item(text: &str, verb: Option<&str>, submenu: Option<Submenu>) -> Node {
        Node::Item(Item {
            id: 1,
            text: text.into(),
            verb: verb.map(Into::into),
            enabled: true,
            checked: false,
            default: false,
            owner_drawn: false,
            icon: None,
            submenu,
        })
    }

    fn tree() -> Vec<Node> {
        let send_to = Submenu {
            items_before_init: 0,
            init_ms: 2.5,
            init_by: "IContextMenu3".into(),
            children: vec![item("&Desktop", None, None), Node::Separator],
        };
        vec![
            item("&Copy", Some("copy"), None),
            Node::Separator,
            item("Se&nd to", None, Some(send_to)),
        ]
    }

    #[test]
    fn stats_count_nested_nodes() {
        let stats = Stats::of(&tree());
        assert_eq!(stats.items, 3);
        assert_eq!(stats.separators, 2);
        assert_eq!(stats.submenus, 1);
        assert_eq!(stats.submenus_filled_by_init, 1);
        assert_eq!(stats.verbs, 1);
        assert_eq!(stats.submenu_init_ms_max, 2.5);
    }

    #[test]
    fn find_searches_submenus() {
        let nodes = tree();
        let found = find(&nodes, &|i| plain_text(&i.text) == "Desktop");
        assert!(found.is_some());
    }

    #[test]
    fn plain_text_strips_access_keys_and_accelerators() {
        assert_eq!(plain_text("Se&nd to"), "Send to");
        assert_eq!(plain_text("A && B\tCtrl+C"), "A & B");
    }
}
