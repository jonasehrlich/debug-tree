use crate::{CommitWithReferences, Repository, Result, error::Error};

type Files = Vec<String>;

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
#[derive(Default, Debug)]
pub struct TreeStatus {
    /// Added files
    new_files: Files,
    /// Modified files
    modified_files: Files,
    /// Deleted files
    deleted_files: Files,
    /// Renamed files
    renamed_files: Files,
}

impl TreeStatus {
    /// Files that were added
    pub fn new_files(&self) -> &Files {
        &self.new_files
    }

    /// Files that were modified
    pub fn modified_files(&self) -> &Files {
        &self.modified_files
    }

    /// Files that were deleted
    pub fn deleted_files(&self) -> &Files {
        &self.deleted_files
    }

    /// Files that were renamed
    pub fn renamed_files(&self) -> &Files {
        &self.renamed_files
    }
}

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
#[derive(Debug)]
pub struct Status {
    /// Name of the current branch, not set if `is_detached_head` is true
    current_branch: Option<String>,
    /// The commit current HEAD points to
    head: CommitWithReferences,
    /// Whether the head is detached
    is_detached_head: bool,
    /// Whether the worktree or index have changes
    is_dirty: bool,
    /// Status of the index
    index: TreeStatus,
    /// Status in the worktree
    worktree: TreeStatus,
    /// Paths with conflicts
    conflicts: Files,
}

impl Status {
    pub fn head(&self) -> &CommitWithReferences {
        &self.head
    }

    pub fn is_detached_head(&self) -> bool {
        self.is_detached_head
    }

    pub fn is_dirty(&self) -> bool {
        self.is_dirty
    }

    pub fn index(&self) -> &TreeStatus {
        &self.index
    }

    pub fn worktree(&self) -> &TreeStatus {
        &self.worktree
    }

    pub fn conflicted(&self) -> &Files {
        &self.conflicts
    }
}

impl TryFrom<&Repository> for Status {
    type Error = Error;

    fn try_from(repo: &Repository) -> Result<Self> {
        let head = repo.get_commit_for_revision("HEAD")?;

        let mut opts = git2::StatusOptions::new();
        opts.include_untracked(true)
            .recurse_untracked_dirs(true)
            .include_ignored(false)
            .renames_head_to_index(true)
            .renames_index_to_workdir(true);

        let statuses = repo
            .repo()
            .statuses(Some(&mut opts))
            .map_err(|e| Error::from_ctx_and_error("Failed to create statuses", e))?;

        let mut index_status = TreeStatus::default();
        let mut worktree_status = TreeStatus::default();
        let mut conflicts = Vec::new();

        for entry in statuses.iter() {
            let status = entry.status();
            if status.is_index_new() {
                index_status
                    .new_files
                    .push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            } else if status.is_index_renamed() {
                index_status
                    .renamed_files
                    .push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            } else if status.is_index_modified() {
                index_status
                    .modified_files
                    .push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            } else if status.is_index_deleted() {
                index_status
                    .deleted_files
                    .push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            } else if status.is_wt_new() {
                worktree_status
                    .new_files
                    .push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            } else if status.is_wt_renamed() {
                worktree_status
                    .renamed_files
                    .push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            } else if status.is_wt_modified() {
                worktree_status
                    .modified_files
                    .push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            } else if status.is_wt_deleted() {
                worktree_status
                    .deleted_files
                    .push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            } else if status.is_conflicted() {
                conflicts.push(entry.path().unwrap_or("<invalid utf-8>").to_string());
            }
        }

        Ok(Self {
            current_branch: repo.current_branch_name(),
            head,
            is_detached_head: repo.repo().head_detached().map_err(|e| {
                Error::from_ctx_and_error("Failed to determined if head is detached", e)
            })?,
            is_dirty: !statuses.is_empty(),
            index: index_status,
            worktree: worktree_status,
            conflicts,
        })
    }
}

impl TryFrom<Repository> for Status {
    type Error = Error;
    fn try_from(repo: Repository) -> Result<Self> {
        Status::try_from(&repo)
    }
}
