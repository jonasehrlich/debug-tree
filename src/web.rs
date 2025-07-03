use crate::project;
use axum::routing;
#[cfg(not(debug_assertions))]
use axum::{http, response::IntoResponse};
#[cfg(debug_assertions)]
use axum_reverse_proxy::ReverseProxy;
#[cfg(not(debug_assertions))]
use mime_guess::from_path;
use std::sync::Arc;
use tokio::sync::Mutex;
use utoipa::OpenApi;

#[cfg(not(debug_assertions))]
#[derive(rust_embed::RustEmbed)]
#[folder = "frontend/dist"]
#[exclude = ".gitkeep"]
pub struct Asset;

pub mod api;

#[derive(utoipa::OpenApi)]
#[openapi(
        nest(
            (path = "/api", api = api::ApiDoc)
        )
    )]
pub struct ApiDoc;

/// Application state available in all request handlers
#[derive(Clone)]
struct AppState {
    project_dir: project::ProjectDir,
    repo: Arc<Mutex<Option<git2::Repository>>>,
}

impl AppState {
    pub fn new(project_dir: project::ProjectDir) -> Self {
        let repo = match project_dir.path().parent() {
            Some(p) => match git2::Repository::open(p) {
                Ok(repo) => Some(repo),
                Err(_) => {
                    log::warn!("Repository not found in '{}'", p.display());
                    None
                }
            },
            None => {
                log::warn!(
                    "Could not get parent director of project dir '{}'",
                    project_dir.path().display()
                );
                None
            }
        };

        AppState {
            project_dir,
            repo: Arc::new(Mutex::new(repo)),
        }
    }

    pub fn project_dir(&self) -> &project::ProjectDir {
        &self.project_dir
    }

    pub fn repo(&self) -> &Arc<Mutex<Option<git2::Repository>>> {
        &self.repo
    }
}

pub async fn serve(
    host: &str,
    port: u16,
    frontend_proxy_port: u16,
    project_dir: crate::project::ProjectDir,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState::new(project_dir);

    let app = routing::Router::new()
        .nest("/api", api::router())
        .with_state(app_state)
        .merge(
            utoipa_rapidoc::RapiDoc::with_openapi("/api-docs/openapi.json", ApiDoc::openapi())
                .path("/api-docs"),
        )
        .merge(frontend_router(frontend_proxy_port));

    let listener = tokio::net::TcpListener::bind(format!("{host}:{port}"))
        .await
        .unwrap();
    println!("Server running on http://{host}:{port}",);
    axum::serve(listener, app)
        // .with_graceful_shutdown(shutdown_signal(deletion_task.abort_handle()))
        .await?;

    // deletion_task.await??;
    Ok(())
}

/// Get the router for the frontend
/// For debug builds a reverse proxy is created
fn frontend_router(frontend_proxy_port: u16) -> axum::Router {
    if cfg!(debug_assertions) {
        log::info!("Running in development mode. Frontend will be served from Vite dev server.");
    } else {
        log::info!("Running in production mode. Frontend will be served statically.");
    }

    #[cfg(debug_assertions)]
    {
        // Route all routes, proxy to the Vite development server
        let proxy = ReverseProxy::new(
            "",
            format!("http://localhost:{frontend_proxy_port}").as_str(),
        );

        axum::Router::new().fallback_service(proxy)
    }
    #[cfg(not(debug_assertions))]
    {
        let _ = frontend_proxy_port;
        axum::Router::new()
            // Fallback to serve static files from the embedded content
            // TODO: don't do a fallback here, serve index.html, "" and /assets
            .fallback(routing::get(serve_embedded_assets))
    }
}

#[cfg(not(debug_assertions))]
async fn serve_embedded_assets(uri: axum::extract::OriginalUri) -> impl IntoResponse {
    let path = match uri.path().trim_start_matches('/') {
        p if p.is_empty() => "index.html",
        p => p,
    };

    let asset = Asset::get(path);

    match asset {
        Some(content) => {
            let mime = from_path(path).first_or_text_plain();
            let mut response = axum::response::Response::builder()
                .status(http::StatusCode::OK)
                .header(http::header::CONTENT_TYPE, mime.essence_str());

            if path.contains(".") && !path.ends_with("index.html") {
                response = response.header(
                    axum::http::header::CACHE_CONTROL,
                    "public, max-age=31536000, immutable",
                );
            }

            response
                .body(axum::body::Body::from(content.data))
                .unwrap()
                .into_response()
        }
        None => match Asset::get("index.html") {
            Some(content) => {
                let mime = from_path("index.html").first_or_text_plain();
                axum::http::Response::builder()
                    .status(http::StatusCode::OK)
                    .header(http::header::CONTENT_TYPE, mime.essence_str())
                    .body(axum::body::Body::from(content.data))
                    .unwrap()
                    .into_response()
            }
            None => (http::StatusCode::NOT_FOUND, "404 Not Found").into_response(),
        },
    }
}
