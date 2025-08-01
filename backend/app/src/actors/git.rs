use hannibal::prelude::*;
use std::path::Path;

#[derive(Actor)]
pub struct GitActor {
    repository: git2_ox::Repository,
}
pub type GitActorAddr = Addr<GitActor>;

impl GitActor {
    pub fn new(repository: git2_ox::Repository) -> Self {
        Self { repository }
    }

    pub fn try_from_path<P: AsRef<Path>>(path: P) -> Result<Self, git2_ox::error::Error> {
        let repository = git2_ox::Repository::try_open(path.as_ref())?;
        Ok(Self { repository })
    }

    fn filter_commit(filter: &str, commit: &git2_ox::Commit) -> bool {
        let id_matches = commit
            .id()
            .to_string()
            .to_lowercase()
            .contains(&filter.to_lowercase());
        let summary_matches = commit
            .summary()
            .to_lowercase()
            .contains(&filter.to_lowercase());
        id_matches || summary_matches
    }
}

#[message(response = Result<git2_ox::Commit, git2_ox::error::Error>)]
pub struct GetRevision {
    pub revision: String,
}

impl Handler<GetRevision> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        msg: GetRevision,
    ) -> Result<git2_ox::Commit, git2_ox::error::Error> {
        self.repository.get_commit_for_revision(&msg.revision)
    }
}

#[message(response = Result<git2_ox::Commit, git2_ox::error::Error>)]
pub struct CheckoutRevision {
    pub revision: String,
}

impl Handler<CheckoutRevision> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        msg: CheckoutRevision,
    ) -> Result<git2_ox::Commit, git2_ox::error::Error> {
        self.repository.checkout_revision(&msg.revision)
    }
}

#[message(response = Result<Vec<git2_ox::Commit>, git2_ox::error::Error>)]
pub struct ListCommits {
    pub base_rev: Option<String>,
    pub head_rev: Option<String>,
    pub filter: Option<String>,
}

impl Handler<ListCommits> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        msg: ListCommits,
    ) -> Result<Vec<git2_ox::Commit>, git2_ox::error::Error> {
        let commits_iter = self
            .repository
            .iter_commits(msg.base_rev.as_deref(), msg.head_rev.as_deref())?;
        let filter = msg.filter.unwrap_or_default();

        let mut commits = Vec::new();
        for commit_result in commits_iter {
            let commit = commit_result?;
            if filter.is_empty() || Self::filter_commit(&filter, &commit) {
                commits.push(commit);
            }
        }
        Ok(commits)
    }
}

#[message(response = Result<Vec<git2_ox::Diff>, git2_ox::error::Error>)]
pub struct ListDiffs {
    pub base_rev: Option<String>,
    pub head_rev: Option<String>,
}

impl Handler<ListDiffs> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        msg: ListDiffs,
    ) -> Result<Vec<git2_ox::Diff>, git2_ox::error::Error> {
        let diffs_iter = self
            .repository
            .iter_diffs_between_revisions(msg.base_rev.as_deref(), msg.head_rev.as_deref())?;
        let mut diffs = Vec::new();
        for diff_result in diffs_iter {
            diffs.push(diff_result?);
        }
        Ok(diffs)
    }
}

#[message(response = Result<Vec<git2_ox::TaggedCommit>, git2_ox::error::Error>)]
pub struct ListTags {
    pub filter: Option<String>,
}

impl Handler<ListTags> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        msg: ListTags,
    ) -> Result<Vec<git2_ox::TaggedCommit>, git2_ox::error::Error> {
        let tags_iter = self.repository.iter_tags(msg.filter.as_deref())?;
        let mut tags = Vec::new();
        for tag_result in tags_iter {
            tags.push(tag_result?);
        }
        Ok(tags)
    }
}

#[message(response = Result<git2_ox::TaggedCommit, git2_ox::error::Error>)]
pub struct CreateTag {
    pub name: String,
    pub revision: String,
    pub force: bool,
}

impl Handler<CreateTag> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        msg: CreateTag,
    ) -> Result<git2_ox::TaggedCommit, git2_ox::error::Error> {
        self.repository
            .create_lightweight_tag(&msg.name, &msg.revision, msg.force)
    }
}

#[message(response = Result<Vec<git2_ox::Branch>, git2_ox::error::Error>)]
pub struct ListBranches {
    pub filter: Option<String>,
}

impl Handler<ListBranches> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        msg: ListBranches,
    ) -> Result<Vec<git2_ox::Branch>, git2_ox::error::Error> {
        let branches = self
            .repository
            .iter_branches(msg.filter.as_deref())?
            .collect();
        Ok(branches)
    }
}

#[message(response = Result<git2_ox::Branch, git2_ox::error::Error>)]
pub struct CreateBranch {
    pub name: String,
    pub revision: String,
    pub force: bool,
}

impl Handler<CreateBranch> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        msg: CreateBranch,
    ) -> Result<git2_ox::Branch, git2_ox::error::Error> {
        self.repository
            .create_branch(&msg.name, &msg.revision, msg.force)
    }
}

#[derive(Debug, Clone)]
pub struct RepositoryStatus {
    pub head: git2_ox::Commit,
    pub current_branch: Option<String>,
}

#[message(response = Result<RepositoryStatus, git2_ox::error::Error>)]
pub struct GetRepositoryStatus;

impl Handler<GetRepositoryStatus> for GitActor {
    async fn handle(
        &mut self,
        _ctx: &mut Context<Self>,
        _msg: GetRepositoryStatus,
    ) -> Result<RepositoryStatus, git2_ox::error::Error> {
        let head = self.repository.get_commit_for_revision("HEAD")?;
        let current_branch = self.repository.current_branch_name();
        Ok(RepositoryStatus {
            head,
            current_branch,
        })
    }
}
