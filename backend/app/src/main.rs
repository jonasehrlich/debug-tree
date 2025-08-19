use clap::Parser;
use std::path::PathBuf;

/// Debug Tree CLI
#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    #[clap(flatten)]
    flows_dir: DebugFlowDirArgs,
    /// Port to bind the server to, use 0 to let the operating system select a free port
    #[arg(short, long, default_value_t = 8000)]
    port: u16,
    /// Port on localhost to proxy all fallback requests to, only available in debug builds
    #[arg(long, default_value_t = 5173, hide = cfg!(not(debug_assertions)))]
    frontend_proxy_port: u16,
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

#[tokio::main]
async fn main() {
    env_logger::builder()
        .filter_level(log::LevelFilter::Info)
        .init();

    let args = Cli::parse();
    let flows_dir = debug_flow::flow::FlowsDir::new(args.flows_dir.dir.clone())
        .expect("Error creating debug flow directory");
    let server =
        debug_flow::web::serve("localhost", args.port, args.frontend_proxy_port, flows_dir);

    let url = format!("http://localhost:{}", args.port);
    if open::that(&url).is_err() {
        log::warn!("Failed to open browser. Please visit {url} manually.");
    }
    server.await.unwrap();
}
