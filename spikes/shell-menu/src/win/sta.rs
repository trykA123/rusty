use std::time::{Duration, Instant};

use anyhow::{Context, bail};
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Ole::{OleInitialize, OleUninitialize};
use windows::Win32::UI::WindowsAndMessaging::{
    CreateWindowExW, DefWindowProcW, DestroyWindow, DispatchMessageW, HWND_MESSAGE, MSG, PM_REMOVE,
    PeekMessageW, RegisterClassW, TranslateMessage, WINDOW_EX_STYLE, WINDOW_STYLE, WNDCLASSW,
};
use windows::core::w;

pub struct Ole;

impl Ole {
    pub fn init() -> anyhow::Result<Self> {
        // SAFETY: called once on this thread before any COM use; paired with OleUninitialize in Drop.
        unsafe { OleInitialize(None) }.context("OleInitialize (STA)")?;
        Ok(Self)
    }
}

impl Drop for Ole {
    fn drop(&mut self) {
        // SAFETY: OleInitialize succeeded on this thread and every COM object was dropped first.
        unsafe { OleUninitialize() };
    }
}

pub struct MessageWindow(HWND);

extern "system" fn wndproc(hwnd: HWND, msg: u32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    // SAFETY: forwards the arguments the system passed to this window procedure.
    unsafe { DefWindowProcW(hwnd, msg, wparam, lparam) }
}

impl MessageWindow {
    pub fn create() -> anyhow::Result<Self> {
        let class = w!("FerriteShellMenuSpike");
        // SAFETY: plain Win32 calls with a static class name and a valid window procedure.
        unsafe {
            let instance = GetModuleHandleW(None).context("GetModuleHandleW")?;
            let wc = WNDCLASSW {
                lpfnWndProc: Some(wndproc),
                hInstance: instance.into(),
                lpszClassName: class,
                ..Default::default()
            };
            if RegisterClassW(&wc) == 0 {
                bail!("RegisterClassW failed");
            }
            let hwnd = CreateWindowExW(
                WINDOW_EX_STYLE(0),
                class,
                w!(""),
                WINDOW_STYLE(0),
                0,
                0,
                0,
                0,
                Some(HWND_MESSAGE),
                None,
                Some(instance.into()),
                None,
            )
            .context("CreateWindowExW (message-only)")?;
            Ok(Self(hwnd))
        }
    }

    pub fn hwnd(&self) -> HWND {
        self.0
    }
}

impl Drop for MessageWindow {
    fn drop(&mut self) {
        // SAFETY: the window was created on this thread and is destroyed once.
        let _ = unsafe { DestroyWindow(self.0) };
    }
}

pub fn pump(duration: Duration) {
    let end = Instant::now() + duration;
    let mut msg = MSG::default();
    while Instant::now() < end {
        // SAFETY: standard message loop on the thread that owns the window.
        unsafe {
            while PeekMessageW(&mut msg, None, 0, 0, PM_REMOVE).as_bool() {
                let _ = TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }
        }
        std::thread::sleep(Duration::from_millis(10));
    }
}
