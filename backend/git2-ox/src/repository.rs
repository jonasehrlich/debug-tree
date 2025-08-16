use crate::commit::CommitWithReferences;
use crate::error::Error;
use crate::reference::ReferencesMap;
use crate::{Branch, Diff, ReferenceKind, ResolvedReference, Result, TaggedCommit, utils};
use std::path::Path;

pub struct Repository {
    repo: git2::Repository,
}

impl Repository {
    /// Attempt to open an already-existing repository at `path`.
    ///
    /// * `path` - Root path of the repository
    pub fn try_open(path: &Path) -> Result<Self> {
        let repo = git2::Repository::open(path)
            .map_err(|e| Error::from_ctx_and_error("Failed to open repository", e))?;
        Ok(Repository { repo })
    }

    /// Attempt to initialize a repository at `path`
    ///
    /// * `path`- Path to create the repository in
    pub fn try_init(path: &Path) -> Result<Self> {
        let repo = git2::Repository::init(path)
            .map_err(|e| Error::from_ctx_and_error("Failed to initialize repository", e))?;
        Ok(Repository { repo })
    }

    pub fn repo(&self) -> &git2::Repository {
        &self.repo
    }

    /// Get the name of the current branch, None in case of a detached HEAD
    pub fn current_branch_name(&self) -> Option<String> {
        let head = self.repo().head().ok()?;
        if head.is_branch() {
            head.shorthand().map(|s| s.to_string())
        } else {
            None
        }
    }

    /// Returns an iterator over Commits in the repository from `head_rev` to `base_rev`
    ///
    /// * `base_rev` - Base revision until which to iterate. Iterating to initial commit if set to `None`
    /// * `head_rev` - Head revision from which to iterate. Iterating from current `HEAD` if set to `None`
    pub fn iter_commits(
        &self,
        base_rev: Option<&str>,
        head_rev: Option<&str>,
    ) -> Result<impl Iterator<Item = Result<CommitWithReferences>>> {
        let revwalk = utils::revwalk_for_range(&self.repo, base_rev, head_rev)?;
        let ref_map = ReferencesMap::try_from(&self.repo)?;
        Ok(revwalk.map(move |oid_result| {
            oid_result
                .map_err(|e| Error::from_ctx_and_error("Failed to get oid object", e))
                .and_then(|oid| {
                    CommitWithReferences::try_from_oid_and_references(
                        &self.repo,
                        oid,
                        ref_map.get_references_for_commit(oid),
                    )
                })
        }))
    }

    /// Get a commit for a revision
    ///
    /// * `rev` - Revision to get the commit for. This can be the short hash, full hash, a tag, or any other
    ///   reference such as `HEAD`, a branch name or a tag name
    pub fn get_commit_for_revision(&self, rev: &str) -> Result<CommitWithReferences> {
        let ref_map = ReferencesMap::try_from(&self.repo)?;
        CommitWithReferences::try_from_revision_and_ref_map(&self.repo, rev, &ref_map)
    }

    /// Checkout a revision
    ///
    /// * `rev` - Revision to checkout. This can be the short hash, full hash, a tag, or any other
    ///   reference such as `HEAD`, a branch name or a tag name
    pub fn checkout_revision(&self, rev: &str) -> Result<CommitWithReferences> {
        let (object, reference) = self.repo.revparse_ext(rev).map_err(|e| {
            Error::from_ctx_and_error(format!("Failed to parse revision '{rev}'"), e)
        })?;

        self.repo.checkout_tree(&object, None).map_err(|e| {
            Error::from_ctx_and_error(format!("Failed to checkout revision '{rev}'"), e)
        })?;

        match reference {
            // gref is an actual reference like branches or tags
            Some(gref) => self.repo.set_head(gref.name().unwrap_or_default()),
            // this is a commit, not a reference
            None => self.repo.set_head_detached(object.id()),
        }
        .map_err(|e| {
            Error::from_ctx_and_error(format!("Failed to set head to revision '{rev}'"), e)
        })?;

        let ref_map = ReferencesMap::try_from(&self.repo)?;

        // self.repo
        //     .set_head(obj.Ok
        //     .map_err(|e| Error::from_ctx_and_error(format!("Failed to set head to {rev}"), e))?;

        CommitWithReferences::try_from_revision_and_ref_map(&self.repo, rev, &ref_map)
    }

    fn git2_diff_for_revisions(
        &self,
        base_rev: Option<&str>,
        head_rev: Option<&str>,
    ) -> Result<git2::Diff<'_>> {
        let head = head_rev.unwrap_or("HEAD");
        let tree = utils::get_tree_for_revision(&self.repo, head)?;

        let base_tree = match base_rev.map(|rev| utils::get_tree_for_revision(&self.repo, rev)) {
            Some(Ok(tree)) => Some(tree),
            Some(Err(e)) => {
                return Err(e);
            }
            None => None,
        };

        let mut diff = self
            .repo
            .diff_tree_to_tree(base_tree.as_ref(), Some(&tree), None)
            .map_err(|e| {
                Error::from_ctx_and_error(format!("Failed to diff tree {base_rev:?} to {head}"), e)
            })?;

        // Enable rename detection with DiffFindOptions
        let mut find_opts = git2::DiffFindOptions::new();
        find_opts.renames(true);
        // Transform a diff marking file renames, copies, etc.
        diff.find_similar(Some(&mut find_opts))
            .map_err(|e| Error::from_ctx_and_error("Failed to find similar files in diff", e))?;
        Ok(diff)
    }

    pub fn diff(&self, base_rev: Option<&str>, head_rev: Option<&str>) -> Result<Diff> {
        let diff = self.git2_diff_for_revisions(base_rev, head_rev)?;
        Diff::try_from_repo_and_diff(self.repo(), &diff)
    }

    /// Returns an iterator over tags in the repository which names contain `filter`
    ///
    /// * `filter` - Name to filter the tags for
    pub fn iter_tags(&self, filter: Option<&str>) -> Result<impl Iterator<Item = TaggedCommit>> {
        Ok(self
            .iter_references(
                filter,
                Some(ReferenceKindFilter::exclude(vec![ReferenceKind::Tag])),
            )?
            .filter_map(|r| r.try_into().ok()))
    }

    /// Create a lightweight tag with name `name` on `revision`
    ///
    /// * `name` - Name of the tag to create
    /// * `revision` - Revision to create the tag on
    /// * `force` - If force is true and a reference already exists with the given name, it will be replaced.
    pub fn create_lightweight_tag(
        &self,
        name: &str,
        revision: &str,
        force: bool,
    ) -> Result<TaggedCommit> {
        let rev_obj = utils::get_object_for_revision(&self.repo, revision)?;

        self.repo
            .tag_lightweight(name, &rev_obj, force)
            .map_err(|e| Error::from_ctx_and_error(format!("Failed to create tag '{name}"), e))?;

        TaggedCommit::try_from_repo_and_tag_name(&self.repo, name)
    }

    /// Create a branch with name `name` on `revision`
    ///
    /// * `name` - Name of the branch
    /// * `revision` - Revision to create the branch on
    /// * `force` - If `force` is true and a reference already exists with the given name, it will be replaced.
    pub fn create_branch(&self, name: &str, revision: &str, force: bool) -> Result<Branch> {
        let commit = utils::get_commit_for_revision(&self.repo, revision)?;
        self.repo.branch(name, &commit, force).map_err(|e| {
            Error::from_ctx_and_error(format!("Failed to create branch '{name}'"), e)
        })?;
        Ok(Branch::from_name_and_commit(name, &commit))
    }

    /// Return an iterator over local branches containing `filter`
    ///
    /// * `filter` - If `Some(filter)` only branches containing `filter` will be returned, if
    ///   `None` all branches will be returned
    pub fn iter_branches(&self, filter: Option<&str>) -> Result<impl Iterator<Item = Branch>> {
        Ok(self
            .iter_references(
                filter,
                Some(ReferenceKindFilter::include(vec![ReferenceKind::Branch])),
            )?
            .filter_map(|r| r.try_into().ok()))
    }

    /// Return an iterator over references
    ///
    /// * `filter` - If `Some(filter)` only references containing `filter` will be returned, if
    ///   `None` all references will be returned
    /// * `filter_kinds` - Filter for reference kinds to include or exclude
    pub fn iter_references(
        &self,
        filter: Option<&str>,
        filter_kinds: Option<ReferenceKindFilter>,
    ) -> Result<impl Iterator<Item = ResolvedReference>> {
        let filter = filter.unwrap_or("");

        let refs = self
            .repo
            .references()
            .map_err(|e| Error::from_ctx_and_error("Failed to get references", e))?;

        Ok(refs
            .filter_map(std::result::Result::ok)
            .filter_map(move |r| {
                let ref_kind = ReferenceKind::try_from(&r).ok()?;
                let ref_kind_ok = match &filter_kinds {
                    None => true,
                    Some(ReferenceKindFilter::Include {
                        include: include_kinds,
                    }) => include_kinds.contains(&ref_kind),
                    Some(ReferenceKindFilter::Exclude {
                        exclude: exclude_kinds,
                    }) => !exclude_kinds.contains(&ref_kind),
                };
                if !ref_kind_ok {
                    return None;
                }
                let name = r.shorthand()?;
                if !name.contains(filter) {
                    return None;
                }
                ResolvedReference::try_from(r).ok()
            }))
    }
}

/// Include or exclude `Reference`s
#[cfg_attr(
    feature = "serde",
    derive(serde::Deserialize),
    serde(rename_all = "camelCase", untagged)
)]
#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
pub enum ReferenceKindFilter {
    /// Values to include
    Include { include: Vec<ReferenceKind> },
    /// Values to exclude
    Exclude { exclude: Vec<ReferenceKind> },
}

impl ReferenceKindFilter {
    pub fn include(include: Vec<ReferenceKind>) -> Self {
        Self::Include { include }
    }
    pub fn exclude(exclude: Vec<ReferenceKind>) -> Self {
        Self::Exclude { exclude }
    }
}
