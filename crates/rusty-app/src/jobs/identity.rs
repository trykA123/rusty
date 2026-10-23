use rusty_core::{FsError, FsErrorKind};
use rusty_fs::FileIdentity;
use rusty_store::{JobId, StepState};
use serde::{Deserialize, Serialize};

use super::{SharedJournal, lock};

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Record {
    version: u8,
    volume: u64,
    file: [u8; 16],
}

pub(super) fn record(
    journal: &SharedJournal,
    job: JobId,
    (seq, identity): (u32, FileIdentity),
) -> Result<(), FsError> {
    let bytes = serde_json::to_vec(&Record {
        version: 1,
        volume: identity.volume,
        file: identity.file,
    })
    .map_err(|_| failure())?;
    lock(journal)
        .mark_step(job, seq, StepState::Pending, Some(&bytes))
        .map_err(|_| failure())
}

pub(super) fn read(
    journal: &SharedJournal,
    job: JobId,
    seq: u32,
) -> Result<Option<FileIdentity>, FsError> {
    let Some(bytes) = lock(journal).step_detail(job, seq).map_err(|_| failure())? else {
        return Ok(None);
    };
    if bytes == b"undone" {
        return Ok(None);
    }
    let record: Record = serde_json::from_slice(&bytes).map_err(|_| failure())?;
    if record.version != 1 {
        return Err(failure());
    }
    Ok(Some(FileIdentity {
        volume: record.volume,
        file: record.file,
    }))
}

fn failure() -> FsError {
    FsError::new(FsErrorKind::Unknown)
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use rusty_core::{OpKind, OperationPlan, Step, Totals};
    use rusty_fs::{FakeFs, FileIdentity, JobOutcome, StepOutcome};
    use rusty_store::StepState;
    use rusty_ui::browser::OpLog;

    use crate::jobs::{SharedJournal, lock, log_factory, open, undo_log};

    const IDENTITY: FileIdentity = FileIdentity {
        volume: u64::MAX,
        file: [255; 16],
    };

    fn log(journal: &SharedJournal) -> Box<dyn OpLog> {
        let fs = FakeFs::new();
        log_factory(Arc::clone(journal))(&OperationPlan {
            kind: OpKind::Rename,
            steps: vec![Step::Rename {
                source: fs.location("a"),
                target: fs.location("b"),
            }],
            totals: Totals {
                files: 1,
                folders: 0,
                bytes: 0,
            },
            conflicts: Vec::new(),
            risks: Vec::new(),
        })
        .unwrap()
    }

    #[test]
    fn a_prepared_identity_is_durable_before_the_rename_runs() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("ferrite.db");
        let journal = open(&path).unwrap();
        let mut log = log(&journal);
        log.prepare_rename(0, IDENTITY).unwrap();
        let jobs = lock(&journal).unfinished().unwrap();
        assert_eq!(jobs[0].steps[0].state, StepState::Pending);
        drop((log, journal));
        let reopened = open(&path).unwrap();
        let mut log = undo_log(&reopened, jobs[0].id).unwrap();
        assert_eq!(log.rename_identity(0).unwrap(), Some(IDENTITY));
        log.step(0, StepOutcome::Done).unwrap();
        assert_eq!(log.rename_identity(0).unwrap(), Some(IDENTITY));
    }

    #[test]
    fn a_finished_batch_keeps_its_identity_after_reopening() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("ferrite.db");
        let journal = open(&path).unwrap();
        let mut log = log(&journal);
        log.prepare_rename(0, IDENTITY).unwrap();
        log.step(0, StepOutcome::Done).unwrap();
        log.finish(&JobOutcome::Done, &FakeFs::new());
        drop((log, journal));
        let reopened = open(&path).unwrap();
        let job = lock(&reopened).last_undoable("rename").unwrap().unwrap();
        let log = undo_log(&reopened, job.id).unwrap();
        assert_eq!(log.rename_identity(0).unwrap(), Some(IDENTITY));
    }

    #[test]
    fn an_unreadable_identity_is_an_error() {
        let dir = tempfile::tempdir().unwrap();
        let journal = open(&dir.path().join("ferrite.db")).unwrap();
        let log = log(&journal);
        let job = lock(&journal).unfinished().unwrap()[0].id;
        lock(&journal)
            .mark_step(job, 0, StepState::Done, Some(b"not json"))
            .unwrap();
        assert!(log.rename_identity(0).is_err());
    }
}
