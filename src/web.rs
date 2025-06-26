use axum::{Router, http::StatusCode, response::IntoResponse, routing::get};

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
    let api_router =
        Router::new().route("/api/hello", get(|| async { "Hello from Rust API (dev)!" }));

    let frontend_router = frontend_router(frontend_proxy_port);
    let app = Router::new().merge(frontend_router).merge(api_router);
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

fn frontend_router(frontend_proxy_port: u16) -> Router {
    if cfg!(debug_assertions) {
        log::info!("Running in development mode. Frontend will be served from Vite dev server.");
    } else {
        log::info!("Running in production mode. Frontend will be served statically.");
    }

    #[cfg(debug_assertions)]
    {
        // Route all routes, proxy to the Vite development server
        // This is a simple proxy. For more complex proxying (e.g., handling WebSockets),
        // you might need a dedicated reverse proxy crate like `reqwest-middleware` or similar.
        Router::new().fallback(get(move |req: axum::http::Request<axum::body::Body>| {
            proxy_to_frontend_dev_server(req, frontend_proxy_port)
        }))
    }
    #[cfg(not(debug_assertions))]
    {
        let _ = frontend_proxy_port;
        Router::new()
            // Fallback to serve static files from the embedded content
            .fallback(get(serve_embedded_assets))
    }
}

#[cfg(debug_assertions)]
async fn proxy_to_frontend_dev_server(
    req: axum::http::Request<axum::body::Body>,
    port: u16,
) -> impl IntoResponse {
    let path = match req.uri().path_and_query() {
        Some(path_and_query) => path_and_query.as_str(),
        None => "",
    };

    let forward_url = format!("http://localhost:{port}{path}");
    log::info!(
        "Received request at {}, forwarding to {}",
        req.uri(),
        forward_url
    );
    let client = match reqwest::Client::builder()
        .no_gzip()
        .no_brotli()
        .no_deflate()
        .build()
    {
        Ok(client) => client,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to create proxy client".to_string(),
            )
                .into_response();
        }
    };

    let res = match client
        .request(req.method().clone(), &forward_url)
        .headers(req.headers().clone())
        .send()
        .await
    {
        Ok(response) => response,
        Err(e) => {
            log::error!("Failed to proxy to frontend dev server: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to connect to frontend dev server".to_string(),
            )
                .into_response();
        }
    };

    // Forward the response from the frontend dev server
    let status = res.status();
    let headers = res.headers().clone();
    let body = res.bytes().await.unwrap_or_default();

    let mut response = axum::response::Response::builder().status(status);

    for (header_name, header_value) in headers.iter() {
        response = response.header(header_name, header_value);
    }

    response
        .body(axum::body::Body::from(body))
        .unwrap()
        .into_response()
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
                .status(StatusCode::OK)
                .header(axum::http::header::CONTENT_TYPE, mime.essence_str());

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
                    .status(StatusCode::OK)
                    .header(axum::http::header::CONTENT_TYPE, mime.essence_str())
                    .body(axum::body::Body::from(content.data))
                    .unwrap()
                    .into_response()
            }
            None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
        },
    }
}
