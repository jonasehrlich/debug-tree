use tree_ds::prelude::*;

pub mod metadata {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
    pub struct GitMetadata {
        pub revision: String,
    }

    #[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
    pub struct StateMetadata {
        pub title: String,
        pub git: Option<GitMetadata>,
    }

    #[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
    pub struct ActionMetadata {
        pub title: String,
    }

    #[derive(Debug, Clone, Serialize, Eq, PartialEq, Deserialize)]
    pub enum Metadata {
        Action(ActionMetadata),
        State(StateMetadata),
    }
}

use metadata::*;

pub type NodeType = Node<AutomatedId, Metadata>;
pub type TreeType = Tree<AutomatedId, Metadata>;

pub fn add_action_node(
    tree: &mut TreeType,
    parent_id: &AutomatedId,
    title: &str,
) -> Result<AutomatedId> {
    tree.add_node(
        NodeType::new_with_auto_id(Some(Metadata::Action(ActionMetadata {
            title: title.to_string(),
        }))),
        Some(parent_id),
    )
}

pub fn add_state_node(
    tree: &mut TreeType,
    parent_id: &AutomatedId,
    title: &str,
    git_metadata: Option<GitMetadata>,
) -> Result<AutomatedId> {
    tree.add_node(
        NodeType::new_with_auto_id(Some(Metadata::State(StateMetadata {
            title: title.to_string(),
            git: git_metadata,
        }))),
        Some(parent_id),
    )
}

pub fn get_dummy_tree(project_name: &str) -> Result<TreeType> {
    let mut tree: TreeType = TreeType::new(Some(project_name));

    let root_state = StateMetadata {
        title: "Toilet clogged".to_string(),
        git: None,
    };
    let root = tree.add_node(
        NodeType::new_with_auto_id(Some(Metadata::State(root_state))),
        None,
    )?;

    let flush = add_action_node(&mut tree, &root, "Flush toilet")?;
    let _overflow = add_state_node(&mut tree, &flush, "overflow", None)?;

    let pump = add_action_node(&mut tree, &root, "pump it up")?;
    let _unclogged = add_state_node(&mut tree, &pump, "unclogged", None)?;
    Ok(tree)
}
