use clap::{Parser, Subcommand};
use serde::Serialize;
use std::path::PathBuf;

use tree::{TreeType, get_dummy_tree};

mod tree;
mod utils;

#[derive(thiserror::Error, Debug)]
enum LoadSaveError {
    #[error("I/O error")]
    Io(#[from] std::io::Error),
    #[error("JSON error")]
    Json(#[from] serde_json::Error),
    #[error("Tree error")]
    Tree,
}

fn load_tree_from_file(file_path: &PathBuf) -> std::result::Result<TreeType, LoadSaveError> {
    let file_content = std::fs::read_to_string(file_path)?;
    serde_json::from_str(&file_content).map_err(|_| LoadSaveError::Tree)
}

fn save_tree_to_file(
    tree: &TreeType,
    file_path: &PathBuf,
) -> std::result::Result<(), LoadSaveError> {
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let json_content = serde_json::to_string(tree)?;
    std::fs::write(file_path, json_content)?;
    Ok(())
}

/// Debug Tree CLI
#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    /// Project name
    #[command(subcommand)]
    command: Commands,
}
#[derive(Parser, Debug)]
struct ProjectArgs {
    /// Projects directory
    #[arg(long, default_value = "./.debug-tree")]
    dir: PathBuf,
    /// Project name
    #[arg(name = "project", value_name = "PROJECT")]
    name: String,
}

impl ProjectArgs {
    fn get_path(&self) -> PathBuf {
        let mut path = self.dir.clone();
        path.push(utils::to_kebab_case(self.name.as_str()));
        path.with_extension("json")
    }
}

#[derive(Parser)]
#[command(group(clap::ArgGroup::new("formatting").args(&["indent", "min"]).multiple(false)))]
struct PrintJsonArgs {
    #[clap(flatten)]
    project: ProjectArgs,
    /// Number of spaces to indent the JSON output
    #[arg(short, long, default_value_t = 2)]
    indent: usize,
    /// Minify the JSON output
    #[arg(long)]
    min: bool,
}

#[derive(Parser)]
struct NewArgs {
    #[clap(flatten)]
    project: ProjectArgs,
    /// Create a project with dummy data
    #[arg(long)]
    dummy: bool,
    /// Overwrite an existing project
    #[arg(long)]
    force: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Create a new project
    New(NewArgs),
    /// Run the TUI for a project
    Tui(ProjectArgs),
    /// Print the project tree as JSON
    PrintJson(PrintJsonArgs),
}

fn main() {
    let args = Cli::parse();
    match &args.command {
        Commands::New(args) => {
            let project_path = args.project.get_path();
            if !args.force && project_path.exists() {
                println!("Project already exists at {}", project_path.display());
                return;
            }
            let tree = match args.dummy {
                true => get_dummy_tree(&args.project.name).expect("Failed to create dummy tree"),
                false => TreeType::new(Some(args.project.name.as_str())),
            };
            save_tree_to_file(&tree, &project_path).expect("Failed to save new project tree");

            let project_type = match args.dummy {
                true => "dummy",
                false => "empty",
            };
            println!(
                "Created {} project at {}",
                project_type,
                project_path.display()
            );
        }
        Commands::PrintJson(args) => {
            let tree =
                load_tree_from_file(&args.project.get_path()).expect("Failed to load project tree");
            if args.min {
                println!("{}", serde_json::to_string(&tree).unwrap());
            } else {
                let indent_vec = " ".repeat(args.indent).into_bytes();
                let formatter = serde_json::ser::PrettyFormatter::with_indent(&indent_vec);
                let mut buf = Vec::new();
                let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
                tree.serialize(&mut ser).expect("Failed to serialize tree");
                println!(
                    "{}",
                    String::from_utf8(buf).expect("Failed to convert buffer to string")
                );
            }
        }
        Commands::Tui(_args) => {
            todo!("Implement TUI functionality");
        }
    };
}
