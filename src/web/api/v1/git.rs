use crate::{web, web::api};
use axum::extract::{Path, State};
use axum::{Json, routing};
use serde::Serialize;
use utoipa::ToSchema;

pub fn router() -> routing::Router<web::AppState> {
    routing::Router::new()
        // .route(
        //     "/commits",
        //     routing::get(list_projects).post(create_project),
        // )
        .route("/commit/{commit_id}", routing::get(get_commit))
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct Signature {
    name: String,
    email: String,
}
impl From<git2::Signature<'_>> for Signature {
    fn from(signature: git2::Signature<'_>) -> Self {
        Signature {
            name: signature.name().unwrap_or("").to_string(),
            email: signature.email().unwrap_or("").to_string(),
        }
    }
}

struct Git2Time(git2::Time);

impl From<Git2Time> for chrono::DateTime<chrono::Utc> {
    fn from(time: Git2Time) -> Self {
        chrono::DateTime::from_timestamp(time.0.seconds(), 0).unwrap_or_else(|| {
            chrono::DateTime::from_timestamp(0, 0)
                .unwrap_or_else(|| panic!("Failed to convert git2::Time to chrono::DateTime"))
        })
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct Commit {
    id: String,
    summary: String,
    body: String,
    time: chrono::DateTime<chrono::Utc>,
    commiter: Signature,
    author: Signature,
}

impl<'repo> From<git2::Commit<'repo>> for Commit {
    fn from(commit: git2::Commit<'repo>) -> Self {
        Commit {
            id: commit.id().to_string(),
            summary: commit.summary().unwrap_or("").to_string(),
            body: commit.body().unwrap_or("").to_string(),
            time: Git2Time(commit.time()).into(),
            commiter: commit.committer().into(),
            author: commit.author().into(),
        }
    }
}

#[derive(utoipa::OpenApi)]
#[openapi(paths(get_commit), tags((name = "Git Repository", description="Git Repository related endpoints")) )]
pub(super) struct ApiDoc;

#[utoipa::path(
    get,
    path = "/commit/{commit_id}",
    description = "Get a commit by its ID",
    responses(
        (status = http::StatusCode::OK, description = "Commit exists", body = Commit),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::NOT_FOUND, description = "Commit not found", body = api::ApiStatusDetailResponse),
    )
)]
async fn get_commit(
    State(state): State<web::AppState>,
    Path(commit_id): Path<String>,
) -> Result<Json<Commit>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;

    // Attempt to find the commit in the repository
    let commit = repo
        .find_commit_by_prefix(&commit_id)
        .map_err(|e| match e.code() {
            git2::ErrorCode::Invalid => {
                api::AppError::BadRequest(format!("Invalid commit ID '{}': {}", commit_id, e))
            }
            git2::ErrorCode::NotFound => {
                api::AppError::NotFound(format!("Commit '{}' not found: {}", commit_id, e))
            }
            _ => api::AppError::InternalServerError(format!(
                "Failed to find commit '{}': {}",
                commit_id, e
            )),
        })?;
    Ok(Json(commit.into()))
}
