use axum::routing;
#[cfg(not(debug_assertions))]
use axum::{http, response::IntoResponse};
#[cfg(debug_assertions)]
use axum_reverse_proxy::ReverseProxy;
#[cfg(not(debug_assertions))]
use mime_guess::from_path;

#[cfg(not(debug_assertions))]
#[derive(rust_embed::RustEmbed)]
#[folder = "frontend/dist"]
#[exclude = ".gitkeep"]
pub struct Asset;

pub async fn serve(
    host: &str,
    port: u16,
    frontend_proxy_port: u16,
) -> Result<(), Box<dyn std::error::Error>> {
    let api_router = axum::Router::new().route(
        "/api/hello",
        routing::get(|| async { "Hello from Rust API (dev)!" }),
    );

    let frontend_router = frontend_router(frontend_proxy_port);
    let app = axum::Router::new().merge(frontend_router).merge(api_router);
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
