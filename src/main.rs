use serde::Serialize;
use tree_ds::prelude::*;

#[derive(Debug, Clone, Serialize, Eq, PartialEq)]
pub struct GitMetadata {
    pub revision: String,
}

#[derive(Debug, Clone, Serialize, Eq, PartialEq)]
pub struct Metadata {
    pub title: String,
    pub git: Option<GitMetadata>,
}

#[derive(Debug, Clone, Serialize, Eq, PartialEq)]
pub struct DecisionMetadata {
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Eq, PartialEq)]
pub enum NodeType {
    Decision(DecisionMetadata),
    State(Metadata),
}

type N = Node<AutomatedId, NodeType>;

fn add_decision(
    tree: &mut Tree<AutomatedId, NodeType>,
    parent: &AutomatedId,
    title: &str,
) -> AutomatedId {
    tree.add_node(
        N::new_with_auto_id(Some(NodeType::Decision(DecisionMetadata {
            title: title.to_string(),
        }))),
        Some(parent),
    )
    .unwrap()
}

fn add_state(
    tree: &mut Tree<AutomatedId, NodeType>,
    parent: &AutomatedId,
    title: &str,
    git_metadata: Option<GitMetadata>,
) -> AutomatedId {
    tree.add_node(
        N::new_with_auto_id(Some(NodeType::State(Metadata {
            title: title.to_string(),
            git: git_metadata,
        }))),
        Some(parent),
    )
    .unwrap()
}

fn main() {
    let mut tree: Tree<AutomatedId, NodeType> = Tree::new(Some("My tree"));

    let root_state = Metadata {
        title: "Toilet clogged".to_string(),
        git: None,
    };
    let root = tree
        .add_node(N::new_with_auto_id(Some(NodeType::State(root_state))), None)
        .unwrap();

    let flush = add_decision(&mut tree, &root, "Flush toilet");
    let _overflow = add_state(&mut tree, &flush, "overflow", None);

    let pump = add_decision(&mut tree, &root, "pump it up");
    let _unclogged = add_state(&mut tree, &pump, "unclogged", None);

    println!("Hello, world!");

    println!("{}", serde_json::to_string_pretty(&tree).unwrap());
}
