use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    Database(String),
    NotFound(String),
    Validation(String),
    Io(String),
}

impl From<diesel::result::Error> for AppError {
    fn from(e: diesel::result::Error) -> Self {
        match e {
            diesel::result::Error::NotFound => AppError::NotFound(e.to_string()),
            other => AppError::Database(other.to_string()),
        }
    }
}

impl From<diesel::r2d2::PoolError> for AppError {
    fn from(e: diesel::r2d2::PoolError) -> Self {
        AppError::Database(e.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Database(m) | Self::NotFound(m) | Self::Validation(m) | Self::Io(m) => {
                write!(f, "{m}")
            }
        }
    }
}

pub type CmdResult<T> = Result<T, AppError>;
