use std::fmt::Display;

pub mod branch;
pub mod commit;
pub mod diff;
pub mod repository;
pub mod tag;
pub mod utils;

pub use branch::Branch;
pub use commit::Commit;
pub use diff::Diff;
pub use repository::Repository;
pub use tag::TaggedCommit;

#[derive(thiserror::Error, Debug)]
pub struct ErrorCtx {
    pub ctx: String,
    #[source]
    pub err: git2::Error,
}

impl Display for ErrorCtx {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.ctx, self.err)
    }
}

impl ErrorCtx {
    fn new(ctx: impl Into<String>, err: git2::Error) -> Self {
        ErrorCtx {
            ctx: ctx.into(),
            err,
        }
    }
}

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("Generic Error: {0}")]
    Generic(ErrorCtx),
    #[error("{0} not found")]
    NotFound(ErrorCtx),
    #[error("Invalid {0}")]
    Invalid(ErrorCtx),
}

impl Error {
    fn from_ctx_and_error(ctx: impl Into<String>, e: git2::Error) -> Self {
        match e.code() {
            git2::ErrorCode::NotFound => Error::NotFound(ErrorCtx::new(ctx, e)),
            git2::ErrorCode::Invalid => Error::Invalid(ErrorCtx::new(ctx, e)),
            _ => Error::Generic(ErrorCtx::new(ctx, e)),
        }
    }
}

type Result<T> = std::result::Result<T, Error>;
