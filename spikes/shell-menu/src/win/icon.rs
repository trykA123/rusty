use anyhow::bail;
use windows::Win32::Graphics::Gdi::{
    BI_RGB, BITMAP, BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS, GetDC, GetDIBits, GetObjectW,
    HBITMAP, ReleaseDC,
};
use windows::Win32::UI::WindowsAndMessaging::{HBMMENU_CALLBACK, MENUITEMINFOW};

use crate::model::{Icon, RgbaInfo};

pub fn of_item(mii: &MENUITEMINFOW) -> Option<Icon> {
    if mii.hbmpItem == HBMMENU_CALLBACK {
        return Some(Icon {
            source: "callback (WM_DRAWITEM)",
            rgba: None,
            error: None,
        });
    }
    let (source, bitmap) = if is_bitmap(mii.hbmpItem) {
        ("hbmpItem", mii.hbmpItem)
    } else if is_bitmap(mii.hbmpUnchecked) {
        ("hbmpUnchecked", mii.hbmpUnchecked)
    } else {
        return None;
    };
    Some(match to_rgba(bitmap) {
        Ok((info, _)) => Icon {
            source,
            rgba: Some(info),
            error: None,
        },
        Err(e) => Icon {
            source,
            rgba: None,
            error: Some(e.to_string()),
        },
    })
}

fn is_bitmap(h: HBITMAP) -> bool {
    let v = h.0 as isize;
    !(-1..=11).contains(&v)
}

pub fn to_rgba(bitmap: HBITMAP) -> anyhow::Result<(RgbaInfo, Vec<u8>)> {
    let mut bm = BITMAP::default();
    // SAFETY: bm is a BITMAP-sized out buffer for this HBITMAP.
    let got = unsafe {
        GetObjectW(
            bitmap.into(),
            size_of::<BITMAP>() as i32,
            Some((&raw mut bm).cast()),
        )
    };
    if got == 0 {
        bail!("GetObjectW failed");
    }
    let (width, height) = (bm.bmWidth, bm.bmHeight.abs());
    let mut info = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
            biSize: size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width,
            biHeight: -height,
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0,
            ..Default::default()
        },
        ..Default::default()
    };
    let mut data = vec![0u8; width.max(0) as usize * height as usize * 4];
    // SAFETY: data holds width * height 32-bit pixels, as the header asks; the screen DC is released.
    let lines = unsafe {
        let dc = GetDC(None);
        let lines = GetDIBits(
            dc,
            bitmap,
            0,
            height as u32,
            Some(data.as_mut_ptr().cast()),
            &mut info,
            DIB_RGB_COLORS,
        );
        ReleaseDC(None, dc);
        lines
    };
    if lines == 0 {
        bail!("GetDIBits failed");
    }
    data.as_chunks_mut::<4>()
        .0
        .iter_mut()
        .for_each(|px| px.swap(0, 2));
    let alpha_pixels = data
        .as_chunks::<4>()
        .0
        .iter()
        .filter(|px| px[3] != 0)
        .count();
    let rgba = RgbaInfo {
        width: width as u32,
        height: height as u32,
        source_bits: bm.bmBitsPixel,
        rgba_bytes: data.len(),
        alpha_pixels,
    };
    Ok((rgba, data))
}
