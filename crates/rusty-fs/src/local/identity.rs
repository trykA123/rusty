use std::io;
use std::path::Path;

use crate::FileIdentity;

#[cfg(unix)]
pub(super) fn read(path: &Path) -> io::Result<Option<FileIdentity>> {
    use std::os::unix::fs::MetadataExt;

    let metadata = std::fs::symlink_metadata(path)?;
    Ok(Some(FileIdentity {
        volume: metadata.dev(),
        file: u128::from(metadata.ino()).to_le_bytes(),
    }))
}

#[cfg(windows)]
#[allow(
    unsafe_code,
    reason = "the full Windows file identifier requires a handle query"
)]
pub(super) fn read(path: &Path) -> io::Result<Option<FileIdentity>> {
    use std::fs::OpenOptions;
    use std::mem::{MaybeUninit, size_of};
    use std::os::windows::fs::OpenOptionsExt;
    use std::os::windows::io::AsRawHandle;

    use windows_sys::Win32::Foundation::{
        ERROR_INVALID_FUNCTION, ERROR_INVALID_PARAMETER, ERROR_NOT_SUPPORTED,
    };
    use windows_sys::Win32::Storage::FileSystem::{
        FILE_FLAG_BACKUP_SEMANTICS, FILE_FLAG_OPEN_REPARSE_POINT, FILE_ID_INFO, FileIdInfo,
        GetFileInformationByHandleEx,
    };

    let file = OpenOptions::new()
        .access_mode(0)
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)
        .open(path)?;
    let mut info = MaybeUninit::<FILE_ID_INFO>::zeroed();
    // SAFETY: the open handle and correctly sized output buffer live through the query.
    let ok = unsafe {
        GetFileInformationByHandleEx(
            file.as_raw_handle(),
            FileIdInfo,
            info.as_mut_ptr().cast(),
            size_of::<FILE_ID_INFO>() as u32,
        )
    };
    if ok == 0 {
        let error = io::Error::last_os_error();
        return match error.raw_os_error().map(|code| code as u32) {
            Some(ERROR_INVALID_FUNCTION | ERROR_INVALID_PARAMETER | ERROR_NOT_SUPPORTED) => {
                Ok(None)
            }
            _ => Err(error),
        };
    }
    // SAFETY: a successful query initializes every field of FILE_ID_INFO.
    let info = unsafe { info.assume_init() };
    Ok(Some(FileIdentity {
        volume: info.VolumeSerialNumber,
        file: info.FileId.Identifier,
    }))
}

#[cfg(not(any(unix, windows)))]
pub(super) fn read(_: &Path) -> io::Result<Option<FileIdentity>> {
    Ok(None)
}
