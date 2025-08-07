use crate::{Commit, ReferenceKind, ResolvedReference, Result, error::Error};

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
pub struct TaggedCommit {
    /// Tag on the commit
    tag: String,
    /// Commit the tag is on
    commit: Commit,
}

impl TaggedCommit {
    pub fn new(tag: &str, commit: &Commit) -> Self {
        Self {
            tag: tag.to_string(),
            commit: commit.clone(),
        }
    }

    pub fn try_from_repo_and_tag_name(repo: &git2::Repository, tag_name: &str) -> Result<Self> {
        Ok(Self {
            tag: tag_name.to_string(),
            commit: Commit::try_for_revision(repo, tag_name)?,
        })
    }
}

impl TryFrom<ResolvedReference> for TaggedCommit {
    type Error = Error;
    fn try_from(value: ResolvedReference) -> Result<Self> {
        let kind = value.kind();
        if kind == ReferenceKind::Tag {
            Ok(TaggedCommit {
                tag: value.name().to_string(),
                commit: value.target().clone(),
            })
        } else {
            Err(Error::from_ctx("Reference is not a tag"))
        }
    }
}
