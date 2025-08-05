use crate::Result;
use crate::error::Error;
use std::collections::hash_map;

pub fn get_commit_for_oid<'repo>(
    repo: &'repo git2::Repository,
    oid: git2::Oid,
) -> Result<git2::Commit<'repo>> {
    repo.find_commit(oid)
        .map_err(|e| Error::from_ctx_and_error(format!("Commit '{oid}'"), e))
}

pub fn get_object_for_revision<'repo>(
    repo: &'repo git2::Repository,
    rev: &str,
) -> Result<git2::Object<'repo>> {
    repo.revparse_single(rev)
        .map_err(|e| Error::from_ctx_and_error(format!("Revision '{rev}'"), e))
}

pub fn get_tree_for_revision<'repo>(
    repo: &'repo git2::Repository,
    rev: &str,
) -> Result<git2::Tree<'repo>> {
    get_commit_for_revision(repo, rev)?
        .tree()
        .map_err(|e| Error::from_ctx_and_error(format!("Tree for revision'{rev}'"), e))
}

pub fn to_safe_glob(prefix: &str) -> String {
    let escaped = prefix
        .replace('*', "\\*")
        .replace('[', "\\[")
        .replace('?', "\\?");
    format!("*{escaped}*")
}

pub fn get_commit_for_revision<'repo>(
    repo: &'repo git2::Repository,
    rev: &str,
) -> Result<git2::Commit<'repo>> {
    let oid = get_object_for_revision(repo, rev)?.id();

    get_commit_for_oid(repo, oid)
}

pub fn revwalk_for_range<'repo>(
    repo: &'repo git2::Repository,
    base_rev: Option<&str>,
    head_rev: Option<&str>,
) -> Result<git2::Revwalk<'repo>> {
    let mut revwalk = repo
        .revwalk()
        .map_err(|e| Error::from_ctx_and_error("Failed to create revwalk object", e))?;

    match head_rev {
        Some(head) => {
            let oid = get_object_for_revision(repo, head)?.id();
            revwalk.push(oid).map_err(|e| {
                Error::from_ctx_and_error(
                    format!("Failed to push head revision '{head}' to revwalk"),
                    e,
                )
            })?;
        }
        _ => {
            revwalk
                .push_head()
                .map_err(|e| Error::from_ctx_and_error("Failed to push head to revwalk", e))?;
        }
    }

    if let Some(base) = base_rev {
        let oid = get_object_for_revision(repo, base)?.id();
        revwalk.hide(oid).map_err(|e| {
            Error::from_ctx_and_error(format!("Failed to hide base revision '{base}'"), e)
        })?;
    }

    Ok(revwalk)
}

/// Get a map mapping OIDs to a vector of references pointing to it
///
/// * `repo` - Repository to get the references from
pub fn get_references_map(
    repo: &git2::Repository,
) -> Result<hash_map::HashMap<git2::Oid, Vec<git2::Reference>>> {
    let mut ref_map: hash_map::HashMap<git2::Oid, Vec<git2::Reference>> = hash_map::HashMap::new();

    for reference in repo
        .references()
        .map_err(|e| Error::from_ctx_and_error("Failed to get references", e))?
    {
        let reference =
            reference.map_err(|e| Error::from_ctx_and_error("Failed to get reference", e))?;
        ref_map
            .entry(
                reference
                    .peel_to_commit()
                    .map_err(|e| {
                        Error::from_ctx_and_error("Failed to peel reference to commit", e)
                    })?
                    .id(),
            )
            .or_default()
            .push(reference);
    }

    Ok(ref_map)
}
