use crate::web;
use axum::response::{IntoResponse, Response};
use axum::{http, routing};
use serde::Serialize;
use thiserror;
use utoipa::ToSchema;

type Result<T> = std::result::Result<axum::Json<T>, AppError>;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    NotFound(String),
    #[error("{0}")]
    InternalServerError(String),
    #[error("{0}")]
    BadRequest(String),
    #[error("JSON Deserialization Error")]
    JsonExtractionError(#[from] axum::extract::rejection::JsonRejection), // Handle Axum's JSON parsing errors
}

impl AppError {
    /// Get the status code for the AppError
    pub fn code(&self) -> http::StatusCode {
        match self {
            AppError::NotFound(_) => http::StatusCode::NOT_FOUND,
            AppError::InternalServerError(_) => http::StatusCode::INTERNAL_SERVER_ERROR,
            AppError::BadRequest(_) => http::StatusCode::BAD_REQUEST,
            AppError::JsonExtractionError(rejection) => rejection.status(),
        }
    }

    /// Get the canonical reason for the HTTP Status code of the AppError
    pub fn reason(&self) -> String {
        self.code()
            .canonical_reason()
            .unwrap_or("Unknown")
            .to_string()
    }

    pub fn message(self) -> String {
        match self {
            Self::JsonExtractionError(rejection) => rejection.body_text(),
            _ => self.to_string(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let code = self.code();
        let response: ApiStatusDetailResponse = self.into();

        (code, axum::Json(response)).into_response()
    }
}

impl From<git2_shim::Error> for AppError {
    fn from(error: git2_shim::Error) -> Self {
        match error {
            git2_shim::Error::NotFound(_) => AppError::NotFound(error.to_string()),
            _ => AppError::InternalServerError(error.to_string()),
        }
    }
}

#[derive(Serialize, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
/// Basic serializable API status response
pub struct ApiStatusResponse {
    /// HTTP status code
    status: u16,
    /// Canonical reason for the error
    reason: String,
}

impl From<http::StatusCode> for ApiStatusResponse {
    fn from(status: http::StatusCode) -> Self {
        Self {
            status: status.as_u16(),
            reason: status.canonical_reason().unwrap_or("Unknown").to_string(),
        }
    }
}

#[derive(Serialize, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ApiStatusDetailResponse {
    /// HTTP status code
    pub status: u16,
    /// Canonical reason for the error
    pub reason: String,
    /// Error message
    pub message: String,
    /// More details
    #[serde(default = "Vec::new")]
    pub details: Option<Vec<String>>,
}

impl From<AppError> for ApiStatusDetailResponse {
    fn from(app_error: AppError) -> Self {
        ApiStatusDetailResponse {
            status: app_error.code().as_u16(),
            reason: app_error.reason(),
            message: app_error.message(),
            details: None,
        }
    }
}

/// Get the router for the API.
pub(super) fn router() -> routing::Router<web::AppState> {
    routing::Router::new()
        .nest("/v1", v1::router())
        .route("/hello", routing::get(|| async { "Hello from Rust API!" }))
}

#[derive(utoipa::OpenApi)]
#[openapi(
        nest(
            (path = "/v1", api = v1::ApiDoc)
        ),
        info(
            description = "API for the debug-flow project",
            license (name= "MIT", url = "https://mit-license.org/")
        )
    )]
pub(super) struct ApiDoc;

pub mod v1 {
    use axum::routing;

    use crate::web;

    mod flows;
    mod git;

    /// API documentation for the v1 endpoints.
    #[derive(utoipa::OpenApi)]
    #[openapi(nest(
        (path = "/flows", api = flows::ApiDoc),
        (path = "/git", api = git::ApiDoc)
    ))]
    pub(super) struct ApiDoc;

    /// Get the router for the v1 API.
    pub(super) fn router() -> routing::Router<web::AppState> {
        routing::Router::new()
            .merge(flows::router())
            .nest("/git", git::router())
    }
}
