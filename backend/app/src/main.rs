use clap::{Parser, Subcommand};
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
struct DebugFlowDirArgs {
    /// Projects directory
    #[arg(long, default_value = "./.debug-flow")]
    dir: PathBuf,
}

#[derive(Parser, Debug)]
struct DebugFlowArgs {
    /// flow name
    #[arg(name = "flow", value_name = "FLOW")]
    name: String,
}

#[derive(Parser)]
struct NewArgs {
    #[clap(flatten)]
    flows_dir: DebugFlowDirArgs,
    #[clap(flatten)]
    flow: DebugFlowArgs,
    /// Overwrite an existing project
    #[arg(long)]
    force: bool,
}

#[derive(Parser)]
struct ServeArgs {
    #[clap(flatten)]
    flows_dir: DebugFlowDirArgs,
    /// Port to bind the server to, use 0 to let the operating system select a free port
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
}

#[tokio::main]
async fn main() {
    env_logger::builder()
        .filter_level(log::LevelFilter::Info)
        .init();

    let args = Cli::parse();
    match &args.command {
        Commands::New(args) => {
            let flows_dir = debug_flow::flow::FlowsDir::new(args.flows_dir.dir.clone())
                .expect("Error creating debug flow directory");
            let flow = flows_dir
                .create_flow(&args.flow.name, args.force)
                .expect("Error creating debug flow");
            println!(
                "Created debug flow '{}' in '{}'",
                flow.name(),
                flows_dir.path().display()
            );
        }
        Commands::Serve(args) => {
            let flows_dir = debug_flow::flow::FlowsDir::new(args.flows_dir.dir.clone())
                .expect("Error creating debug flow directory");
            debug_flow::web::serve("localhost", args.port, args.frontend_proxy_port, flows_dir)
                .await
                .unwrap();
        }
    };
}
