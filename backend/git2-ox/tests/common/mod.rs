use uuid::Uuid;

type FileName = String;
type CommitId = String;

pub struct TempRepository {
    /// https://github.com/rust-lang/rfcs/blob/246ff86b320a72f98ed2df92805e8e3d48b402d6/text/1857-stabilize-drop-order.md
    /// specifies that struct members are dropped in the order they are declared
    repo: git2_ox::Repository,
    temp_dir: tempfile::TempDir,
}

impl TempRepository {
    pub fn try_init() -> Result<Self, git2_ox::error::Error> {
        let temp_dir = tempfile::tempdir().unwrap();
        let repo = git2_ox::Repository::try_init(temp_dir.path())?;
        Ok(Self { repo, temp_dir })
    }
    pub fn repo(&self) -> &git2_ox::Repository {
        &self.repo
    }

    pub fn path(&self) -> &std::path::Path {
        self.temp_dir.path()
    }

    pub fn create_and_commit_random_file(&self) -> (FileName, CommitId) {
        let file_name = Uuid::new_v4().to_string();
        let file_path = self.path().join(&file_name);
        std::fs::write(&file_path, "random content").unwrap();

        let mut index = self.repo.repo().index().unwrap();
        index.add_path(std::path::Path::new(&file_name)).unwrap();
        index.write().unwrap();

        let tree_id = index.write_tree().unwrap();
        let tree = self.repo.repo().find_tree(tree_id).unwrap();
        let signature = git2::Signature::now("test", "test@example.com").unwrap();

        let parent_commit = self
            .repo
            .repo()
            .head()
            .ok()
            .and_then(|head| head.peel_to_commit().ok());
        let parents = parent_commit.as_ref().map_or(vec![], |commit| vec![commit]);

        let commit_id = self
            .repo
            .repo()
            .commit(
                Some("HEAD"),
                &signature,
                &signature,
                &format!("Add {}", file_name),
                &tree,
                &parents,
            )
            .unwrap()
            .to_string();
        (file_name, commit_id)
    }
}
