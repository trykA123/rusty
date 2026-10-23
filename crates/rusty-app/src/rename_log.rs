use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use rusty_core::{Location, OpKind, OperationPlan, Step};
use rusty_ui::browser::WriteRenameLog;

pub fn writer(path: Option<PathBuf>) -> WriteRenameLog {
    Arc::new(move |plan| {
        let path = path
            .as_deref()
            .ok_or_else(|| "the profile folder is not available".to_owned())?;
        append(path, plan).map_err(|error| format!("writing {}: {error}", path.display()))
    })
}

fn pairs(plan: &OperationPlan) -> Result<Vec<(Location, Location)>, String> {
    if plan.kind != OpKind::Rename {
        return Err("not a rename batch".to_owned());
    }
    let mut positions = HashMap::new();
    let mut pairs: Vec<(Location, Location)> = Vec::new();
    for step in &plan.steps {
        let Step::Rename { source, target } = step else {
            return Err("not a rename step".to_owned());
        };
        let index = positions.remove(source).unwrap_or_else(|| {
            pairs.push((source.clone(), source.clone()));
            pairs.len() - 1
        });
        pairs[index].1 = target.clone();
        positions.insert(target.clone(), index);
    }
    if pairs
        .iter()
        .any(|(_, target)| rusty_fs::is_rename_temporary(target))
    {
        return Err("unfinished rename staging".to_owned());
    }
    pairs.retain(|(source, target)| source != target);
    Ok(pairs)
}

fn append(path: &Path, plan: &OperationPlan) -> Result<(), String> {
    let pairs = pairs(plan)?;
    if pairs.is_empty() {
        return Ok(());
    }
    let mut batch = format!(
        "# rename batch {} UTC milliseconds\n",
        crate::files::now_ms()
    );
    for (source, target) in pairs {
        let source = serde_json::to_string(source.as_str()).map_err(|error| error.to_string())?;
        let target = serde_json::to_string(target.as_str()).map_err(|error| error.to_string())?;
        batch.push_str(&format!("{source} → {target}\n"));
    }
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|error| error.to_string())?;
    file.lock().map_err(|error| error.to_string())?;
    file.write_all(batch.as_bytes())
        .and_then(|()| file.sync_data())
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests;
