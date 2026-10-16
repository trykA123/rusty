mod explorer;
mod icon;
mod invoke;
mod menu;
mod packaged;
mod selection;
mod sta;
mod walk;

use windows::Win32::Foundation::HWND;

use crate::cli::Args;
use crate::model::Report;
use menu::{Flags, LoadedMenu};
use selection::Selection;

pub fn run(args: &Args) -> anyhow::Result<Report> {
    let _ole = sta::Ole::init()?;
    let window = sta::MessageWindow::create()?;
    collect(args, window.hwnd())
}

fn collect(args: &Args, owner: HWND) -> anyhow::Result<Report> {
    let selection = Selection::parse(&args.paths)?;
    let normal = LoadedMenu::query(&selection, owner, Flags::Normal)?;
    let normal_pass = normal.walk();
    let explore = LoadedMenu::query(&selection, owner, Flags::Explore)?.walk();
    let sync = LoadedMenu::query(&selection, owner, Flags::SyncCascade)?.walk();
    let explorer_commands = args
        .explorer_commands
        .then(|| explorer::probe(&selection, &normal_pass.menu));
    let invoke = args
        .invoke
        .as_ref()
        .map(|t| invoke::run(&normal, &normal_pass.menu, t, owner));
    Ok(Report {
        items: selection
            .entries
            .iter()
            .map(|e| e.path.display().to_string())
            .collect(),
        passes: vec![normal_pass, explore, sync],
        invoke,
        explorer_commands,
    })
}
