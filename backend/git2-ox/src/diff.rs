use std::collections::hash_map;

use crate::{Result, error};

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
pub(crate) struct DiffStats {
    /// Number of files changed
    files_changed: usize,
    /// Number of insertions
    insertions: usize,
    /// Number of deletions
    deletions: usize,
}

impl From<git2::DiffStats> for DiffStats {
    fn from(stats: git2::DiffStats) -> Self {
        Self {
            files_changed: stats.files_changed(),
            insertions: stats.insertions(),
            deletions: stats.deletions(),
        }
    }
}

type Path = String;
type FileContent = String;

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
pub struct Diff {
    /// Patch between old and new
    patch: String,
    /// Stats of the diff
    stats: DiffStats,
    /// Map of old source paths to the old content
    old_sources: hash_map::HashMap<Path, FileContent>,
}

impl Diff {
    pub fn try_from_repo_and_diff(repo: &git2::Repository, diff: &git2::Diff) -> Result<Self> {
        let mut patch_output = String::new();

        let mut old_files: hash_map::HashMap<Path, FileContent> = hash_map::HashMap::new();
        // Collect old file contents from each delta
        diff.foreach(
            &mut |delta, _| {
                let oid = delta.old_file().id();
                if !oid.is_zero() {
                    let path = delta
                        .old_file()
                        .path()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|| "<unknown>".to_string());

                    if let Ok(blob) = repo.find_blob(oid) {
                        if let Ok(content) = std::str::from_utf8(blob.content()) {
                            old_files.insert(path, content.to_string());
                        } else {
                            old_files.insert(path, "<binary or invalid utf8>".to_string());
                        }
                    }
                }
                true
            },
            None,
            None,
            None,
        )
        .map_err(|e| error::Error::from_ctx_and_error("Error getting old file contents", e))?;

        diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
            match line.origin() {
                // For Addition, Deletion, and Context lines, the prefix needs to be prepended
                '+' | '-' | ' ' | '@' => {
                    patch_output.push(line.origin());
                }
                // For any other line type (e.g., file headers, hunk headers),
                // the content is already fully formatted and should not be prefixed.
                _ => {}
            }
            if let Ok(text) = str::from_utf8(line.content()) {
                patch_output.push_str(text);
            } else {
                patch_output.push_str("<invalid utf8>");
            }
            true
        })
        .map_err(|e| error::Error::from_ctx_and_error("Error creating patch", e))?;

        Ok(Self {
            patch: patch_output,
            stats: diff
                .stats()
                .map_err(|e| error::Error::from_ctx_and_error("Error getting diff stats", e))?
                .into(),
            old_sources: old_files,
        })
    }
}
