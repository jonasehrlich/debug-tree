use crate::{Commit, Result, error::Error};

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "lowercase")
)]
#[derive(Clone, Debug)]
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
    name: String,
    kind: ReferenceKind,
    commit: Commit,
}

impl<'repo> TryFrom<&git2::Reference<'repo>> for ResolvedReference {
    type Error = Error;
    fn try_from(reference: &git2::Reference) -> Result<Self> {
        let r: ReferenceMetadata = reference.try_into()?;
        Ok(Self {
            name: r.name,
            kind: r.kind,
            commit: reference
                .peel_to_commit()
                .map_err(|e| Error::from_ctx_and_error("Failed peeling reference to commit", e))?
                .into(),
        })
    }
}
