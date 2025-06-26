use std::env;
use std::path::Path;
use std::process::Command;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("cargo:rerun-if-changed=frontend/src");
    println!("cargo:rerun-if-changed=frontend/package.json");
    println!("cargo:rerun-if-changed=frontend/public");

    let profile = env::var("PROFILE").unwrap(); // "debug" or "release"

    if profile == "release" {
        println!("Building frontend for release...");
        let frontend_dir = Path::new("frontend");

        // Ensure npm dependencies are installed
        let npm_install_output = Command::new("npm")
            .arg("install")
            .current_dir(frontend_dir)
            .output()?;
        if !npm_install_output.status.success() {
            return Err(format!("npm install failed: {:?}", npm_install_output).into());
        }

        // Build the frontend
        let npm_build_output = Command::new("npm")
            .arg("run")
            .arg("build")
            .current_dir(frontend_dir)
            .output()?;

        if npm_build_output.status.success() {
            println!("cargo:info=Frontend built successfully.");
        } else {
            return Err(format!("npm run build failed: {:?}", npm_build_output).into());
        }
    } else {
        println!("cargo:info=Skipping frontend build in development mode.");
    }

    Ok(())
}
