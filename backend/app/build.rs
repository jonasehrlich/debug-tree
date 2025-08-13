use std::env;
use std::process::Command;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("cargo:rerun-if-changed=frontend/src");
    println!("cargo:rerun-if-changed=package.json");
    println!("cargo:rerun-if-changed=frontend/public");

    let profile = env::var("PROFILE").unwrap(); // "debug" or "release"

    if profile == "release" {
        println!("Building frontend for release...");

        let npm_cmd = npm_command();

        // Check if npm is available
        let npm_version_output = Command::new(npm_cmd).arg("--version").output()?;
        if !npm_version_output.status.success() {
            return Err(format!("npm not found or not working: {npm_version_output:?}").into());
        }
        println!(
            "cargo:info=Using npm version: {}",
            String::from_utf8_lossy(&npm_version_output.stdout).trim()
        );

        // Ensure npm dependencies are installed
        let npm_install_output = Command::new(npm_cmd).arg("install").output()?;
        if !npm_install_output.status.success() {
            return Err(format!("npm install failed: {npm_install_output:?}").into());
        }

        // Build the frontend
        let npm_build_output = Command::new(npm_cmd).arg("run").arg("build").output()?;

        if npm_build_output.status.success() {
            println!("cargo:info=Frontend built successfully.");
        } else {
            return Err(format!("npm run build failed: {npm_build_output:?}").into());
        }
    } else {
        println!("cargo:info=Skipping frontend build in development mode.");
    }

    Ok(())
}

fn npm_command() -> &'static str {
    if cfg!(target_os = "windows") {
        "npm.cmd"
    } else {
        "npm"
    }
}
