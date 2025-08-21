use std::io::Write;

use git2_ox::utils;

mod common;

#[test]
fn test_clean() {
    let t = common::TempRepository::try_init().unwrap();
    t.create_and_commit_random_file();
    let status = t.repo().status().unwrap();
    assert!(!status.is_dirty());
}

#[test]
fn test_worktree_new() {
    let t = common::TempRepository::try_init().unwrap();
    t.create_and_commit_random_file();

    let f = t.create_random_file();
    let status = t.repo().status().unwrap();
    assert!(status.is_dirty());
    assert_eq!(status.worktree().new_files().as_ref(), vec![f])
}

#[test]
fn test_worktree_modified() {
    let t = common::TempRepository::try_init().unwrap();
    let (f, _) = t.create_and_commit_random_file();

    let path = t.path().join(&f);
    {
        let mut file = std::fs::OpenOptions::new().append(true).open(path).unwrap();
        file.write_all(b"new content").unwrap();
        file.sync_all().unwrap();
    }
    let status = t.repo().status().unwrap();
    assert!(status.is_dirty());
    assert_eq!(status.worktree().modified_files().as_ref(), vec![f])
}

#[test]
fn test_worktree_renamed() {
    let t = common::TempRepository::try_init().unwrap();
    let (f, _) = t.create_and_commit_random_file();

    let new_filename = "new-filename";
    std::fs::rename(t.path().join(&f), t.path().join(new_filename)).unwrap();
    let status = t.repo().status().unwrap();
    assert!(status.is_dirty());
    assert_eq!(status.worktree().renamed_files().as_ref(), vec![f])
}

#[test]
fn test_worktree_deleted() {
    let t = common::TempRepository::try_init().unwrap();
    let (f, _) = t.create_and_commit_random_file();

    std::fs::remove_file(t.path().join(&f)).unwrap();
    let status = t.repo().status().unwrap();
    assert!(status.is_dirty());
    assert_eq!(status.worktree().deleted_files().as_ref(), vec![f])
}

#[test]
fn test_index_new() {
    let t = common::TempRepository::try_init().unwrap();
    t.create_and_commit_random_file();

    let f = t.create_random_file();
    t.repo().add_all(["*"]).unwrap();
    let status = t.repo().status().unwrap();
    assert!(status.is_dirty());
    assert_eq!(status.index().new_files().as_ref(), vec![f])
}

#[test]
fn test_index_modified() {
    let t = common::TempRepository::try_init().unwrap();
    let (f, _) = t.create_and_commit_random_file();

    let path = t.path().join(&f);
    {
        let mut file = std::fs::OpenOptions::new().append(true).open(path).unwrap();
        file.write_all(b"new content").unwrap();
        file.sync_all().unwrap();
    }
    t.repo().add_all(["*"]).unwrap();

    let status = t.repo().status().unwrap();
    assert!(status.is_dirty());
    assert_eq!(status.index().modified_files().as_ref(), vec![f])
}

#[test]
fn test_index_renamed() {
    let t = common::TempRepository::try_init().unwrap();
    let (f, _) = t.create_and_commit_random_file();

    let new_filename = "new-filename";
    std::fs::rename(t.path().join(&f), t.path().join(new_filename)).unwrap();

    t.repo().add_all(["*"]).unwrap();

    let status = t.repo().status().unwrap();
    dbg!(&status);
    assert!(status.is_dirty());
    assert_eq!(status.index().renamed_files().as_ref(), vec![f])
}

#[test]
fn test_index_deleted() {
    let t = common::TempRepository::try_init().unwrap();
    let (f, _) = t.create_and_commit_random_file();

    std::fs::remove_file(t.path().join(&f)).unwrap();
    t.repo().add_all(["*"]).unwrap();

    let status = t.repo().status().unwrap();
    assert!(status.is_dirty());
    assert_eq!(status.index().deleted_files().as_ref(), vec![f])
}

#[test]
fn test_detached_head() {
    let t = common::TempRepository::try_init().unwrap();
    let (_, commit_id) = t.create_and_commit_random_file();
    t.create_and_commit_random_file();
    t.repo()
        .repo()
        .set_head_detached(
            utils::get_commit_for_revision(t.repo().repo(), &commit_id)
                .unwrap()
                .id(),
        )
        .unwrap();
    let status = t.repo().status().unwrap();
    assert!(status.is_detached_head());
}
