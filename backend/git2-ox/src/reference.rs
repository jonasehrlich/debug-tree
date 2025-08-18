use crate::{Commit, Result, error::Error};
use std::collections::hash_map;

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize, serde::Deserialize),
    serde(rename_all = "lowercase")
)]
#[derive(Copy, Clone, Debug, PartialEq)]
#[allow(dead_code)]
pub enum ReferenceKind {
    Tag,
    Branch,
    Note,
    RemoteBranch,
}

impl<'repo> TryFrom<&git2::Reference<'repo>> for ReferenceKind {
    type Error = Error;
    fn try_from(reference: &git2::Reference) -> Result<Self> {
        if reference.is_tag() {
            return Ok(ReferenceKind::Tag);
        }
        if reference.is_branch() {
            return Ok(ReferenceKind::Branch);
        }
        if reference.is_remote() {
            return Ok(ReferenceKind::RemoteBranch);
        }
        if reference.is_note() {
            Ok(ReferenceKind::Note)
        } else {
            Err(Error::from_ctx("Unknown reference type"))
        }
    }
}

impl<'repo> TryFrom<git2::Reference<'repo>> for ReferenceKind {
    type Error = Error;
    fn try_from(reference: git2::Reference) -> Result<Self> {
        ReferenceKind::try_from(&reference)
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
pub struct ReferenceMetadata {
    name: String,
    kind: ReferenceKind,
}
impl ReferenceMetadata {
    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn kind(&self) -> ReferenceKind {
        self.kind
    }
}

impl<'repo> TryFrom<&git2::Reference<'repo>> for ReferenceMetadata {
    type Error = Error;
    fn try_from(reference: &git2::Reference) -> Result<Self> {
        Ok(Self {
            name: reference
                .shorthand()
                .ok_or_else(|| Error::from_ctx("Invalid UTF-8 in reference name"))?
                .to_string(),
            kind: reference.try_into()?,
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
pub struct ResolvedReference {
    #[serde(flatten)]
    reference: ReferenceMetadata,
    target: Commit,
}
impl ResolvedReference {
    pub fn reference(&self) -> &ReferenceMetadata {
        &self.reference
    }

    pub fn kind(&self) -> ReferenceKind {
        self.reference.kind()
    }

    pub fn name(&self) -> &str {
        self.reference.name()
    }

    pub fn target(&self) -> &Commit {
        &self.target
    }
}

impl<'repo> TryFrom<&git2::Reference<'repo>> for ResolvedReference {
    type Error = Error;
    fn try_from(reference: &git2::Reference) -> Result<Self> {
        Ok(Self {
            reference: reference.try_into()?,
            target: reference
                .peel_to_commit()
                .map_err(|e| Error::from_ctx_and_error("Failed peeling reference to commit", e))?
                .into(),
        })
    }
}

impl<'repo> TryFrom<git2::Reference<'repo>> for ResolvedReference {
    type Error = Error;
    fn try_from(reference: git2::Reference) -> Result<Self> {
        ResolvedReference::try_from(&reference)
    }
}

pub type ReferenceMetadatas = Vec<ReferenceMetadata>;

#[derive(Default)]
pub struct ReferencesMap {
    map: hash_map::HashMap<git2::Oid, ReferenceMetadatas>,
}

impl ReferencesMap {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_references_for_commit_oid(
        &self,
        commit_id: git2::Oid,
    ) -> Option<&ReferenceMetadatas> {
        self.map.get(&commit_id)
    }

    pub fn get_references_for_commit_id(&self, commit_id: &str) -> Option<&ReferenceMetadatas> {
        self.map.get(&git2::Oid::from_str(commit_id).ok()?)
    }

    pub fn try_insert_reference(&mut self, reference: &git2::Reference) -> Result<()> {
        self.map
            .entry(
                reference
                    .peel_to_commit()
                    .map_err(|e| {
                        Error::from_ctx_and_error("Failed to peel reference to commit", e)
                    })?
                    .id(),
            )
            .or_default()
            .push(reference.try_into()?);
        Ok(())
    }
}

impl TryFrom<&git2::Repository> for ReferencesMap {
    type Error = Error;

    fn try_from(repo: &git2::Repository) -> Result<Self> {
        let mut ref_map = ReferencesMap::new();

        for reference in repo
            .references()
            .map_err(|e| Error::from_ctx_and_error("Failed to get references", e))?
        {
            let reference =
                reference.map_err(|e| Error::from_ctx_and_error("Failed to get reference", e))?;

            if let Err(e) = ref_map.try_insert_reference(&reference) {
                log::error!(
                    "Error adding reference to reference map {}: {}",
                    reference.name().unwrap_or("unknown reference"),
                    e
                )
            };
        }
        Ok(ref_map)
    }
}
