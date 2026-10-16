use std::time::Instant;

use windows::Win32::System::Com::StructuredStorage::IPropertyBag;
use windows::Win32::System::Com::{CLSCTX_ALL, CLSIDFromString, CoCreateInstance, CoTaskMemFree};
use windows::Win32::UI::Shell::{
    ECF_HASSUBCOMMANDS, IExplorerCommand, IInitializeCommand, IShellItemArray,
};
use windows::core::{HSTRING, Interface};

use super::packaged;
use super::selection::Selection;
use crate::model::{CommandProbe, ExplorerReport, Node, RegistryCommand, find, ms_round};

const MAX_SUB_COMMANDS: usize = 32;

pub fn probe(selection: &Selection, classic: &[Node]) -> ExplorerReport {
    let start = Instant::now();
    let items = selection.shell_items();
    let registry_keys = registry_keys(selection);
    let registry = registry_keys
        .iter()
        .flat_map(|key| handlers(key))
        .map(|(key, verb, clsid)| {
            let in_classic_menu = find(classic, &|i| {
                i.verb
                    .as_deref()
                    .is_some_and(|v| v.eq_ignore_ascii_case(&verb))
            })
            .is_some();
            let probe = probe_command(&clsid, Some(&verb), items.as_ref().ok());
            RegistryCommand {
                key,
                verb,
                clsid,
                in_classic_menu,
                probe,
            }
        })
        .collect();
    let packaged = packaged::probe(&packaged::Scope {
        selection,
        items: items.as_ref().ok(),
        classic,
    });
    ExplorerReport {
        registry_keys,
        registry,
        packaged,
        ms: ms_round(start.elapsed().as_secs_f64() * 1000.0),
    }
}

fn registry_keys(selection: &Selection) -> Vec<String> {
    let mut keys = Vec::new();
    for entry in &selection.entries {
        let candidates = match (&entry.extension, entry.is_dir) {
            (_, true) => vec!["Directory".to_owned(), "Folder".to_owned()],
            (Some(ext), false) => {
                let dotted = format!(".{ext}");
                let prog_id = windows_registry::CLASSES_ROOT
                    .open(&dotted)
                    .and_then(|k| k.get_string(""));
                let mut list = vec![dotted.clone(), format!("SystemFileAssociations\\{dotted}")];
                list.extend(prog_id.ok().filter(|p| !p.is_empty()));
                list.push("*".to_owned());
                list
            }
            (None, false) => vec!["*".to_owned()],
        };
        keys.extend(candidates);
        keys.push("AllFilesystemObjects".to_owned());
    }
    let mut seen = std::collections::HashSet::new();
    keys.retain(|k| seen.insert(k.to_lowercase()));
    keys
}

fn handlers(key: &str) -> Vec<(String, String, String)> {
    let Ok(shell) = windows_registry::CLASSES_ROOT.open(format!("{key}\\shell")) else {
        return Vec::new();
    };
    let Ok(verbs) = shell.keys() else {
        return Vec::new();
    };
    verbs
        .filter_map(|verb| {
            let clsid = shell
                .open(&verb)
                .and_then(|k| k.get_string("ExplorerCommandHandler"))
                .ok()?;
            Some((key.to_owned(), verb, clsid))
        })
        .collect()
}

pub fn probe_command(
    clsid: &str,
    verb: Option<&str>,
    items: Option<&IShellItemArray>,
) -> CommandProbe {
    let start = Instant::now();
    let mut probe = match create(clsid) {
        Ok(cmd) => describe(&cmd, verb, items),
        Err(e) => CommandProbe {
            error: Some(format!("CoCreateInstance: {e}")),
            ..Default::default()
        },
    };
    probe.ms = ms_round(start.elapsed().as_secs_f64() * 1000.0);
    probe
}

fn create(clsid: &str) -> windows::core::Result<IExplorerCommand> {
    let braced = if clsid.starts_with('{') {
        clsid.to_owned()
    } else {
        format!("{{{clsid}}}")
    };
    // SAFETY: CLSIDFromString parses a string; CoCreateInstance runs on this STA thread.
    unsafe {
        let guid = CLSIDFromString(&HSTRING::from(braced))?;
        CoCreateInstance(&guid, None, CLSCTX_ALL)
    }
}

fn describe(
    cmd: &IExplorerCommand,
    verb: Option<&str>,
    items: Option<&IShellItemArray>,
) -> CommandProbe {
    let mut probe = CommandProbe {
        created: true,
        ..Default::default()
    };
    if let (Some(verb), Ok(init)) = (verb, cmd.cast::<IInitializeCommand>()) {
        // SAFETY: Explorer initialises registry commands with their verb name; a null property bag is allowed.
        let result = unsafe { init.Initialize(&HSTRING::from(verb), None::<&IPropertyBag>) };
        probe.initialize = Some(result.map_or_else(|e| e.to_string(), |()| "ok".into()));
    }
    let title = title(cmd, items);
    probe.title = title.as_ref().ok().cloned();
    probe.error = title.err().map(|e| format!("GetTitle: {e}"));
    // SAFETY: plain COM calls on a live command object.
    unsafe {
        probe.state = Some(match cmd.GetState(items, true) {
            Ok(bits) => state_name(bits),
            Err(e) => format!("GetState: {e}"),
        });
        probe.flags = cmd.GetFlags().ok();
    }
    if probe
        .flags
        .is_some_and(|f| f & ECF_HASSUBCOMMANDS.0 as u32 != 0)
    {
        probe.sub_commands = sub_commands(cmd, items);
    }
    probe
}

fn title(cmd: &IExplorerCommand, items: Option<&IShellItemArray>) -> windows::core::Result<String> {
    // SAFETY: the returned string is CoTaskMemAlloc'd by the callee and freed here once.
    unsafe {
        let raw = cmd.GetTitle(items)?;
        let text = raw.to_string().unwrap_or_default();
        CoTaskMemFree(Some(raw.0.cast()));
        Ok(text)
    }
}

fn sub_commands(cmd: &IExplorerCommand, items: Option<&IShellItemArray>) -> Vec<String> {
    // SAFETY: enumerator Next fills one slot at a time; S_FALSE or an error ends the loop.
    let Ok(list) = (unsafe { cmd.EnumSubCommands() }) else {
        return vec!["EnumSubCommands failed".into()];
    };
    let mut out = Vec::new();
    while out.len() < MAX_SUB_COMMANDS {
        let mut slot = [None];
        let mut fetched = 0;
        // SAFETY: see above.
        let hr = unsafe { list.Next(&mut slot, Some(&mut fetched)) };
        let Some(sub) = slot[0].take().filter(|_| hr.is_ok() && fetched == 1) else {
            break;
        };
        out.push(title(&sub, items).unwrap_or_else(|e| format!("GetTitle: {e}")));
    }
    out
}

fn state_name(bits: u32) -> String {
    let names = [
        (1, "disabled"),
        (2, "hidden"),
        (4, "checkbox"),
        (8, "checked"),
        (16, "radiocheck"),
    ];
    let set: Vec<&str> = names
        .iter()
        .filter(|(b, _)| bits & b != 0)
        .map(|(_, n)| *n)
        .collect();
    if set.is_empty() {
        "enabled".into()
    } else {
        set.join("|")
    }
}
