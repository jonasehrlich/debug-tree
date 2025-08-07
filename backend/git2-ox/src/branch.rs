use crate::{Commit, ReferenceKind, ResolvedReference, Result, error::Error};

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
pub struct Branch {
    /// Name of the branch
    name: String,
    /// Commit ID of the branch head
    head: Commit,
}

impl Branch {
    /// Get the name of the branch
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Get the head commit of the branch at the time when the Branch object was created
    pub fn head(&self) -> &Commit {
        &self.head
    }

    pub fn from_name_and_commit(name: &str, head: &git2::Commit) -> Self {
        Self {
            name: name.to_string(),
            head: head.into(),
        }
    }
}

impl TryFrom<ResolvedReference> for Branch {
    type Error = Error;
    fn try_from(value: ResolvedReference) -> Result<Self> {
        let kind = value.reference().kind();
        if kind == ReferenceKind::Branch {
            Ok(Self {
                name: value.name().to_string(),
                head: value.target().clone(),
            })
        } else {
            Err(Error::from_ctx("Reference is not a branch"))
        }
    }
}
