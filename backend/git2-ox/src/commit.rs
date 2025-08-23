use crate::{ReferenceMetadata, Result, reference::ReferenceMetadatas, utils};

pub trait CommitProperties {
    fn id(&self) -> &str;
    fn summary(&self) -> &str;
}

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
#[derive(Clone, Debug, PartialEq)]
#[allow(dead_code)]
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

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
#[derive(Clone, Debug, PartialEq)]
pub struct Commit {
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

impl CommitProperties for Commit {
    fn id(&self) -> &str {
        &self.id
    }

    fn summary(&self) -> &str {
        &self.summary
    }
}

impl<'repo> Commit {
    /// Try to create a `Commit` from an revision string
    /// * `repo` - Reference to the repository
    /// * `rev` - Revision to get the commit for
    pub fn try_from_revision(repo: &'repo git2::Repository, rev: &str) -> Result<Self> {
        Ok(utils::get_commit_for_revision(repo, rev)?.into())
    }

    /// Try to create a `Commit` from an `git2::Oid` object
    /// * `repo` - Reference to the repository
    /// * `oid` - `Oid` to get the commit for
    pub fn try_from_oid(repo: &'repo git2::Repository, oid: git2::Oid) -> Result<Self> {
        Ok(utils::get_commit_for_oid(repo, oid)?.into())
    }
}

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
#[derive(Clone, Debug, PartialEq)]
#[allow(dead_code)]
pub struct CommitWithReferences {
    #[cfg_attr(feature = "serde", serde(flatten))]
    commit: Commit,
    /// References pointing to the commit
    references: Vec<ReferenceMetadata>,
}

impl CommitProperties for CommitWithReferences {
    fn id(&self) -> &str {
        self.commit.id()
    }

    fn summary(&self) -> &str {
        self.commit.summary()
    }
}

impl CommitWithReferences {
    pub fn try_from_git2_commit_and_references(
        commit: &git2::Commit,
        references: Option<&ReferenceMetadatas>,
    ) -> Result<CommitWithReferences> {
        Ok(Self {
            commit: commit.into(),
            references: references.cloned().unwrap_or_default(),
        })
    }
}

impl<'repo> CommitWithReferences {
    pub fn try_from_oid_and_references(
        repo: &'repo git2::Repository,
        oid: git2::Oid,
        references: Option<&ReferenceMetadatas>,
    ) -> Result<Self> {
        CommitWithReferences::try_from_git2_commit_and_references(
            &utils::get_commit_for_oid(repo, oid)?,
            references,
        )
    }

    pub fn from_commit_and_references(
        commit: &Commit,
        references: Option<&ReferenceMetadatas>,
    ) -> Result<Self> {
        Ok(Self {
            commit: commit.clone(),
            references: references.cloned().unwrap_or_default(),
        })
    }
}
