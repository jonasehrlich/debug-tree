pub mod branch;
pub mod commit;
pub mod diff;
pub mod error;
pub mod reference;
pub mod repository;
pub mod status;
pub mod tag;
pub mod utils;

pub use branch::Branch;
pub use commit::{Commit, CommitProperties, CommitWithReferences};
pub use diff::Diff;
pub use reference::{ReferenceKind, ReferenceMetadata, ResolvedReference};
pub use repository::{ReferenceKindFilter, Repository};
pub use status::Status;
pub use tag::TaggedCommit;

type Result<T> = std::result::Result<T, error::Error>;
