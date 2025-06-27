use clap::{Parser, Subcommand};
use serde::Serialize;
use std::path::PathBuf;

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
    /// Overwrite an existing project
    #[arg(long)]
    force: bool,
}

#[derive(Parser)]
struct ServeArgs {
    #[clap(flatten)]
    project: ProjectArgs,
    /// Host to bind the server to
    #[arg(long, default_value = "localhost")]
    host: String,
    /// Port to bind the server to
    #[arg(short, long, default_value_t = 8000)]
    port: u16,
    /// Port on localhost to proxy all fallback requests to, only available in debug builds
    #[arg(long, default_value_t = 5173, hide = cfg!(not(debug_assertions)))]
    frontend_proxy_port: u16,
}

#[derive(Subcommand)]
enum Commands {
    /// Create a new project
    New(NewArgs),
    /// Run the server and web-frontend for a project
    Serve(ServeArgs),
    /// Print the project tree as JSON
    PrintJson(PrintJsonArgs),
}

#[tokio::main]
async fn main() {
    env_logger::builder()
        .filter_level(log::LevelFilter::Info)
        .init();

    let args = Cli::parse();
    match &args.command {
        Commands::New(args) => {
            let project_dir = debug_tree::project::ProjectDir::new(args.project.dir.clone())
                .expect("Error creating project directory");
            let project = project_dir
                .create_project(&args.project.name, args.force)
                .expect("Error creating project");
            println!(
                "Created project '{}' in '{}'",
                project.name(),
                project_dir.path().display()
            );
        }
        Commands::PrintJson(args) => {
            let project_dir = debug_tree::project::ProjectDir::new(args.project.dir.clone())
                .expect("Error creating project directory");

            let project = project_dir
                .get_project(&args.project.name)
                .expect("Error getting project");

            if args.min {
                println!("{}", serde_json::to_string(&project).unwrap());
            } else {
                let indent_vec = " ".repeat(args.indent).into_bytes();
                let formatter = serde_json::ser::PrettyFormatter::with_indent(&indent_vec);
                let mut buf = Vec::new();
                let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
                project
                    .serialize(&mut ser)
                    .expect("Error: Failed to serialize project");
                println!(
                    "{}",
                    String::from_utf8(buf).expect("Failed to convert buffer to string")
                );
            }
        }
        Commands::Serve(args) => {
            debug_tree::web::serve(args.host.as_str(), args.port, args.frontend_proxy_port)
                .await
                .unwrap();
        }
    };
}
