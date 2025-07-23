use std::fmt::Display;

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
    pub(crate) fn new(ctx: impl Into<String>, err: git2::Error) -> Self {
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
    pub(crate) fn from_ctx_and_error(ctx: impl Into<String>, e: git2::Error) -> Self {
        match e.code() {
            git2::ErrorCode::NotFound => Error::NotFound(ErrorCtx::new(ctx, e)),
            git2::ErrorCode::Invalid => Error::Invalid(ErrorCtx::new(ctx, e)),
            _ => Error::Generic(ErrorCtx::new(ctx, e)),
        }
    }
}
