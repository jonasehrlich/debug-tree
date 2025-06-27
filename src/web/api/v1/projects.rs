use std::io;

use axum::extract::{Path, State};
use axum::{Json, http, routing};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{
    project,
    web::{self, api},
};

pub fn router() -> routing::Router<web::AppState> {
    routing::Router::new()
        .route(
            "/projects",
            routing::get(list_projects).post(create_project),
        )
        .route(
            "/projects/{id}",
            routing::get(get_project).delete(delete_project),
        )
}

#[derive(Serialize, ToSchema)]
struct ListProjectsResponse {
    projects: Vec<project::Metadata>,
}
impl ListProjectsResponse {
    pub fn new() -> Self {
        ListProjectsResponse {
            projects: Vec::new(),
        }
    }
}

impl<T> FromIterator<T> for ListProjectsResponse
where
    project::Metadata: From<T>,
{
    fn from_iter<I: IntoIterator<Item = T>>(iter: I) -> Self {
        let mut resp = ListProjectsResponse::new();
        for item in iter {
            resp.projects.push(item.into());
        }
        resp
    }
}

#[utoipa::path(
    get,
    path = "/projects",
    description = "List the available projects",
    responses(
        (status = http::StatusCode::OK, description = "List projects", body = ListProjectsResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn list_projects(
    State(app_state): State<web::AppState>,
) -> api::Result<ListProjectsResponse> {
    let projects = app_state
        .project_dir()
        .projects_iter()
        .map_err(|e| api::AppError::InternalServerError(e.to_string()))?;
    Ok(Json(projects.collect::<ListProjectsResponse>()))
}

#[derive(Deserialize, ToSchema)]
struct CreateProjectRequest {
    name: String,
}

#[derive(Serialize, ToSchema)]
struct CreateProjectResponse {
    project: project::Metadata,
}

impl CreateProjectResponse {
    pub fn new(project: project::Metadata) -> Self {
        Self { project }
    }
}

impl From<project::Project> for CreateProjectResponse {
    fn from(project: project::Project) -> Self {
        Self::new(project.into())
    }
}

#[utoipa::path(
    post,
    path = "/projects",
    description = "Create a project",
    responses(
        (status = http::StatusCode::OK, description = "Project created", body = CreateProjectResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn create_project(
    State(app_state): State<web::AppState>,
    Json(new_project): Json<CreateProjectRequest>,
) -> api::Result<CreateProjectResponse> {
    let project = app_state
        .project_dir()
        .create_project(&new_project.name, false)
        .map_err(|e| api::AppError::InternalServerError(e.to_string()))?;
    Ok(Json(project.into()))
}

#[derive(Serialize, ToSchema)]
struct GetProjectResponse {
    project: project::Project,
}

impl GetProjectResponse {
    pub fn new(project: project::Project) -> Self {
        Self { project }
    }
}

impl From<project::Project> for GetProjectResponse {
    fn from(value: project::Project) -> Self {
        Self::new(value)
    }
}

#[utoipa::path(
    get,
    path = "/projects/{id}",
    description = "Get the full state of a project",
    responses(
        (status = http::StatusCode::OK, description = "Project is available", body = GetProjectResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::NOT_FOUND, description = "File not found", body = api::ApiStatusDetailResponse),
    )
)]
async fn get_project(
    State(app_state): State<web::AppState>,
    Path(id): Path<String>,
) -> api::Result<GetProjectResponse> {
    let project = match app_state.project_dir().get_project_by_id(&id) {
        Ok(p) => p,
        Err(project::Error::Io(_, io_err)) => match io_err.kind() {
            io::ErrorKind::NotFound => {
                return Err(api::AppError::NotFound(id));
            }
            _ => {
                return Err(api::AppError::InternalServerError(
                    io_err.kind().to_string(),
                ));
            }
        },
        Err(e) => return Err(api::AppError::InternalServerError(e.to_string())),
    };

    Ok(Json(project.into()))
}

#[utoipa::path(
    delete,
    path = "/projects/{id}",
    description = "Delete a project",
    responses(
        (status = http::StatusCode::OK, description = "Project is deleted", body = api::ApiStatusResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::NOT_FOUND, description = "File not found", body = api::ApiStatusDetailResponse),
    )
)]
async fn delete_project(
    State(app_state): State<web::AppState>,
    Path(id): Path<String>,
) -> api::Result<api::ApiStatusResponse> {
    match app_state.project_dir().delete_project_by_id(&id) {
        Ok(_) => Ok(Json(http::StatusCode::OK.into())),
        Err(project::Error::Io(_, io_err)) => match io_err.kind() {
            io::ErrorKind::NotFound => Err(api::AppError::NotFound(id)),
            _ => Err(api::AppError::InternalServerError(
                io_err.kind().to_string(),
            )),
        },
        Err(e) => Err(api::AppError::InternalServerError(e.to_string())),
    }
}
