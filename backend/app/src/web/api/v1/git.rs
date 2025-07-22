use crate::{web, web::api};

use axum::extract::{Path, Query, State};
use axum::{Json, routing};
use git2_ox::commit;
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

pub fn router() -> routing::Router<web::AppState> {
    routing::Router::new()
        .route("/commits", routing::get(list_commits))
        .route("/commit/{commit_id}", routing::get(get_commit))
        .route("/tags", routing::get(list_tags).post(create_tag))
        .route("/branches", routing::get(list_branches).post(create_branch))
}

#[derive(utoipa::OpenApi)]
#[openapi(paths(get_commit, list_commits,  list_tags, create_tag, list_branches, create_branch), tags((name = "Git Repository", description="Git Repository related endpoints")) )]
pub(super) struct ApiDoc;

#[utoipa::path(
    get,
    path = "/commit/{rev}",
    params(
        ("rev",
        description = "The revision of the commit to retrieve.\n\n\
            This can be the short hash, full hash, a tag, or any other \
            reference such as HEAD or a branch name", example = "HEAD"),
    ),
    summary="Get commit",
    description = "Get a single commit by its revision.\n\n\
    The revision can be anything accepted by `git rev-parse`.",
    responses(
        (status = http::StatusCode::OK, description = "Commit exists", body = commit::Commit),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::NOT_FOUND, description = "Commit not found", body = api::ApiStatusDetailResponse),
    )
)]
async fn get_commit(
    State(state): State<web::AppState>,
    Path(commit_id): Path<String>,
) -> Result<Json<commit::Commit>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;
    Ok(Json(repo.get_commit_for_revision(&commit_id)?))
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ListCommitsResponse {
    /// Array of commits between the base and head commit IDs
    /// in reverse chronological order.
    commits: Vec<git2_ox::Commit>,
    /// Array of diffs in this commit range
    diffs: Vec<git2_ox::Diff>,
}

impl ListCommitsResponse {
    pub fn try_from_commits_and_diffs<I, D>(
        commits_iter: I,
        diffs_iter: D,
    ) -> Result<Self, api::AppError>
    where
        I: IntoIterator<Item = Result<git2_ox::Commit, git2_ox::Error>>,
        D: IntoIterator<Item = Result<git2_ox::Diff, git2_ox::Error>>,
    {
        let commits = commits_iter
            .into_iter()
            .collect::<Result<Vec<_>, _>>()
            .map_err(api::AppError::from)?;

        let diffs = diffs_iter
            .into_iter()
            .collect::<Result<Vec<_>, _>>()
            .map_err(api::AppError::from)?;
        Ok(ListCommitsResponse { commits, diffs })
    }
}

#[derive(Serialize, ToSchema, Deserialize, IntoParams)]
#[serde(rename_all = "camelCase")]
struct CommitRangeQuery {
    /// The base revision of the range, this can be short hash, full hash, a tag,
    /// or any other reference such a branch name. If empty, the first commit is used.
    base_rev: Option<String>,
    /// The head revision of the range, this can be short hash, full hash, a tag,
    /// or any other reference such a branch name. If empty, the current HEAD is used.
    head_rev: Option<String>,
    /// string filter for the commits. Filters commits by their ID or summary.
    filter: Option<String>,
}

#[utoipa::path(
    get,
    path = "/commits",
    summary = "List commits",
    description = "List the commits in a range similar to `git log`, \
    the commits are always ordered from newest to oldest in the tree.",
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

    let filter = query.filter.unwrap_or("".to_owned());
    let commits = repo
        .iter_commits(query.base_rev.as_deref(), query.head_rev.as_deref())?
        .into_iter()
        .filter(|commit_result| match commit_result {
            Ok(commit) => filter_commit(&filter, commit),
            Err(_) => true,
        });

    let diffs_iter =
        repo.iter_diffs_between_revisions(query.base_rev.as_deref(), query.head_rev.as_deref())?;

    Ok(Json(ListCommitsResponse::try_from_commits_and_diffs(
        commits, diffs_iter,
    )?))
}

#[derive(ToSchema, Serialize, Deserialize, IntoParams)]
#[serde(rename_all = "camelCase")]
struct ListTagsQuery {
    /// String filter against which the tag name is matched.
    filter: Option<String>,
}

#[derive(ToSchema, Serialize)]
struct ListTagsResponse {
    tags: Vec<git2_ox::TaggedCommit>,
}
impl ListTagsResponse {
    fn try_from_tagged_commits<T>(iter: T) -> Result<Self, api::AppError>
    where
        T: IntoIterator<Item = Result<git2_ox::TaggedCommit, git2_ox::Error>>,
    {
        Ok(ListTagsResponse {
            tags: iter
                .into_iter()
                .collect::<Result<Vec<_>, _>>()
                .map_err(api::AppError::from)?,
        })
    }
}

#[utoipa::path(
    get,
    path = "/tags",
    summary = "List tags",
    description = "List the tags in the repository",
    params(ListTagsQuery),
    responses(
        (status = http::StatusCode::OK, description = "List of tags", body = ListTagsResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn list_tags(
    State(state): State<web::AppState>,
    Query(query): Query<ListTagsQuery>,
) -> Result<Json<ListTagsResponse>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;

    Ok(Json(ListTagsResponse::try_from_tagged_commits(
        repo.iter_tags(query.filter.as_deref())?,
    )?))
}

#[derive(ToSchema, Serialize, Deserialize, IntoParams)]
#[serde(rename_all = "camelCase")]
struct CreateTagQuery {
    /// Name of the tag to create
    name: String,
    /// Revision to tag, this can be a short hash, full hash or a tag
    revision: String,
}

#[utoipa::path(
    post,
    path = "/tags",
    summary = "Create new tag",
    description = "Creates a new lightweight git tag with the specified name on the provided revision.",
    params(CreateTagQuery),
    responses(
        (status = http::StatusCode::CREATED, description = "Tag created successfully", body = git2_ox::TaggedCommit),
        (status = http::StatusCode::BAD_REQUEST, description = "Bad request", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn create_tag(
    State(state): State<web::AppState>,
    Query(query): Query<CreateTagQuery>,
) -> Result<Json<git2_ox::TaggedCommit>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;
    let force = false;
    Ok(Json(repo.create_lightweight_tag(
        &query.name,
        query.revision.as_str(),
        force,
    )?))
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ListBranchesResponse {
    /// Found branches
    branches: Vec<git2_ox::Branch>,
}

impl<I> From<I> for ListBranchesResponse
where
    I: IntoIterator<Item = git2_ox::Branch>,
{
    fn from(iter: I) -> Self {
        ListBranchesResponse {
            branches: iter.into_iter().collect(),
        }
    }
}

#[derive(ToSchema, Serialize, Deserialize, IntoParams)]
#[serde(rename_all = "camelCase")]
struct ListBranchesQuery {
    /// string filter against with the branch name is matched
    filter: Option<String>,
}

/// List branches in the repository
#[utoipa::path(
    get,
    path = "/branches",
    summary = "List branches",
    description = "List all local branches in the repository, optionally filtered by a glob pattern.",
    params(ListBranchesQuery),
    responses(
        (status = http::StatusCode::OK, description = "List of branches", body = ListBranchesResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn list_branches(
    State(state): State<web::AppState>,
    Query(query): Query<ListBranchesQuery>,
) -> Result<Json<ListBranchesResponse>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;

    Ok(Json(ListBranchesResponse::from(
        repo.iter_branches(query.filter.as_deref())?,
    )))
}

#[derive(ToSchema, Serialize, Deserialize, IntoParams)]
#[serde(rename_all = "camelCase")]
struct CreateBranchQuery {
    /// Name of the branch to create
    name: String,
    /// Revision to create the branch on, this can be a short hash, full hash or a tag
    revision: String,
}

#[utoipa::path(
    post,
    path = "/branches",
    summary = "Create new branch",
    description = "Creates a new branch at the specified revision.",
    params(CreateBranchQuery),
    responses(
        (status = http::StatusCode::CREATED, description = "Branch created successfully", body = git2_ox::Branch),
        (status = http::StatusCode::BAD_REQUEST, description = "Bad request", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn create_branch(
    State(state): State<web::AppState>,
    Query(query): Query<CreateBranchQuery>,
) -> Result<Json<git2_ox::Branch>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;
    let force = false;
    Ok(Json(repo.create_branch(
        &query.name,
        &query.revision,
        force,
    )?))
}

fn filter_commit(filter: &str, commit: &git2_ox::Commit) -> bool {
    let id_matches = commit
        .id()
        .to_string()
        .to_lowercase()
        .contains(&filter.to_lowercase());
    let summary_matches = commit
        .summary()
        .to_lowercase()
        .contains(&filter.to_lowercase());
    id_matches || summary_matches
}
