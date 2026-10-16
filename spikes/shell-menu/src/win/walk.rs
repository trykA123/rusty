use std::time::Instant;

use windows::Win32::Foundation::{LPARAM, LRESULT, WPARAM};
use windows::Win32::UI::Shell::{GCS_VERBW, IContextMenu, IContextMenu2, IContextMenu3};
use windows::Win32::UI::WindowsAndMessaging::{
    GetMenuItemCount, GetMenuItemInfoW, HMENU, MENUITEMINFOW, MFS_CHECKED, MFS_DEFAULT,
    MFS_DISABLED, MFT_OWNERDRAW, MFT_SEPARATOR, MIIM_BITMAP, MIIM_CHECKMARKS, MIIM_FTYPE, MIIM_ID,
    MIIM_STATE, MIIM_STRING, MIIM_SUBMENU, WM_INITMENUPOPUP,
};
use windows::core::{Interface, PSTR, PWSTR};

use super::icon;
use super::menu::{ID_FIRST, LoadedMenu};
use crate::model::{Item, Node, Submenu, ms_round};

const MAX_DEPTH: usize = 4;

pub struct Walker<'a> {
    cm: &'a IContextMenu,
    cm2: Option<IContextMenu2>,
    cm3: Option<IContextMenu3>,
    command_count: u32,
}

impl<'a> Walker<'a> {
    pub fn new(menu: &'a LoadedMenu) -> Self {
        Self {
            cm: &menu.cm,
            cm2: menu.cm.cast().ok(),
            cm3: menu.cm.cast().ok(),
            command_count: menu.command_count,
        }
    }

    pub fn walk(&self, hmenu: HMENU, depth: usize) -> Vec<Node> {
        (0..item_count(hmenu))
            .filter_map(|pos| self.node(hmenu, pos, depth))
            .collect()
    }

    fn node(&self, hmenu: HMENU, pos: u32, depth: usize) -> Option<Node> {
        let (mii, text) = read_item(hmenu, pos)?;
        if mii.fType.contains(MFT_SEPARATOR) {
            return Some(Node::Separator);
        }
        let submenu = (!mii.hSubMenu.is_invalid() && depth < MAX_DEPTH)
            .then(|| self.submenu(mii.hSubMenu, pos, depth));
        Some(Node::Item(Item {
            id: mii.wID,
            text,
            verb: self.verb(mii.wID),
            enabled: !mii.fState.contains(MFS_DISABLED),
            checked: mii.fState.contains(MFS_CHECKED),
            default: mii.fState.contains(MFS_DEFAULT),
            owner_drawn: mii.fType.contains(MFT_OWNERDRAW),
            icon: icon::of_item(&mii),
            submenu,
        }))
    }

    fn submenu(&self, sub: HMENU, pos: u32, depth: usize) -> Submenu {
        let items_before_init = item_count(sub) as usize;
        let start = Instant::now();
        let init_by = self.init_popup(sub, pos);
        let init_ms = ms_round(start.elapsed().as_secs_f64() * 1000.0);
        Submenu {
            items_before_init,
            init_ms,
            init_by,
            children: self.walk(sub, depth + 1),
        }
    }

    fn init_popup(&self, sub: HMENU, pos: u32) -> String {
        let (wparam, lparam) = (WPARAM(sub.0 as usize), LPARAM(pos as isize));
        // SAFETY: WM_INITMENUPOPUP with a live submenu handle, as a menu loop would send it.
        let outcome = unsafe {
            if let Some(cm3) = &self.cm3 {
                let mut result = LRESULT(0);
                (
                    "IContextMenu3",
                    cm3.HandleMenuMsg2(WM_INITMENUPOPUP, wparam, lparam, Some(&mut result)),
                )
            } else if let Some(cm2) = &self.cm2 {
                (
                    "IContextMenu2",
                    cm2.HandleMenuMsg(WM_INITMENUPOPUP, wparam, lparam),
                )
            } else {
                return "none: no IContextMenu2/3".into();
            }
        };
        match outcome {
            (by, Ok(())) => by.into(),
            (by, Err(e)) => format!("{by}: {e}"),
        }
    }

    fn verb(&self, id: u32) -> Option<String> {
        let offset = id
            .checked_sub(ID_FIRST)
            .filter(|o| *o < self.command_count)?;
        let mut buf = [0u16; 256];
        // SAFETY: GCS_VERBW writes at most cchmax UTF-16 units into buf.
        unsafe {
            self.cm
                .GetCommandString(
                    offset as usize,
                    GCS_VERBW,
                    None,
                    PSTR(buf.as_mut_ptr().cast()),
                    buf.len() as u32,
                )
                .ok()?;
        }
        let len = buf.iter().position(|c| *c == 0).unwrap_or(buf.len());
        let verb = String::from_utf16_lossy(&buf[..len]);
        (!verb.is_empty()).then_some(verb)
    }
}

fn item_count(hmenu: HMENU) -> u32 {
    // SAFETY: read-only query on a live menu handle.
    let count = unsafe { GetMenuItemCount(Some(hmenu)) };
    u32::try_from(count).unwrap_or(0)
}

fn read_item(hmenu: HMENU, pos: u32) -> Option<(MENUITEMINFOW, String)> {
    let mut mii = MENUITEMINFOW {
        cbSize: size_of::<MENUITEMINFOW>() as u32,
        fMask: MIIM_FTYPE
            | MIIM_STATE
            | MIIM_ID
            | MIIM_SUBMENU
            | MIIM_STRING
            | MIIM_BITMAP
            | MIIM_CHECKMARKS,
        ..Default::default()
    };
    // SAFETY: first call sizes the text (dwTypeData null), second call fills a buffer of cch + 1.
    unsafe {
        GetMenuItemInfoW(hmenu, pos, true, &mut mii).ok()?;
        let mut buf = vec![0u16; mii.cch as usize + 1];
        mii.dwTypeData = PWSTR(buf.as_mut_ptr());
        mii.cch = buf.len() as u32;
        GetMenuItemInfoW(hmenu, pos, true, &mut mii).ok()?;
        let text = String::from_utf16_lossy(&buf[..(mii.cch as usize).min(buf.len())]);
        mii.dwTypeData = PWSTR::null();
        Some((mii, text))
    }
}
