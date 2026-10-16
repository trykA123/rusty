#[cfg_attr(not(windows), allow(dead_code))]
mod cli;
#[cfg_attr(not(windows), allow(dead_code))]
mod manifest;
#[cfg_attr(not(windows), allow(dead_code))]
mod model;
#[cfg(windows)]
mod win;

#[cfg(windows)]
fn main() -> anyhow::Result<()> {
    let args = cli::parse(std::env::args().skip(1))?;
    let report = win::run(&args)?;
    println!("{}", serde_json::to_string_pretty(&report)?);
    Ok(())
}

#[cfg(not(windows))]
fn main() {
    println!("windows only");
}
