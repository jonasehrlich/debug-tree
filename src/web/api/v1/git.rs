use crate::{web, web::api};

use axum::extract::{Path, Query, State};
use axum::{Json, routing};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

pub fn router() -> routing::Router<web::AppState> {
    routing::Router::new()
        .route("/commits", routing::get(list_commits))
        .route("/commit/{commit_id}", routing::get(get_commit))
        .route("/tags", routing::get(list_tags).post(create_tag))
        .route("/branches", routing::get(list_branches).post(create_branch))
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

impl<'repo> From<&git2::Commit<'repo>> for Commit {
    fn from(commit: &git2::Commit<'repo>) -> Self {
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

impl<'repo> From<git2::Commit<'repo>> for Commit {
    fn from(commit: git2::Commit<'repo>) -> Self {
        Commit::from(&commit)
    }
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

    Ok(Json(get_commit_for_revision(repo, &commit_id)?.into()))
}

#[derive(Serialize, ToSchema, PartialEq)]
#[serde(rename_all = "lowercase")]
enum DiffType {
    Binary,
    Text,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct DiffFile {
    /// Path to the diff file
    path: Option<String>,
    /// Content of the diff file
    content: Option<String>,
}

impl DiffFile {
    pub fn try_from_repo_and_diff_file(
        repo: &git2::Repository,
        diff_file: &git2::DiffFile,
    ) -> Option<DiffFile> {
        let oid = diff_file.id();
        if oid.is_zero() {
            return None;
        }

        let content = match repo.find_blob(oid) {
            Ok(blob) if diff_file.is_not_binary() => {
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
            content,
        })
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct Diff {
    /// Old file path and content
    old: Option<DiffFile>,
    /// New file path and content
    new: Option<DiffFile>,
    /// Type of the diff
    diff_type: DiffType,
    /// Patch between old and new
    patch: String,
}

impl Diff {
    pub fn from_repo_and_patch(repo: &git2::Repository, patch: &mut git2::Patch) -> Diff {
        let (old, new, diff_type) = {
            let delta = patch.delta();
            let diff_type = if delta.flags().is_binary() {
                DiffType::Binary
            } else {
                DiffType::Text
            };
            (
                DiffFile::try_from_repo_and_diff_file(repo, &delta.old_file()),
                DiffFile::try_from_repo_and_diff_file(repo, &delta.new_file()),
                diff_type,
            )
        };

        let patch_buf = patch.to_buf().expect("failed unwrapping patch buffer");
        let patch_text = patch_buf.as_str().unwrap_or("").to_owned();
        Self {
            old,
            new,
            diff_type,
            patch: patch_text,
        }
    }

    pub fn binary_from_repo_and_delta(repo: &git2::Repository, delta: &git2::DiffDelta) -> Diff {
        let old = DiffFile::try_from_repo_and_diff_file(repo, &delta.old_file());
        let new = DiffFile::try_from_repo_and_diff_file(repo, &delta.new_file());
        Self {
            old,
            new,
            diff_type: DiffType::Binary,
            patch: "".to_string(),
        }
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ListCommitsResponse {
    /// Array of commits between the base and head commit IDs
    /// in reverse chronological order.
    commits: Vec<Commit>,
    /// Array of diffs in this commit range
    diffs: Vec<Diff>,
}

impl ListCommitsResponse {
    pub fn try_from_commits_and_diffs<I, D>(
        commits_iter: I,
        diffs_iter: D,
    ) -> Result<Self, api::AppError>
    where
        I: IntoIterator<Item = Result<Commit, api::AppError>>,
        D: IntoIterator<Item = Result<Diff, api::AppError>>,
    {
        let commits = commits_iter
            .into_iter()
            .collect::<Result<Vec<_>, api::AppError>>()?;

        let diffs = diffs_iter
            .into_iter()
            .collect::<Result<Vec<_>, api::AppError>>()?;
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

    let revwalk = query.revwalk(repo)?;

    let filter = query.filter.unwrap_or("".to_owned());
    let commits = revwalk
        .map(|oid_result| {
            oid_result
                .map_err(|e| {
                    api::AppError::InternalServerError(format!("Error creating commit tree': {e}",))
                })
                .and_then(|oid| get_commit_for_oid(repo, oid))
        })
        .filter_map(|commit_result| match commit_result {
            Ok(commit) => filter_commit(&filter, &commit).map(|c| Ok(c.into())),
            Err(e) => Some(Err(e)),
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

    let diffs_iter =
        (0..diff.deltas().len()).filter_map(|delta_idx| {
            match git2::Patch::from_diff(&diff, delta_idx) {
                Err(e) => Some(Err(api::AppError::InternalServerError(format!(
                    "Failed to create patch: {e}"
                )))),
                Ok(Some(mut patch)) => Some(Ok(Diff::from_repo_and_patch(repo, &mut patch))),
                Ok(None) => {
                    if let Some(delta) = diff.get_delta(delta_idx) {
                        Some(Ok(Diff::binary_from_repo_and_delta(repo, &delta)))
                    } else {
                        log::error!("Failed to get delta for idx {delta_idx}");
                        None
                    }
                }
            }
        });

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
    commit: Commit,
}

impl TaggedCommit {
    pub fn try_from_repo_and_tag_name(
        repo: &git2::Repository,
        tag_name: &str,
    ) -> Result<Self, api::AppError> {
        Ok(Self {
            tag: tag_name.to_string(),
            commit: get_commit_for_revision(repo, tag_name)?.into(),
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
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;

    let tag_names = repo
        .tag_names(query.filter.as_deref().map(to_safe_glob).as_deref())
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
    /// name of the tag to create
    name: String,
    /// revision to tag, this can be a short hash, full hash, a tag,
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
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;

    let oid = git2::Oid::from_str(query.revision.as_str())
        .map_err(|e| api::AppError::BadRequest(format!("Invalid revision: {e}")))?;

    let rev_obj = repo
        .find_object(oid, None)
        .map_err(|e| api::AppError::BadRequest(format!("Failed to find revision: {e}")))?;
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
    head: Commit,
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
        (status = http::StatusCode::OK, description = "List of branches", body = Vec<Branch>),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn list_branches(
    State(state): State<web::AppState>,
    Query(query): Query<ListBranchesQuery>,
) -> Result<Json<Vec<Branch>>, api::AppError> {
    let guard = state.repo().lock().await;
    let repo = guard
        .as_ref()
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;

    let filter = &query.filter.unwrap_or("".to_string());
    let local_branches = repo
        .branches(Some(git2::BranchType::Local))
        .map_err(|e| api::AppError::InternalServerError(format!("Failed to list branches: {e}")))?;
    let branches = local_branches
        .filter_map(Result::ok)
        .filter_map(|(b, _)| {
            let name = b.name().ok()??;
            if !name.contains(filter) {
                return None; // Skip branches that do not match the filter
            }

            let rev = b.get();
            let commit = rev.peel_to_commit().ok()?;
            let branch = Branch {
                name: name.to_string(),
                head: Commit::from(commit),
            };
            Some(branch)
        })
        .collect();

    Ok(Json(branches))
}

#[derive(ToSchema, Serialize, Deserialize, IntoParams)]
#[serde(rename_all = "camelCase")]
struct CreateBranchQuery {
    name: String,
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
        .ok_or_else(|| api::AppError::InternalServerError("Repository not found".to_string()))?;

    let commit = get_commit_for_revision(repo, &query.revision)?;
    let force = false;
    repo.branch(&query.name, &commit, force)
        .map_err(|e| api::AppError::InternalServerError(format!("Failed to create branch: {e}")))?;

    Ok(Json(Branch {
        name: query.name,
        head: Commit::from(commit),
    }))
}

fn get_commit_for_revision<'repo>(
    repo: &'repo git2::Repository,
    rev: &str,
) -> Result<git2::Commit<'repo>, api::AppError> {
    let oid = get_object_for_revision(repo, rev)?.id();
    get_commit_for_oid(repo, oid)
}

fn get_commit_for_oid<'repo>(
    repo: &'repo git2::Repository,
    oid: git2::Oid,
) -> Result<git2::Commit<'repo>, api::AppError> {
    repo.find_commit(oid).map_err(|e| match e.code() {
        git2::ErrorCode::Invalid => {
            api::AppError::BadRequest(format!("Invalid commit ID '{oid}': {e}"))
        }
        git2::ErrorCode::NotFound => {
            api::AppError::NotFound(format!("Commit '{oid}' not found: {e}"))
        }
        _ => api::AppError::InternalServerError(format!("Failed to find commit '{oid}': {e}")),
    })
}

fn filter_commit<'repo, 'commit>(
    filter: &str,
    commit: &'commit git2::Commit<'repo>,
) -> Option<&'commit git2::Commit<'repo>> {
    let id_matches = commit
        .id()
        .to_string()
        .to_lowercase()
        .contains(&filter.to_lowercase());
    let summary_matches = commit
        .summary()
        .is_some_and(|s| s.to_lowercase().contains(&filter.to_lowercase()));
    if id_matches || summary_matches {
        Some(commit)
    } else {
        None
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
    get_commit_for_revision(repo, rev)?.tree().map_err(|_| {
        api::AppError::InternalServerError(format!("Rev {rev} is not a tree").to_string())
    })
}

fn to_safe_glob(prefix: &str) -> String {
    let escaped = prefix
        .replace('*', "\\*")
        .replace('[', "\\[")
        .replace('?', "\\?");
    format!("*{escaped}*")
}
