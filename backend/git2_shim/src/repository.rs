use crate::{Commit, Diff, Error, Result, utils};
use std::path::Path;

pub struct Repository {
    repo: git2::Repository,
}

impl Repository {
    pub fn open(path: &Path) -> Result<Self> {
        let repo = git2::Repository::open(path)
            .map_err(|e| Error::from_ctx_and_error("Failed to open repository", e))?;
        Ok(Repository { repo })
    }

    pub fn repo(&self) -> &git2::Repository {
        &self.repo
    }

    /// Returns an iterator over Commits in the repository from `head_rev` to `base_rev`
    ///
    /// * `base_rev` - Base revision until which to iterate. Iterating to initial commit if set to `None`
    /// * `head_rev` - Head revision from which to iterate. Iterating from current `HEAD` if set to `None`
    pub fn iter_commits(
        &self,
        base_rev: Option<&str>,
        head_rev: Option<&str>,
    ) -> Result<impl IntoIterator<Item = Result<Commit>>> {
        let revwalk = utils::revwalk_for_range(&self.repo, base_rev, head_rev)?;
        Ok(revwalk.map(|oid_result| {
            oid_result
                .map_err(|e| Error::from_ctx_and_error("Failed to get oid object", e))
                .and_then(|oid| Commit::try_for_oid(&self.repo, oid))
        }))
    }

    /// Get a commit for a revision
    ///
    /// * `rev` - Revision to get the commit for
    pub fn get_commit_for_revision(&self, rev: &str) -> Result<Commit> {
        Commit::try_for_revision(&self.repo, rev)
    }

    /// Returns an iterator over diffs between two revisions `base_rev` and `head_rev`
    ///
    /// * `base_rev` - Base revision to use as a tree, uses initial commit if set to `None`
    /// * `head_rev` - Head revision until which to diff. Using current `HEAD` if set to `None`
    pub fn iter_diffs_between_revisions(
        &self,
        base_rev: Option<&str>,
        head_rev: Option<&str>,
    ) -> Result<impl Iterator<Item = Result<Diff>>> {
        let head = head_rev.unwrap_or("HEAD");
        let tree = utils::get_tree_for_revision(&self.repo, head)?;

        let base_tree = match base_rev.map(|rev| utils::get_tree_for_revision(&self.repo, rev)) {
            Some(Ok(tree)) => Some(tree),
            Some(Err(e)) => {
                return Err(e);
            }
            None => None,
        };

        let diff = self
            .repo
            .diff_tree_to_tree(base_tree.as_ref(), Some(&tree), None)
            .map_err(|e| {
                Error::from_ctx_and_error(format!("Failed to diff tree {base_rev:?} to {head}"), e)
            })?;

        let num_deltas = diff.deltas().len();

        Ok((0..num_deltas).filter_map(move |delta_idx| {
            // `diff` is owned by this function and must not be moved into the closure.
            // Using `move` only for delta_idx, not for diff.
            match git2::Patch::from_diff(&diff, delta_idx) {
                Err(e) => Some(Err(Error::from_ctx_and_error("Failed to create patch", e))),
                Ok(Some(mut patch)) => Some(Ok(Diff::from_repo_and_patch(&self.repo, &mut patch))),
                Ok(None) => {
                    if let Some(delta) = diff.get_delta(delta_idx) {
                        Some(Ok(Diff::binary_from_repo_and_delta(&self.repo, &delta)))
                    } else {
                        log::error!("Failed to get delta for idx {delta_idx}");
                        None
                    }
                }
            }
        }))
    }
}
