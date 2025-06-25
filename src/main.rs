use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tree_ds::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
pub struct GitMetadata {
    pub revision: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub struct StateMetadata {
    pub title: String,
    pub git: Option<GitMetadata>,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub struct ActionMetadata {
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Eq, PartialEq, Deserialize)]
pub enum Metadata {
    Action(ActionMetadata),
    State(StateMetadata),
}

type NodeType = Node<AutomatedId, Metadata>;
type TreeType = Tree<AutomatedId, Metadata>;

fn add_action_node(
    tree: &mut TreeType,
    parent_id: &AutomatedId,
    title: &str,
) -> Result<AutomatedId> {
    tree.add_node(
        NodeType::new_with_auto_id(Some(Metadata::Action(ActionMetadata {
            title: title.to_string(),
        }))),
        Some(parent_id),
    )
}

fn add_state_node(
    tree: &mut TreeType,
    parent_id: &AutomatedId,
    title: &str,
    git_metadata: Option<GitMetadata>,
) -> Result<AutomatedId> {
    tree.add_node(
        NodeType::new_with_auto_id(Some(Metadata::State(StateMetadata {
            title: title.to_string(),
            git: git_metadata,
        }))),
        Some(parent_id),
    )
}

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

fn get_dummy_tree(project_name: &str) -> Result<TreeType> {
    let mut tree: TreeType = Tree::new(Some(project_name));

    let root_state = StateMetadata {
        title: "Toilet clogged".to_string(),
        git: None,
    };
    let root = tree.add_node(
        NodeType::new_with_auto_id(Some(Metadata::State(root_state))),
        None,
    )?;

    let flush = add_action_node(&mut tree, &root, "Flush toilet")?;
    let _overflow = add_state_node(&mut tree, &flush, "overflow", None)?;

    let pump = add_action_node(&mut tree, &root, "pump it up")?;
    let _unclogged = add_state_node(&mut tree, &pump, "unclogged", None)?;
    Ok(tree)
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
    #[arg(long, default_value = "./debug-tree")]
    dir: PathBuf,
    /// Project name
    project: String,
}

impl ProjectArgs {
    fn get_project_path(&self) -> PathBuf {
        let mut path = self.dir.clone();
        path.push(to_kebab_case(self.project.as_str()));
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

#[derive(Subcommand)]
enum Commands {
    /// Create a new project
    New(ProjectArgs),
    CreateDummy(ProjectArgs),
    Tui(ProjectArgs),
    PrintJson(PrintJsonArgs),
}

fn to_kebab_case(s: &str) -> String {
    s.to_lowercase().replace(' ', "-").replace("_", "-")
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_kebab_case() {
        assert_eq!(to_kebab_case("Hello World"), "hello-world");
        assert_eq!(to_kebab_case("hello_world"), "hello-world");
        assert_eq!(to_kebab_case("Rust Programming"), "rust-programming");
        assert_eq!(to_kebab_case("Debug Tree CLI"), "debug-tree-cli");
    }
}

fn main() {
    let args = Cli::parse();
    match &args.command {
        Commands::New(args) => {
            let tree: TreeType = Tree::new(Some(args.project.as_str()));
            let project_path = args.get_project_path();
            if project_path.exists() {
                println!("Project already exists at {}", project_path.display());
                return;
            }

            save_tree_to_file(&tree, &project_path).expect("Failed to save new project tree");
            println!("Created empty project at {}", project_path.display());
        }
        Commands::CreateDummy(args) => {
            let project_path = args.get_project_path();
            if project_path.exists() {
                println!("Project already exists at {}", project_path.display());
                return;
            }
            let tree = get_dummy_tree(&args.project).expect("Failed to create dummy tree");
            save_tree_to_file(&tree, &project_path).expect("Failed to save dummy project tree");
            println!("Created dummy project at {}", project_path.display());
        }
        Commands::PrintJson(args) => {
            let tree = load_tree_from_file(&args.project.get_project_path())
                .expect("Failed to load project tree");
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
