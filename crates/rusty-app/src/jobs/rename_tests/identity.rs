use super::*;

#[test]
fn recovery_leaves_a_replaced_rename_target_alone_after_a_restart() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("ferrite.db");
    let fs = folder(&["a"]);
    let journal = crate::jobs::open(&path).unwrap();
    renamed(&fs, &journal, &[("a", "x")]);
    let target = fs.location("d/x");
    let original = fs.metadata(&target).unwrap();
    fs.remove("d/x");
    fs.add_entry("d", original);
    let replacement = fs.file_identity(&target).unwrap();
    let job = newest(&journal).unwrap();
    drop(undo_log(&journal, job).unwrap());
    drop(journal);
    let reopened = crate::jobs::open(&path).unwrap();
    recover(&reopened, &fs).unwrap();
    assert_eq!(sizes(&fs, &["a", "x"]), [None, Some(10)]);
    assert_eq!(fs.file_identity(&target).unwrap(), replacement);
    assert_eq!(pending(&reopened), 0);
}

#[test]
fn a_failed_identity_write_prevents_the_rename() {
    let fs = folder(&["a"]);
    let db = Db::open_in_memory().unwrap();
    db.connection()
        .execute_batch(
            "CREATE TRIGGER lose_identity BEFORE UPDATE OF detail ON job_step
         WHEN NEW.detail IS NOT NULL
         BEGIN SELECT RAISE(ABORT, 'lost identity'); END;",
        )
        .unwrap();
    let journal = Arc::new(Mutex::new(JobJournal::new(db).unwrap()));
    let plan = batch(&fs, &["a"], &[("a", "x")]);
    let mut log = log_factory(Arc::clone(&journal))(&plan).unwrap();
    assert!(!matches!(
        rename_with(&fs, &plan, log.as_mut()),
        RenameOutcome::Done
    ));
    assert_eq!(sizes(&fs, &["a", "x"]), [Some(10), None]);
    assert_eq!(fs.calls("d/a", FakeOp::Rename), 0);
}

#[test]
fn an_unreadable_identity_keeps_recovery_pending_without_moving_the_file() {
    let fs = folder(&["a"]);
    let journal = journal();
    renamed(&fs, &journal, &[("a", "x")]);
    let job = newest(&journal).unwrap();
    lock(&journal)
        .mark_step(job, 0, rusty_store::StepState::Done, Some(b"not json"))
        .unwrap();
    drop(undo_log(&journal, job).unwrap());
    recover(&journal, &fs).unwrap();
    assert_eq!(sizes(&fs, &["a", "x"]), [None, Some(10)]);
    assert_eq!(pending(&journal), 1);
}

#[test]
fn an_unverified_legacy_recovery_stays_pending_without_moving_the_file() {
    let fs = folder(&["a"]);
    let journal = journal();
    renamed(&fs, &journal, &[("a", "x")]);
    let job = newest(&journal).unwrap();
    lock(&journal)
        .mark_step(job, 0, rusty_store::StepState::Done, None)
        .unwrap();
    drop(undo_log(&journal, job).unwrap());
    recover(&journal, &fs).unwrap();
    assert_eq!(sizes(&fs, &["a", "x"]), [None, Some(10)]);
    assert_eq!(pending(&journal), 1);
}
