#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "lowercase")
)]
#[derive(PartialEq)]
enum DiffKind {
    Binary,
    Text,
}

#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
struct DiffFile {
    /// Path to the diff file
    path: Option<String>,
    /// Content of the diff file
    content: Option<String>,
}

impl DiffFile {
    pub fn try_from_repo_and_diff_file(
        repo: &git2::Repository,
        diff_file: &git2::DiffFile,
    ) -> Option<DiffFile> {
        let oid = diff_file.id();
        if oid.is_zero() {
            return None;
        }

        let content = match repo.find_blob(oid) {
            Ok(blob) if diff_file.is_not_binary() => {
                Some(String::from_utf8_lossy(blob.content()).into_owned())
            }
            _ => {
                log::warn!("Did not find blob for {:?}", diff_file.path());
                None
            }
        };

        Some(DiffFile {
            path: diff_file
                .path()
                .map(|p| p.to_str().unwrap_or("unknown").to_owned()),
            content,
        })
    }
}
#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[cfg_attr(
    feature = "serde",
    derive(serde::Serialize),
    serde(rename_all = "camelCase")
)]
pub struct Diff {
    /// Old file path and content
    old: Option<DiffFile>,
    /// New file path and content
    new: Option<DiffFile>,
    /// Kind of the diff
    kind: DiffKind,
    /// Patch between old and new
    patch: String,
}
impl Diff {
    pub fn from_repo_and_patch(repo: &git2::Repository, patch: &mut git2::Patch) -> Diff {
        let (old, new, diff_type) = {
            let delta = patch.delta();
            let diff_type = if delta.flags().is_binary() {
                DiffKind::Binary
            } else {
                DiffKind::Text
            };
            (
                DiffFile::try_from_repo_and_diff_file(repo, &delta.old_file()),
                DiffFile::try_from_repo_and_diff_file(repo, &delta.new_file()),
                diff_type,
            )
        };

        let patch_buf = patch.to_buf().expect("failed unwrapping patch buffer");
        let patch_text = patch_buf.as_str().unwrap_or("").to_owned();
        Self {
            old,
            new,
            kind: diff_type,
            patch: patch_text,
        }
    }

    pub fn binary_from_repo_and_delta(repo: &git2::Repository, delta: &git2::DiffDelta) -> Diff {
        let old = DiffFile::try_from_repo_and_diff_file(repo, &delta.old_file());
        let new = DiffFile::try_from_repo_and_diff_file(repo, &delta.new_file());
        Self {
            old,
            new,
            kind: DiffKind::Binary,
            patch: "".to_string(),
        }
    }
}
