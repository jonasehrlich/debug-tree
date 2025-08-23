use crate::{actors, flow, fswatcher};
use axum::routing;
#[cfg(not(debug_assertions))]
use axum::{http, response::IntoResponse};
#[cfg(debug_assertions)]
use axum_reverse_proxy::ReverseProxy;
use hannibal::prelude::*;
#[cfg(not(debug_assertions))]
use mime_guess::from_path;
use tokio::sync::broadcast;
use utoipa::OpenApi;

#[cfg(not(debug_assertions))]
#[derive(rust_embed::RustEmbed)]
#[folder = "../../frontend/dist"]
#[exclude = ".gitkeep"]
pub struct Asset;

pub mod api;

#[derive(utoipa::OpenApi)]
#[openapi(info(
            title = "Debug Flow API",
            description = "API for the debug-flow project",
            license(name= "MIT", url = "https://mit-license.org/", identifier = "MIT"),
        ),
        nest(
            (path = "/api", api = api::ApiDoc)
        )
    )]
pub struct ApiDoc;

/// Application state available in all request handlers
#[derive(Clone)]
struct AppState {
    flows_dir: flow::FlowsDir,
    git_actor: actors::git::GitActorAddr,
    git_status_tx: broadcast::Sender<git2_ox::Status>,
}

impl AppState {
    pub fn try_new(flows_dir: flow::FlowsDir) -> Result<Self, Box<dyn std::error::Error>> {
        let repo = flows_dir.git_repo();
        let git_actor = crate::actors::git::GitActor::try_from_path(repo)?.spawn();

        let (tx, _rx) = broadcast::channel(16);

        Ok(Self {
            flows_dir,
            git_actor,
            git_status_tx: tx,
        })
    }

    pub fn repo_root_path(&self) -> &std::path::Path {
        self.flows_dir.path().parent().unwrap()
    }

    pub fn flows_dir(&self) -> &flow::FlowsDir {
        &self.flows_dir
    }

    pub fn git_actor(&self) -> &actors::git::GitActorAddr {
        &self.git_actor
    }

    /// Sender for the broadcast channel sending Git status updates
    pub fn git_status_tx(&self) -> &broadcast::Sender<git2_ox::Status> {
        &self.git_status_tx
    }
}

/// Serves the web application, including the API and frontend.
///
/// This function sets up and starts the web server. It binds to the specified host and port,
/// initializes the application state (including the `FlowsDir` and `GitActor`),
/// configures API documentation (RapiDoc), and serves the frontend.
///
/// In debug builds, the frontend is served via a reverse proxy to a Vite development server.
/// In release builds, the frontend is served statically from embedded assets.
///
/// # Arguments
///
/// * `host` - The host address to bind to (e.g., "localhost").
/// * `port` - The port to bind to.
/// * `frontend_proxy_port` - The port of the frontend development server (only used in debug builds).
/// * `flows_dir` - The `FlowsDir` instance, providing access to debug flow data.
/// * `on_bind` - A closure that is called once the server successfully binds to the address.
///
/// # Returns
///
/// A `Result` indicating success or an error.
///
/// # Errors
///
/// Returns an error if:
/// - The `AppState` cannot be created (e.g., issues with `FlowsDir` or `GitActor`).
/// - The server fails to bind to the specified address.
/// - The `axum::serve` operation encounters an error.
pub async fn serve<F>(
    host: &str,
    port: u16,
    frontend_proxy_port: u16,
    flows_dir: crate::flow::FlowsDir,
    on_bind: F,
) -> Result<(), Box<dyn std::error::Error>>
where
    F: Fn(),
{
    let app_state = AppState::try_new(flows_dir)?;

    let repo_root = app_state.repo_root_path().to_path_buf();

    let rapidoc_path = "/api-docs";
    let app = routing::Router::new()
        .nest("/api", api::router())
        .with_state(app_state.clone())
        .merge(
            utoipa_rapidoc::RapiDoc::with_openapi("/api-docs/openapi.json", ApiDoc::openapi())
                .path(rapidoc_path),
        )
        .merge(frontend_router(frontend_proxy_port));

    let listener = tokio::net::TcpListener::bind(format!("{host}:{port}"))
        .await
        .unwrap();
    log::info!(
        "Server running on http://{}",
        listener.local_addr().unwrap()
    );
    log::info!(
        "API docs available on http://{}{}",
        listener.local_addr().unwrap(),
        rapidoc_path
    );
    on_bind();

    let paths = [repo_root.as_path()];

    // TODO: Do we need to move the debouncer to another thread?
    let (_debouncer, fs_rx) = fswatcher::setup_watchers(&paths, std::time::Duration::from_secs(1));

    tokio::spawn(async move {
        loop {
            let res = fs_rx.recv();
            match res {
                Ok(_) => {
                    // We get multiple events but don't care at all, we only need to get one Git status
                    let actor = app_state.git_actor();
                    let msg = actors::git::GetRepositoryStatus;
                    let status = actor.call(msg).await.unwrap().unwrap();
                    let _ = app_state.git_status_tx().send(status);
                }
                Err(errs) => {
                    log::error!("watch error: {errs:?}")
                }
            }
        }
    });

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
