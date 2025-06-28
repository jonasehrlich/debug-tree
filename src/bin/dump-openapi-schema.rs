use clap::Parser;
use debug_tree::web;
use std::path;
use utoipa::OpenApi;

#[derive(Parser)]
struct Cli {
    #[arg(default_value = "openapi-schema.json")]
    output_file: path::PathBuf,
}

fn main() {
    let args = Cli::parse();
    let openapi = web::ApiDoc::openapi();
    std::fs::write(
        args.output_file.clone(),
        serde_json::to_string_pretty(&openapi).unwrap(),
    )
    .expect("Failed to write OpenAPI schema to file");
    println!(
        "OpenAPI schema written to '{}'",
        &args.output_file.display()
    );
}
