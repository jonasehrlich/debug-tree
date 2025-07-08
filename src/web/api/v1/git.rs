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
    committer: Signature,
    author: Signature,
}

impl<'repo> From<git2::Commit<'repo>> for Commit {
    fn from(commit: git2::Commit<'repo>) -> Self {
        Commit {
            id: commit.id().to_string(),
            summary: commit.summary().unwrap_or("").to_string(),
            body: commit.body().unwrap_or("").to_string(),
            time: Git2Time(commit.time()).into(),
            committer: commit.committer().into(),
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
    rev: &str,
) -> Result<git2::Commit<'repo>, api::AppError> {
    let oid = get_object_for_revision(repo, rev)?.id();
    repo.find_commit(oid).map_err(|e| match e.code() {
        git2::ErrorCode::Invalid => {
            api::AppError::BadRequest(format!("Invalid base commit ID '{rev}': {e}"))
        }
        git2::ErrorCode::NotFound => {
            api::AppError::NotFound(format!("Base commit '{rev}' not found: {e}"))
        }
        _ => api::AppError::InternalServerError(format!("Failed to find base commit '{rev}': {e}")),
    })
}

#[derive(Serialize, ToSchema, PartialEq)]
#[serde(rename_all = "lowercase")]
enum DiffFileType {
    Binary,
    Text,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct DiffFile {
    path: Option<String>,
    file_type: DiffFileType,
    content: Option<String>,
}

impl DiffFile {
    pub fn try_from_repo_and_diff_file(
        repo: &git2::Repository,
        diff_file: &git2::DiffFile,
    ) -> Option<DiffFile> {
        let oid = diff_file.id();
        if oid.is_zero() {
            log::warn!(
                "OID is zero '{:?}'",
                diff_file
                    .path()
                    .map(|p| { p.to_str().unwrap_or("invalid UTF-8 in path") })
                    .unwrap_or("unknown-path")
            );
            return None;
        }

        let file_type = if diff_file.is_binary() {
            DiffFileType::Binary
        } else {
            DiffFileType::Text
        };

        let content = match repo.find_blob(oid) {
            Ok(blob) if file_type == DiffFileType::Text => {
                Some(String::from_utf8_lossy(blob.content()).into_owned())
            }
            _ => {
                log::warn!("Did not find blob for {:?}", diff_file.path());
                None
            }
        };

        Some(DiffFile {
            path: diff_file
                .path()
                .map(|p| p.to_str().unwrap_or("unknown").to_owned()),
            file_type,
            content,
        })
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct Diff {
    old: Option<DiffFile>,
    new: Option<DiffFile>,
}

impl Diff {
    pub fn from_repo_and_diff_delta(repo: &git2::Repository, delta: &git2::DiffDelta) -> Diff {
        let old = DiffFile::try_from_repo_and_diff_file(repo, &delta.old_file());
        let new = DiffFile::try_from_repo_and_diff_file(repo, &delta.new_file());

        Self { old, new }
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ListCommitsResponse {
    /// Array of commits between the base and head commit IDs
    /// in reverse chronological order.
    commits: Vec<Commit>,
    diffs: Vec<Diff>,
}

impl ListCommitsResponse {
    pub fn from_commits_and_diffs<I, D>(
        commits_iter: I,
        diffs_iter: D,
    ) -> Result<Self, api::AppError>
    where
        I: IntoIterator<Item = Result<Commit, api::AppError>>,
        D: IntoIterator<Item = Diff>,
    {
        let commits = commits_iter
            .into_iter()
            .collect::<Result<Vec<_>, api::AppError>>()?;

        let diffs = diffs_iter.into_iter().collect();
        Ok(ListCommitsResponse { commits, diffs })
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
            api::AppError::InternalServerError(format!("Failed to create revwalk: {e}"))
        })?;

        match &self.head_rev {
            Some(head) => {
                let oid = get_object_for_revision(repo, head)?.id();
                revwalk.push(oid).map_err(|e| {
                    api::AppError::InternalServerError(format!(
                        "Failed to push head commit '{head}': {e}",
                    ))
                })?;
            }
            _ => {
                revwalk.push_head().map_err(|e| {
                    api::AppError::InternalServerError(format!("Failed to push head commit: {e}"))
                })?;
            }
        }

        if let Some(base) = &self.base_rev {
            let oid = get_object_for_revision(repo, base)?.id();
            revwalk.hide(oid).map_err(|e| {
                api::AppError::InternalServerError(format!(
                    "Failed to push base commit '{base}': {e}",
                ))
            })?;
        }

        Ok(revwalk)
    }
}

fn get_object_for_revision<'repo>(
    repo: &'repo git2::Repository,
    rev: &str,
) -> Result<git2::Object<'repo>, api::AppError> {
    repo.revparse_single(rev).map_err(|e| {
        api::AppError::InternalServerError(format!("Failed to find revision '{rev}': {e}",))
    })
}

fn get_tree_for_revision<'repo>(
    repo: &'repo git2::Repository,
    rev: &str,
) -> Result<git2::Tree<'repo>, api::AppError> {
    match get_commit_by_prefix(repo, rev)?.tree() {
        Ok(t) => Ok(t),
        Err(_) => Err(api::AppError::InternalServerError(
            format!("Rev {rev} is not a tree").to_string(),
        )),
    }
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
                api::AppError::InternalServerError(format!("Error creating commit tree': {e}",))
            })
            .and_then(|oid| {
                repo.find_commit(oid).map(Commit::from).map_err(|e| {
                    api::AppError::InternalServerError(format!(
                        "Failed to find commit with ID '{oid}': {e}"
                    ))
                })
            })
    });

    let rev = query.head_rev.unwrap_or_else(|| "HEAD".to_string());
    let tree = get_tree_for_revision(repo, &rev)?;

    let base_tree = match query.base_rev.map(|rev| get_tree_for_revision(repo, &rev)) {
        Some(Ok(tree)) => Some(tree),
        Some(Err(e)) => {
            return Err(e);
        }
        None => None,
    };

    let diff = repo
        .diff_tree_to_tree(base_tree.as_ref(), Some(&tree), None)
        .map_err(|e| api::AppError::InternalServerError(format!("Failed to diff tree : {e}")))?;

    let diffs_iter = diff
        .deltas()
        .map(|delta| Diff::from_repo_and_diff_delta(repo, &delta));

    Ok(Json(ListCommitsResponse::from_commits_and_diffs(
        commits, diffs_iter,
    )?))
}
