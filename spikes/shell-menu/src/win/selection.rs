use std::path::{Path, PathBuf};
use std::ptr::NonNull;

use anyhow::{Context, bail};
use windows::Win32::Foundation::HWND;
use windows::Win32::System::Com::CoTaskMemFree;
use windows::Win32::UI::Shell::Common::ITEMIDLIST;
use windows::Win32::UI::Shell::{
    IContextMenu, ILFindLastID, IShellFolder, IShellItemArray, SHBindToParent,
    SHCreateShellItemArrayFromIDLists, SHParseDisplayName,
};
use windows::core::HSTRING;

struct Pidl(NonNull<ITEMIDLIST>);

impl Pidl {
    fn parse(path: &Path) -> anyhow::Result<Self> {
        let mut raw = std::ptr::null_mut();
        // SAFETY: valid wide string in, the shell allocates the PIDL that Drop frees.
        unsafe { SHParseDisplayName(&HSTRING::from(path.as_os_str()), None, &mut raw, 0, None) }
            .with_context(|| format!("SHParseDisplayName {}", path.display()))?;
        NonNull::new(raw)
            .map(Self)
            .context("SHParseDisplayName returned null")
    }

    fn as_ptr(&self) -> *const ITEMIDLIST {
        self.0.as_ptr()
    }
}

impl Drop for Pidl {
    fn drop(&mut self) {
        // SAFETY: the PIDL came from SHParseDisplayName (CoTaskMemAlloc) and is freed once.
        unsafe { CoTaskMemFree(Some(self.0.as_ptr().cast())) };
    }
}

pub struct Entry {
    pub path: PathBuf,
    pub is_dir: bool,
    pub extension: Option<String>,
}

pub struct Selection {
    pub entries: Vec<Entry>,
    pidls: Vec<Pidl>,
}

impl Selection {
    pub fn parse(paths: &[PathBuf]) -> anyhow::Result<Self> {
        let paths: Vec<PathBuf> = paths
            .iter()
            .map(std::path::absolute)
            .collect::<Result<_, _>>()?;
        let parent = |p: &PathBuf| p.parent().map(|d| d.to_string_lossy().to_lowercase());
        if paths.iter().any(|p| parent(p) != parent(&paths[0])) {
            bail!("all items must share one parent folder");
        }
        let pidls = paths
            .iter()
            .map(|p| Pidl::parse(p))
            .collect::<anyhow::Result<_>>()?;
        let entries = paths
            .into_iter()
            .map(|path| Entry {
                is_dir: path.is_dir(),
                extension: path.extension().map(|e| e.to_string_lossy().into_owned()),
                path,
            })
            .collect();
        Ok(Self { entries, pidls })
    }

    pub fn context_menu(&self, owner: HWND) -> anyhow::Result<IContextMenu> {
        let first = self.pidls.first().context("empty selection")?;
        // SAFETY: the PIDLs stay alive for the whole call; ILFindLastID returns pointers into them.
        unsafe {
            let folder: IShellFolder =
                SHBindToParent(first.as_ptr(), None).context("SHBindToParent")?;
            let children: Vec<*const ITEMIDLIST> = self
                .pidls
                .iter()
                .map(|p| ILFindLastID(p.as_ptr()).cast_const())
                .collect();
            folder
                .GetUIObjectOf(owner, &children, None)
                .context("IShellFolder::GetUIObjectOf(IContextMenu)")
        }
    }

    pub fn shell_items(&self) -> anyhow::Result<IShellItemArray> {
        let ptrs: Vec<*const ITEMIDLIST> = self.pidls.iter().map(Pidl::as_ptr).collect();
        // SAFETY: absolute PIDLs that outlive the call.
        unsafe { SHCreateShellItemArrayFromIDLists(&ptrs) }
            .context("SHCreateShellItemArrayFromIDLists")
    }
}
