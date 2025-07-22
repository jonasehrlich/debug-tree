use std::path::Path;

use crate::{Commit, Error, Result, utils};

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
}
