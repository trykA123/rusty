#[derive(Debug, PartialEq)]
pub struct MenuVerb {
    pub item_type: String,
    pub verb_id: String,
    pub clsid: String,
}

const CATEGORY: &str = "windows.fileExplorerContextMenus";

pub fn context_menu_verbs(xml: &str) -> Result<Vec<MenuVerb>, roxmltree::Error> {
    let doc = roxmltree::Document::parse(xml)?;
    let verbs = doc
        .descendants()
        .filter(|n| n.tag_name().name() == "Extension" && n.attribute("Category") == Some(CATEGORY))
        .flat_map(|ext| {
            ext.descendants()
                .filter(|n| n.tag_name().name() == "ItemType")
        })
        .flat_map(|item_type| {
            let kind = item_type.attribute("Type").unwrap_or_default().to_owned();
            item_type
                .children()
                .filter(|n| n.tag_name().name() == "Verb")
                .map(move |verb| MenuVerb {
                    item_type: kind.clone(),
                    verb_id: verb.attribute("Id").unwrap_or_default().to_owned(),
                    clsid: verb.attribute("Clsid").unwrap_or_default().to_owned(),
                })
        })
        .collect();
    Ok(verbs)
}

pub fn applies(item_type: &str, is_dir: bool, extension: Option<&str>) -> bool {
    match item_type {
        "*" => !is_dir,
        "Directory" | "Folder" => is_dir,
        t if t.starts_with('.') => extension.is_some_and(|e| t[1..].eq_ignore_ascii_case(e)),
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const XML: &str = r#"<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
        xmlns:desktop4="http://schemas.microsoft.com/appx/manifest/desktop/windows10/4"
        xmlns:desktop5="http://schemas.microsoft.com/appx/manifest/desktop/windows10/5">
      <Applications><Application Id="App"><Extensions>
        <desktop4:Extension Category="windows.fileExplorerContextMenus">
          <desktop4:FileExplorerContextMenus>
            <desktop5:ItemType Type="Directory">
              <desktop5:Verb Id="Open" Clsid="9f156763-7844-4dc4-b2b1-901f640f5155" />
            </desktop5:ItemType>
            <desktop5:ItemType Type="*">
              <desktop5:Verb Id="Edit" Clsid="CAFEF00D-0000-0000-0000-000000000000" />
            </desktop5:ItemType>
          </desktop4:FileExplorerContextMenus>
        </desktop4:Extension>
        <desktop4:Extension Category="windows.other"><desktop5:ItemType Type="*"><desktop5:Verb Id="X" Clsid="1"/></desktop5:ItemType></desktop4:Extension>
      </Extensions></Application></Applications></Package>"#;

    #[test]
    fn reads_verbs_of_the_context_menu_category_only() {
        let verbs = context_menu_verbs(XML).unwrap();
        assert_eq!(verbs.len(), 2);
        assert_eq!(verbs[0].item_type, "Directory");
        assert_eq!(verbs[0].verb_id, "Open");
        assert_eq!(verbs[1].clsid, "CAFEF00D-0000-0000-0000-000000000000");
    }

    #[test]
    fn item_types_match_the_selection() {
        assert!(applies("*", false, Some("zip")));
        assert!(!applies("*", true, None));
        assert!(applies("Directory", true, None));
        assert!(applies(".ZIP", false, Some("zip")));
        assert!(!applies(".txt", false, Some("zip")));
        assert!(!applies("Directory\\Background", true, None));
    }
}
