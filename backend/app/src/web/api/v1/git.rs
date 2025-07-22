use crate::{web, web::api};

use axum::extract::{Path, Query, State};
use axum::{Json, routing};
use git2_shim::commit;
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
    commits: Vec<git2_shim::Commit>,
    /// Array of diffs in this commit range
    diffs: Vec<git2_shim::Diff>,
}

impl ListCommitsResponse {
    pub fn try_from_commits_and_diffs<I, D>(
        commits_iter: I,
        diffs_iter: D,
    ) -> Result<Self, api::AppError>
    where
        I: IntoIterator<Item = Result<git2_shim::Commit, git2_shim::Error>>,
        D: IntoIterator<Item = Result<git2_shim::Diff, git2_shim::Error>>,
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

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct TaggedCommit {
    /// Tag on the commit
    tag: String,
    /// Commit the tag is on
    commit: git2_shim::Commit,
}

impl TaggedCommit {
    pub fn try_from_repo_and_tag_name(
        repo: &git2::Repository,
        tag_name: &str,
    ) -> Result<Self, api::AppError> {
        Ok(Self {
            tag: tag_name.to_string(),
            commit: git2_shim::utils::get_commit_for_revision(repo, tag_name)?.into(),
        })
    }
}

#[derive(ToSchema, Serialize)]
struct ListTagsResponse {
    tags: Vec<TaggedCommit>,
}
impl ListTagsResponse {
    fn try_from_tagged_commits<T>(iter: T) -> Result<Self, api::AppError>
    where
        T: IntoIterator<Item = Result<TaggedCommit, api::AppError>>,
    {
        Ok(ListTagsResponse {
            tags: iter
                .into_iter()
                .collect::<Result<Vec<_>, api::AppError>>()?,
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
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?
        .repo();

    let tag_names = repo
        .tag_names(
            query
                .filter
                .as_deref()
                .map(git2_shim::utils::to_safe_glob)
                .as_deref(),
        )
        .map_err(|e| api::AppError::InternalServerError(format!("Could not get tags: {e}")))?;

    let tagged_commits = tag_names
        .iter()
        .flatten()
        .map(|name| TaggedCommit::try_from_repo_and_tag_name(repo, name));
    Ok(Json(ListTagsResponse::try_from_tagged_commits(
        tagged_commits,
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
        (status = http::StatusCode::CREATED, description = "Tag created successfully", body = TaggedCommit),
        (status = http::StatusCode::BAD_REQUEST, description = "Bad request", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn create_tag(
    State(state): State<web::AppState>,
    Query(query): Query<CreateTagQuery>,
) -> Result<Json<TaggedCommit>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?
        .repo();

    let rev_obj = git2_shim::utils::get_object_for_revision(repo, query.revision.as_str())?;
    let force = false;
    repo.tag_lightweight(&query.name, &rev_obj, force)
        .map_err(|e| api::AppError::InternalServerError(format!("Failed to create tag: {e}")))?;

    Ok(Json(TaggedCommit::try_from_repo_and_tag_name(
        repo,
        &query.name,
    )?))
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct Branch {
    /// Name of the branch
    name: String,
    /// Commit ID of the branch head
    head: git2_shim::Commit,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ListBranchesResponse {
    /// Found branches
    branches: Vec<Branch>,
}

impl<I> From<I> for ListBranchesResponse
where
    I: IntoIterator<Item = Branch>,
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
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?
        .repo();

    let filter = &query.filter.unwrap_or("".to_string());
    let local_branches = repo
        .branches(Some(git2::BranchType::Local))
        .map_err(|e| api::AppError::InternalServerError(format!("Failed to list branches: {e}")))?;
    let branches = local_branches.filter_map(Result::ok).filter_map(|(b, _)| {
        let name = b.name().ok()??;
        if !name.contains(filter) {
            return None; // Skip branches that do not match the filter
        }

        let rev = b.get();
        let commit = rev.peel_to_commit().ok()?;
        let branch = Branch {
            name: name.to_string(),
            head: git2_shim::Commit::from(commit),
        };
        Some(branch)
    });

    Ok(Json(ListBranchesResponse::from(branches)))
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
        (status = http::StatusCode::CREATED, description = "Branch created successfully", body = Branch),
        (status = http::StatusCode::BAD_REQUEST, description = "Bad request", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn create_branch(
    State(state): State<web::AppState>,
    Query(query): Query<CreateBranchQuery>,
) -> Result<Json<Branch>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?
        .repo();

    let commit = git2_shim::utils::get_commit_for_revision(repo, &query.revision)?;
    let force = false;
    repo.branch(&query.name, &commit, force)
        .map_err(|e| api::AppError::InternalServerError(format!("Failed to create branch: {e}")))?;

    Ok(Json(Branch {
        name: query.name,
        head: git2_shim::Commit::from(commit),
    }))
}

fn filter_commit(filter: &str, commit: &git2_shim::Commit) -> bool {
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
