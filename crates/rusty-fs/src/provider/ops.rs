use rusty_core::{FsError, FsErrorKind, Location};

use super::{CancelToken, Provider};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FileIdentity {
    pub volume: u64,
    pub file: [u8; 16],
}

pub trait ProviderOps: Provider {
    fn file_identity(&self, _location: &Location) -> Result<Option<FileIdentity>, FsError> {
        Ok(None)
    }
    fn matches_identity(
        &self,
        location: &Location,
        expected: Option<FileIdentity>,
    ) -> Result<bool, FsError> {
        let Some(expected) = expected else {
            return Ok(false);
        };
        match self.file_identity(location) {
            Ok(Some(identity)) => Ok(identity == expected),
            Ok(None) => Err(FsError {
                location: Some(location.clone()),
                ..FsError::new(FsErrorKind::NotSupportedYet)
            }),
            Err(error) if error.kind == FsErrorKind::NotFound => Ok(false),
            Err(error) => Err(error),
        }
    }
    fn create_folder(&self, location: &Location) -> Result<(), FsError>;
    fn create_file(&self, location: &Location) -> Result<(), FsError>;
    #[expect(
        clippy::too_many_arguments,
        reason = "signature fixed by the P8 O5 contract"
    )]
    fn copy_file(
        &self,
        source: &Location,
        target: &Location,
        progress: &mut dyn FnMut(u64),
        cancel: &CancelToken,
    ) -> Result<u64, FsError>;
    fn rename(&self, source: &Location, target: &Location) -> Result<(), FsError>;
    fn replace(&self, source: &Location, target: &Location) -> Result<(), FsError>;
    fn remove_file(&self, location: &Location) -> Result<(), FsError>;
    fn remove_link(&self, location: &Location) -> Result<(), FsError>;
    fn remove_empty_folder(&self, location: &Location) -> Result<(), FsError>;
    fn recycle(&self, location: &Location) -> Result<(), FsError>;
    fn make_link(&self, _target_of: &Location, at: &Location) -> Result<(), FsError> {
        Err(FsError {
            location: Some(at.clone()),
            ..FsError::new(FsErrorKind::NotSupportedYet)
        })
    }
    fn link_target(&self, _at: &Location) -> Result<Option<Location>, FsError> {
        Ok(None)
    }
    fn link_points_at(&self, at: &Location, target_of: &Location) -> Result<bool, FsError> {
        Ok(self.link_target(at)?.as_ref() == Some(target_of))
    }
    fn volume_serial(&self, _location: &Location) -> Result<Option<u64>, FsError> {
        Ok(None)
    }
}
