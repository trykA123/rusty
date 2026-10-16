use std::time::Instant;

use anyhow::{Context, bail};
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::Shell::{
    CMF_EXPLORE, CMF_EXTENDEDVERBS, CMF_NORMAL, CMF_SYNCCASCADEMENU, IContextMenu,
};
use windows::Win32::UI::WindowsAndMessaging::{CreatePopupMenu, DestroyMenu, HMENU};

use super::selection::Selection;
use super::walk::Walker;
use crate::model::{Pass, Stats, ms_round};

pub const ID_FIRST: u32 = 1;
const ID_LAST: u32 = 0x7FFF;

#[derive(Clone, Copy)]
pub enum Flags {
    Normal,
    Explore,
    SyncCascade,
}

impl Flags {
    fn bits(self) -> u32 {
        match self {
            Self::Normal => CMF_NORMAL | CMF_EXTENDEDVERBS,
            Self::Explore => CMF_EXPLORE | CMF_EXTENDEDVERBS,
            Self::SyncCascade => CMF_NORMAL | CMF_EXTENDEDVERBS | CMF_SYNCCASCADEMENU,
        }
    }

    fn name(self) -> &'static str {
        match self {
            Self::Normal => "CMF_NORMAL|CMF_EXTENDEDVERBS",
            Self::Explore => "CMF_EXPLORE|CMF_EXTENDEDVERBS",
            Self::SyncCascade => "CMF_NORMAL|CMF_EXTENDEDVERBS|CMF_SYNCCASCADEMENU",
        }
    }
}

pub struct LoadedMenu {
    pub cm: IContextMenu,
    pub hmenu: HMENU,
    pub command_count: u32,
    flags: Flags,
    query_ms: f64,
}

impl LoadedMenu {
    pub fn query(selection: &Selection, owner: HWND, flags: Flags) -> anyhow::Result<Self> {
        let cm = selection.context_menu(owner)?;
        // SAFETY: a fresh popup menu owned by this struct and destroyed in Drop.
        let hmenu = unsafe { CreatePopupMenu() }.context("CreatePopupMenu")?;
        let start = Instant::now();
        // SAFETY: valid menu handle and id range.
        let hr = unsafe { cm.QueryContextMenu(hmenu, 0, ID_FIRST, ID_LAST, flags.bits()) };
        let query_ms = ms_round(start.elapsed().as_secs_f64() * 1000.0);
        let mut loaded = Self {
            cm,
            hmenu,
            command_count: 0,
            flags,
            query_ms,
        };
        if hr.is_err() {
            bail!("QueryContextMenu({}) failed: {hr}", flags.name());
        }
        loaded.command_count = (hr.0 as u32) & 0xFFFF;
        Ok(loaded)
    }

    pub fn walk(&self) -> Pass {
        let start = Instant::now();
        let menu = Walker::new(self).walk(self.hmenu, 0);
        Pass {
            flags: self.flags.name(),
            query_ms: self.query_ms,
            command_count: self.command_count,
            walk_ms: ms_round(start.elapsed().as_secs_f64() * 1000.0),
            stats: Stats::of(&menu),
            menu,
        }
    }
}

impl Drop for LoadedMenu {
    fn drop(&mut self) {
        // SAFETY: the menu was created by CreatePopupMenu and is destroyed once.
        let _ = unsafe { DestroyMenu(self.hmenu) };
    }
}
