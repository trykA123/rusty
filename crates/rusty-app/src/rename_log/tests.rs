use super::*;

use rusty_core::rename::check::{Existing, ExistingName, Fold, Row};
use rusty_core::rename::plan_batch;

fn batch(names: &[(&str, &str)], fold: Fold) -> OperationPlan {
    let parent = Location::new("/sample").unwrap();
    let rows: Vec<_> = names
        .iter()
        .map(|(old, new)| Row {
            parent: parent.clone(),
            old: (*old).into(),
            new: (*new).into(),
            excluded: false,
        })
        .collect();
    let existing = Existing::new(
        names
            .iter()
            .map(|(name, _)| ExistingName {
                parent: parent.clone(),
                name: (*name).into(),
            })
            .collect(),
    );
    plan_batch(&rows, &existing, fold, 7).plan.unwrap()
}

#[test]
fn a_swap_records_original_and_final_paths_without_staging_names() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("rename.log");
    writer(Some(path.clone()))(&batch(&[("a", "b"), ("b", "a")], Fold::Exact)).unwrap();
    let text = std::fs::read_to_string(path).unwrap();
    assert!(text.contains("\"/sample/a\" → \"/sample/b\""));
    assert!(text.contains("\"/sample/b\" → \"/sample/a\""));
    assert!(!text.contains(".ferrite-rename"));
    assert_eq!(text.lines().count(), 3);
}

#[test]
fn a_chain_keeps_the_origins_of_both_files() {
    let plan = batch(&[("a", "b"), ("b", "c")], Fold::Exact);
    let changes = pairs(&plan).unwrap();
    assert_eq!(changes.len(), 2);
    assert!(
        changes
            .iter()
            .any(|(old, new)| old.as_str() == "/sample/a" && new.as_str() == "/sample/b")
    );
    assert!(
        changes
            .iter()
            .any(|(old, new)| old.as_str() == "/sample/b" && new.as_str() == "/sample/c")
    );
}

#[test]
fn a_case_only_rename_has_one_original_to_final_pair() {
    let changes = pairs(&batch(&[("a", "A")], Fold::Insensitive)).unwrap();
    assert_eq!(changes.len(), 1);
    assert_eq!(changes[0].0.as_str(), "/sample/a");
    assert_eq!(changes[0].1.as_str(), "/sample/A");
}

#[test]
fn reopening_a_writer_appends_a_batch_and_preserves_the_previous_log() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("rename.log");
    let plan = batch(&[("a", "b")], Fold::Exact);
    writer(Some(path.clone()))(&plan).unwrap();
    let first = std::fs::read_to_string(&path).unwrap();
    writer(Some(path.clone()))(&plan).unwrap();
    let second = std::fs::read_to_string(path).unwrap();
    assert!(second.starts_with(&first));
    assert_eq!(second.lines().count(), 4);
}

#[test]
fn control_characters_cannot_inject_log_entries() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("rename.log");
    let mut plan = batch(&[("a", "b")], Fold::Exact);
    plan.steps = vec![Step::Rename {
        source: Location::new("/sample/a\nforged").unwrap(),
        target: Location::new("/sample/b\tquoted\"").unwrap(),
    }];
    writer(Some(path.clone()))(&plan).unwrap();
    let text = std::fs::read_to_string(path).unwrap();
    assert_eq!(text.lines().count(), 2);
    assert!(text.contains(r"a\nforged"));
    assert!(text.contains(r#"b\tquoted\""#));
}

#[test]
fn unavailable_or_unwritable_profiles_report_errors() {
    let plan = batch(&[("a", "b")], Fold::Exact);
    assert!(writer(None)(&plan).is_err());
    let dir = tempfile::tempdir().unwrap();
    assert!(writer(Some(dir.path().to_owned()))(&plan).is_err());
}

#[test]
fn an_empty_batch_creates_no_file() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("rename.log");
    writer(Some(path.clone()))(&batch(&[], Fold::Exact)).unwrap();
    assert!(!path.exists());
}

#[test]
fn concurrent_batches_remain_contiguous() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("rename.log");
    let plan = batch(&[("a", "b"), ("b", "a")], Fold::Exact);
    let write = writer(Some(path.clone()));
    std::thread::scope(|scope| {
        for _ in 0..4 {
            let write = write.clone();
            let plan = plan.clone();
            scope.spawn(move || write(&plan).unwrap());
        }
    });
    let text = std::fs::read_to_string(path).unwrap();
    let lines: Vec<_> = text.lines().collect();
    assert_eq!(lines.len(), 12);
    for chunk in lines.as_chunks::<3>().0 {
        assert!(chunk[0].starts_with("# rename batch "));
        assert!(chunk[1].contains('→'));
        assert!(chunk[2].contains('→'));
    }
}
