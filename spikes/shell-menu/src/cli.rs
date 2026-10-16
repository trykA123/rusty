use std::path::PathBuf;

use anyhow::{Context, bail};

#[derive(Debug, PartialEq)]
pub enum Target {
    Id(u32),
    Name(String),
}

#[derive(Debug, PartialEq)]
pub struct Args {
    pub paths: Vec<PathBuf>,
    pub invoke: Option<Target>,
    pub explorer_commands: bool,
}

pub const USAGE: &str =
    "usage: shell-menu [--invoke <verb|id|text>] [--explorer-commands] <path>...";

pub fn parse(args: impl IntoIterator<Item = String>) -> anyhow::Result<Args> {
    let mut parsed = Args {
        paths: Vec::new(),
        invoke: None,
        explorer_commands: false,
    };
    let mut args = args.into_iter();
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--invoke" => {
                let value = args.next().context(USAGE)?;
                parsed.invoke = Some(target(value));
            }
            "--explorer-commands" => parsed.explorer_commands = true,
            flag if flag.starts_with("--") => bail!("unknown flag {flag}\n{USAGE}"),
            _ => parsed.paths.push(PathBuf::from(arg)),
        }
    }
    if parsed.paths.is_empty() {
        bail!(USAGE);
    }
    Ok(parsed)
}

fn target(value: String) -> Target {
    value.parse().map_or(Target::Name(value), Target::Id)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(list: &[&str]) -> anyhow::Result<Args> {
        parse(list.iter().map(|s| s.to_string()))
    }

    #[test]
    fn paths_and_flags() {
        let parsed = args(&["a.zip", "--explorer-commands", "--invoke", "copy", "b"]).unwrap();
        assert_eq!(
            parsed.paths,
            vec![PathBuf::from("a.zip"), PathBuf::from("b")]
        );
        assert_eq!(parsed.invoke, Some(Target::Name("copy".into())));
        assert!(parsed.explorer_commands);
    }

    #[test]
    fn numeric_invoke_is_an_id() {
        let parsed = args(&["--invoke", "17", "x"]).unwrap();
        assert_eq!(parsed.invoke, Some(Target::Id(17)));
    }

    #[test]
    fn rejects_missing_paths_and_unknown_flags() {
        assert!(args(&["--explorer-commands"]).is_err());
        assert!(args(&["--nope", "x"]).is_err());
        assert!(args(&["x", "--invoke"]).is_err());
    }
}
