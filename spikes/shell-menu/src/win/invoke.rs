use std::ffi::CString;
use std::time::{Duration, Instant};

use anyhow::Context;
use windows::Win32::Foundation::HWND;
use windows::Win32::System::DataExchange::{
    CloseClipboard, CountClipboardFormats, EnumClipboardFormats, GetClipboardFormatNameW,
    OpenClipboard,
};
use windows::Win32::UI::Shell::{CMINVOKECOMMANDINFO, CMINVOKECOMMANDINFOEX};
use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;
use windows::core::{HSTRING, PCSTR, PCWSTR};

use super::menu::{ID_FIRST, LoadedMenu};
use super::sta;
use crate::cli::Target;
use crate::model::{Clipboard, InvokeReport, Node, find, ms_round, plain_text};

const CMIC_MASK_NOASYNC: u32 = 0x0000_0100;
const CMIC_MASK_FLAG_NO_UI: u32 = 0x0000_0400;
const CMIC_MASK_UNICODE: u32 = 0x0000_4000;

enum Command {
    Offset(u32),
    Verb(String),
}

pub fn run(menu: &LoadedMenu, tree: &[Node], target: &Target, owner: HWND) -> InvokeReport {
    let label = match target {
        Target::Id(id) => id.to_string(),
        Target::Name(name) => name.clone(),
    };
    let command = match resolve(tree, target) {
        Some(command) => command,
        None => return failed(label, "no item with this id, verb or text".into()),
    };
    let resolved = match &command {
        Command::Offset(offset) => format!("id {}", offset + ID_FIRST),
        Command::Verb(verb) => format!("verb {verb}"),
    };
    let start = Instant::now();
    let result = invoke(menu, &command, owner);
    sta::pump(Duration::from_millis(500));
    InvokeReport {
        target: label,
        resolved,
        ok: result.is_ok(),
        error: result.err().map(|e| format!("{e:#}")),
        ms: ms_round(start.elapsed().as_secs_f64() * 1000.0),
        clipboard: clipboard(owner).ok(),
    }
}

fn failed(target: String, error: String) -> InvokeReport {
    InvokeReport {
        target,
        resolved: String::new(),
        ok: false,
        error: Some(error),
        ms: 0.0,
        clipboard: None,
    }
}

fn resolve(tree: &[Node], target: &Target) -> Option<Command> {
    match target {
        Target::Id(id) => id.checked_sub(ID_FIRST).map(Command::Offset),
        Target::Name(name) => {
            if find(tree, &|i| {
                i.verb
                    .as_deref()
                    .is_some_and(|v| v.eq_ignore_ascii_case(name))
            })
            .is_some()
            {
                return Some(Command::Verb(name.clone()));
            }
            let item = find(tree, &|i| plain_text(&i.text).eq_ignore_ascii_case(name))?;
            item.id.checked_sub(ID_FIRST).map(Command::Offset)
        }
    }
}

fn invoke(menu: &LoadedMenu, command: &Command, owner: HWND) -> anyhow::Result<()> {
    match command {
        Command::Offset(offset) => {
            let id = *offset as usize;
            send(
                menu,
                PCSTR(id as *const u8),
                PCWSTR(id as *const u16),
                owner,
            )
        }
        Command::Verb(verb) => {
            let (ansi, wide) = (CString::new(verb.as_str())?, HSTRING::from(verb.as_str()));
            send(
                menu,
                PCSTR(ansi.as_ptr().cast()),
                PCWSTR(wide.as_ptr()),
                owner,
            )
        }
    }
}

fn send(menu: &LoadedMenu, verb_a: PCSTR, verb_w: PCWSTR, owner: HWND) -> anyhow::Result<()> {
    let info = CMINVOKECOMMANDINFOEX {
        cbSize: size_of::<CMINVOKECOMMANDINFOEX>() as u32,
        fMask: CMIC_MASK_UNICODE | CMIC_MASK_FLAG_NO_UI | CMIC_MASK_NOASYNC,
        hwnd: owner,
        lpVerb: verb_a,
        lpVerbW: verb_w,
        nShow: SW_SHOWNORMAL.0,
        ..Default::default()
    };
    // SAFETY: info and the verb strings it points to outlive the call; cbSize marks the EX layout.
    unsafe {
        menu.cm
            .InvokeCommand((&raw const info).cast::<CMINVOKECOMMANDINFO>())
    }
    .context("InvokeCommand")
}

fn clipboard(owner: HWND) -> anyhow::Result<Clipboard> {
    // SAFETY: the clipboard is opened by this thread's window and closed before returning.
    unsafe {
        OpenClipboard(Some(owner)).context("OpenClipboard")?;
        let format_count = CountClipboardFormats();
        let mut formats = Vec::new();
        let mut format = EnumClipboardFormats(0);
        while format != 0 {
            formats.push(format_name(format));
            format = EnumClipboardFormats(format);
        }
        let _ = CloseClipboard();
        Ok(Clipboard {
            format_count,
            formats,
        })
    }
}

fn format_name(format: u32) -> String {
    let mut buf = [0u16; 128];
    // SAFETY: buf is a valid out buffer; standard formats return 0 and fall back to the number.
    let len = unsafe { GetClipboardFormatNameW(format, &mut buf) };
    match (len, format) {
        (n, _) if n > 0 => String::from_utf16_lossy(&buf[..n as usize]),
        (_, 13) => "CF_UNICODETEXT".into(),
        (_, 15) => "CF_HDROP".into(),
        (_, f) => format!("CF_{f}"),
    }
}
