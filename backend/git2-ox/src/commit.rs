use crate::{ReferenceMap, ReferenceMetadata, Result, utils};

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
#[derive(Clone, Debug)]
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
#[derive(Clone, Debug)]
#[allow(dead_code)]
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
    pub fn try_for_revision(repo: &'repo git2::Repository, rev: &str) -> Result<Self> {
        Ok(utils::get_commit_for_revision(repo, rev)?.into())
    }

    /// Try to create a `Commit` from an `git2::Oid` object
    /// * `repo` - Reference to the repository
    /// * `oid` - `Oid` to get the commit for
    pub fn try_for_oid(repo: &'repo git2::Repository, oid: git2::Oid) -> Result<Self> {
        Ok(utils::get_commit_for_oid(repo, oid)?.into())
    }
}

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
#[derive(Clone, Debug)]
#[allow(dead_code)]
pub struct CommitWithReferences {
    #[serde(flatten)]
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
    pub fn try_from_git2_commit_and_ref_map(
        commit: &git2::Commit,
        ref_map: &ReferenceMap,
    ) -> Result<CommitWithReferences> {
        let refs = ref_map
            .get(&commit.id())
            .map(|refs| refs.iter().map(ReferenceMetadata::try_from).collect())
            .unwrap_or_else(|| Ok(vec![]))?;

        Ok(Self {
            commit: commit.into(),
            references: refs,
        })
    }
}

impl<'repo> CommitWithReferences {
    pub fn try_from_oid_and_ref_map(
        repo: &'repo git2::Repository,
        oid: git2::Oid,
        ref_map: &ReferenceMap,
    ) -> Result<Self> {
        CommitWithReferences::try_from_git2_commit_and_ref_map(
            &utils::get_commit_for_oid(repo, oid)?,
            ref_map,
        )
    }

    pub fn try_from_revision_and_ref_map(
        repo: &'repo git2::Repository,
        rev: &str,
        ref_map: &ReferenceMap,
    ) -> Result<Self> {
        let commit = utils::get_commit_for_revision(repo, rev)?;
        let refs = ref_map
            .get(&commit.id())
            .map(|refs| refs.iter().map(ReferenceMetadata::try_from).collect())
            .unwrap_or_else(|| Ok(vec![]))?;

        Ok(Self {
            commit: commit.into(),
            references: refs,
        })
    }
}
