mod common;

#[test]
fn test_try_init() {
    common::TempRepository::try_init().unwrap();
}

#[test]
fn test_try_open() {
    let t = common::TempRepository::try_init().unwrap();
    git2_ox::Repository::try_open(t.path()).unwrap();
}

#[test]
fn test_get_commit_for_revision() {
    let t = common::TempRepository::try_init().unwrap();
    let (_, commit_id) = t.create_and_commit_random_file();
    let branch_name = t.repo().current_branch_name().unwrap();

    assert_eq!(
        t.repo().get_commit_for_revision("HEAD").unwrap().id(),
        &commit_id
    );
    assert_eq!(
        t.repo().get_commit_for_revision(&branch_name).unwrap().id(),
        &commit_id
    );
    assert_eq!(
        t.repo().get_commit_for_revision(&commit_id).unwrap().id(),
        &commit_id
    );
    assert_eq!(
        t.repo()
            .get_commit_for_revision(&commit_id[0..8])
            .unwrap()
            .id(),
        &commit_id
    );
}

/// Shift all characters in `s` one code point forward
fn shift_chars_forward(s: &str) -> String {
    s.chars()
        .map(|c| std::char::from_u32(c as u32 + 1).unwrap_or(c))
        .collect()
}

#[test]
fn test_get_commit_for_revision_bad_revision() {
    let t = common::TempRepository::try_init().unwrap();
    let (_, commit_id) = t.create_and_commit_random_file();
    let bad_commit_id = shift_chars_forward(&commit_id);

    assert_eq!(
        t.repo().get_commit_for_revision(&bad_commit_id).is_err(),
        true
    );
    assert_eq!(
        t.repo()
            .get_commit_for_revision(&bad_commit_id[0..7])
            .is_err(),
        true
    );
    assert_eq!(
        t.repo().get_commit_for_revision("branch-foo").is_err(),
        true
    );
}

#[test]
fn test_list_commits() {
    let t = common::TempRepository::try_init().unwrap();

    let mut commit_ids = Vec::new();

    for _ in 0..5 {
        let (_, commit_id) = t.create_and_commit_random_file();
        commit_ids.push(commit_id);
    }
    let branch_name = t.repo().current_branch_name().unwrap();

    // Reverse the commit IDs as the iter_commits will provide them HEAD to base
    commit_ids.reverse();

    // Iterate from HEAD to base of repo
    assert_eq!(
        t.repo()
            .iter_commits(None, None)
            .unwrap()
            .into_iter()
            .map(|r| {
                let c = r.unwrap();
                c.id().to_string()
            })
            .collect::<Vec<_>>(),
        commit_ids
    );
    // Iterate from HEAD to base of repo
    assert_eq!(
        t.repo()
            .iter_commits(None, Some("HEAD"))
            .unwrap()
            .into_iter()
            .map(|r| {
                let c = r.unwrap();
                c.id().to_string()
            })
            .collect::<Vec<_>>(),
        commit_ids
    );

    // Iterate from HEAD of main to base of repo
    assert_eq!(
        t.repo()
            .iter_commits(None, Some(&branch_name))
            .unwrap()
            .into_iter()
            .map(|r| {
                let c = r.unwrap();
                c.id().to_string()
            })
            .collect::<Vec<_>>(),
        commit_ids
    );

    // Iterate from HEAD of main to base of repo
    assert_eq!(
        t.repo()
            .iter_commits(Some(&commit_ids[commit_ids.len() - 2]), None)
            .unwrap()
            .into_iter()
            .map(|r| {
                let c = r.unwrap();
                c.id().to_string()
            })
            .collect::<Vec<_>>(),
        commit_ids[0..commit_ids.len() - 2]
    );
}

#[test]
fn test_list_commits_multiple_branches() {
    let t = common::TempRepository::try_init().unwrap();
    let branch_name = "foo";
    let mut default_branch_commits = Vec::new();
    let mut foo_commits = Vec::new();

    for _ in 0..5 {
        let (_, commit_id) = t.create_and_commit_random_file();
        default_branch_commits.push(commit_id.clone());
        foo_commits.push(commit_id);
    }
    let default_branch_name = t.repo().current_branch_name().unwrap();

    // Create branch and check it out
    // TODO add this logic to Repository
    t.repo().create_branch(branch_name, "HEAD", false).unwrap();
    let obj = git2_ox::utils::get_object_for_revision(t.repo().repo(), branch_name).unwrap();
    t.repo().repo().checkout_tree(&obj, None).unwrap();
    t.repo()
        .repo()
        .set_head(&format!("refs/heads/{branch_name}"))
        .unwrap();

    for _ in 0..5 {
        let (_, commit_id) = t.create_and_commit_random_file();
        foo_commits.push(commit_id);
    }
    // Reverse the commit IDs as the iter_commits will provide them HEAD to base
    default_branch_commits.reverse();
    foo_commits.reverse();

    assert_eq!(
        t.repo()
            .iter_commits(None, Some(&default_branch_name))
            .unwrap()
            .into_iter()
            .map(|r| {
                let c = r.unwrap();
                c.id().to_string()
            })
            .collect::<Vec<_>>(),
        default_branch_commits
    );
    assert_eq!(
        t.repo()
            .iter_commits(None, Some(branch_name))
            .unwrap()
            .into_iter()
            .map(|r| {
                let c = r.unwrap();
                c.id().to_string()
            })
            .collect::<Vec<_>>(),
        foo_commits
    );
    assert_eq!(
        t.repo()
            .iter_commits(None, None)
            .unwrap()
            .into_iter()
            .map(|r| {
                let c = r.unwrap();
                c.id().to_string()
            })
            .collect::<Vec<_>>(),
        foo_commits
    );
}
