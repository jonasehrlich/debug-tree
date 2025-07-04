use crate::{web, web::api};
use axum::extract::{Path, Query, State};
use axum::{Json, routing};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

pub fn router() -> routing::Router<web::AppState> {
    routing::Router::new()
        .route("/commits", routing::get(list_commits))
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
#[openapi(paths(get_commit, list_commits), tags((name = "Git Repository", description="Git Repository related endpoints")) )]
pub(super) struct ApiDoc;

#[utoipa::path(
    get,
    path = "/commit/{commit_id}",
    params(
        ("commit_id", description = "The ID of the commit to retrieve", example = "abc123"),
    ),
    description = "Get a commit",
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

    Ok(Json(get_commit_by_prefix(repo, &commit_id)?.into()))
}

fn get_commit_by_prefix<'repo>(
    repo: &'repo git2::Repository,
    commit_id: &str,
) -> Result<git2::Commit<'repo>, api::AppError> {
    repo.find_commit_by_prefix(commit_id)
        .map_err(|e| match e.code() {
            git2::ErrorCode::Invalid => {
                api::AppError::BadRequest(format!("Invalid base commit ID '{}': {}", commit_id, e))
            }
            git2::ErrorCode::NotFound => {
                api::AppError::NotFound(format!("Base commit '{}' not found: {}", commit_id, e))
            }
            _ => api::AppError::InternalServerError(format!(
                "Failed to find base commit '{}': {}",
                commit_id, e
            )),
        })
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ListCommitsResponse {
    /// Array of commits between the base and head commit IDs
    /// in reverse chronological order.
    commits: Vec<Commit>,
}

impl ListCommitsResponse {
    pub fn from_commits<I>(iter: I) -> Result<Self, api::AppError>
    where
        I: IntoIterator<Item = Result<Commit, api::AppError>>,
    {
        let commits = iter
            .into_iter()
            .collect::<Result<Vec<_>, api::AppError>>()?;
        Ok(ListCommitsResponse { commits })
    }
}

#[derive(Serialize, ToSchema, Deserialize, IntoParams)]
#[serde(rename_all = "camelCase")]
struct CommitRangeQuery {
    /// The base revision of the range, if empty, the first commit is used.
    base_rev: Option<String>,
    /// The head revision of the range, if empty, the current HEAD is used.
    head_rev: Option<String>,
}

impl CommitRangeQuery {
    /// Get a Revwalk object for the given commit range. This allows iterating over commits
    /// in the specified range, starting from the head commit and excluding the base commit.
    pub fn revwalk<'repo>(
        &self,
        repo: &'repo git2::Repository,
    ) -> Result<git2::Revwalk<'repo>, api::AppError> {
        let mut revwalk = repo.revwalk().map_err(|e| {
            api::AppError::InternalServerError(format!("Failed to create revwalk: {}", e))
        })?;

        match &self.head_rev {
            Some(head) => {
                let oid = get_object_for_reference(repo, head)?.id();
                revwalk.push(oid).map_err(|e| {
                    api::AppError::InternalServerError(format!(
                        "Failed to push head commit '{}': {}",
                        head, e
                    ))
                })?;
            }
            _ => {
                revwalk.push_head().map_err(|e| {
                    api::AppError::InternalServerError(format!("Failed to push head commit: {}", e))
                })?;
            }
        }

        if let Some(base) = &self.base_rev {
            let oid = get_object_for_reference(repo, base)?.id();
            revwalk.hide(oid).map_err(|e| {
                api::AppError::InternalServerError(format!(
                    "Failed to push base commit '{}': {}",
                    base, e
                ))
            })?;
        }

        Ok(revwalk)
    }
}

fn get_object_for_reference<'repo>(
    repo: &'repo git2::Repository,
    reference: &str,
) -> Result<git2::Object<'repo>, api::AppError> {
    repo.revparse_single(reference).map_err(|e| {
        api::AppError::InternalServerError(format!(
            "Failed to find reference '{}': {}",
            reference, e
        ))
    })
}

#[utoipa::path(
    get,
    path = "/commits",
    description = "List commits",
    params(CommitRangeQuery),
    responses(
        (status = http::StatusCode::OK, description = "List of commits", body = ListCommitsResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn list_commits(
    State(state): State<web::AppState>,
    Query(query): Query<CommitRangeQuery>,
) -> Result<Json<ListCommitsResponse>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;

    let revwalk = query.revwalk(repo)?;

    let commits = revwalk.map(|oid_result| {
        oid_result
            .map_err(|e| {
                api::AppError::InternalServerError(format!("Error creating commit tree': {}", e))
            })
            .and_then(|oid| {
                repo.find_commit(oid).map(Commit::from).map_err(|e| {
                    api::AppError::InternalServerError(format!(
                        "Failed to find commit with ID '{}': {}",
                        oid, e
                    ))
                })
            })
    });

    Ok(Json(ListCommitsResponse::from_commits(commits)?))
}
