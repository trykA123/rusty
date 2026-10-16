use std::path::PathBuf;

use windows::Management::Deployment::PackageManager;
use windows::Win32::UI::Shell::IShellItemArray;
use windows::core::HSTRING;

use super::explorer::probe_command;
use super::selection::Selection;
use crate::manifest::{MenuVerb, applies, context_menu_verbs};
use crate::model::{Node, PackagedCommand, PackagedReport, find};

struct Package {
    name: String,
    root: PathBuf,
}

pub struct Scope<'a> {
    pub selection: &'a Selection,
    pub items: Option<&'a IShellItemArray>,
    pub classic: &'a [Node],
}

pub fn probe(scope: &Scope) -> PackagedReport {
    let packages = match packages() {
        Ok(list) => list,
        Err(e) => {
            return PackagedReport {
                error: Some(format!("PackageManager: {e}")),
                packages: 0,
                manifests_read: 0,
                commands: Vec::new(),
            };
        }
    };
    let mut manifests_read = 0;
    let mut commands = Vec::new();
    for package in &packages {
        let Ok(xml) = std::fs::read_to_string(package.root.join("AppxManifest.xml")) else {
            continue;
        };
        manifests_read += 1;
        for verb in context_menu_verbs(&xml).unwrap_or_default() {
            commands.push(command(package, verb, scope));
        }
    }
    PackagedReport {
        error: None,
        packages: packages.len(),
        manifests_read,
        commands,
    }
}

fn command(package: &Package, verb: MenuVerb, scope: &Scope) -> PackagedCommand {
    let applies_to_selection = scope
        .selection
        .entries
        .iter()
        .all(|e| applies(&verb.item_type, e.is_dir, e.extension.as_deref()));
    let probe = applies_to_selection.then(|| probe_command(&verb.clsid, None, scope.items));
    let braced = format!("{{{}}}", verb.clsid.trim_matches(['{', '}']));
    let in_classic_menu = find(scope.classic, &|i| {
        i.verb
            .as_deref()
            .is_some_and(|v| v.eq_ignore_ascii_case(&braced))
    })
    .is_some();
    PackagedCommand {
        package: package.name.clone(),
        item_type: verb.item_type,
        verb_id: verb.verb_id,
        clsid: verb.clsid,
        applies_to_selection,
        in_classic_menu,
        probe,
    }
}

fn packages() -> windows::core::Result<Vec<Package>> {
    let manager = PackageManager::new()?;
    let list = manager.FindPackagesByUserSecurityId(&HSTRING::new())?;
    Ok(list
        .into_iter()
        .filter_map(|p| {
            let name = p.Id().and_then(|id| id.FamilyName()).ok()?.to_string();
            let root = p.InstalledPath().ok()?;
            Some(Package {
                name,
                root: PathBuf::from(root.to_os_string()),
            })
        })
        .collect())
}
