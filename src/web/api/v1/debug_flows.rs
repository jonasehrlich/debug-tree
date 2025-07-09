use std::io;

use axum::extract::{Path, State};
use axum::{Json, http, routing};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{
    flow,
    web::{self, api},
};

pub fn router() -> routing::Router<web::AppState> {
    routing::Router::new()
        .route(
            "/debug_flows",
            routing::get(list_debug_flows).post(create_debug_flow),
        )
        .route(
            "/debug_flows/{id}",
            routing::get(get_debug_flow)
                .delete(delete_debug_flow)
                .post(store_debug_flow),
        )
}

/// API documentation for the debug_flows endpoints.
#[derive(utoipa::OpenApi)]
#[openapi(paths(list_debug_flows, create_debug_flow, get_debug_flow, delete_debug_flow, store_debug_flow), tags((name = "DebugFlow Management", description="DebugFlow related endpoints")) )]
pub(super) struct ApiDoc;

#[derive(Serialize, ToSchema)]
struct ListDebugFlowsResponse {
    debug_flows: Vec<flow::DebugFlowMetadata>,
}
impl ListDebugFlowsResponse {
    pub fn new() -> Self {
        ListDebugFlowsResponse {
            debug_flows: Vec::new(),
        }
    }
}

impl<T> FromIterator<T> for ListDebugFlowsResponse
where
    flow::DebugFlowMetadata: From<T>,
{
    fn from_iter<I: IntoIterator<Item = T>>(iter: I) -> Self {
        let mut resp = ListDebugFlowsResponse::new();
        for item in iter {
            resp.debug_flows.push(item.into());
        }
        resp
    }
}

#[utoipa::path(
    get,
    path = "",
    description = "List all debug trees",
    responses(
        (status = http::StatusCode::OK, description = "List debug trees", body = ListDebugFlowsResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn list_debug_flows(
    State(app_state): State<web::AppState>,
) -> api::Result<ListDebugFlowsResponse> {
    let debug_flows = app_state
        .debug_flow_dir()
        .metadatas()
        .map_err(|e| api::AppError::InternalServerError(e.to_string()))?;
    Ok(Json(debug_flows.collect::<ListDebugFlowsResponse>()))
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct CreateDebugFlowRequest {
    name: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct CreateDebugFlowResponse {
    debug_flow: flow::DebugFlowMetadata,
}

impl CreateDebugFlowResponse {
    pub fn new(debug_flow: flow::DebugFlowMetadata) -> Self {
        Self { debug_flow }
    }
}

impl TryFrom<flow::DebugFlow> for CreateDebugFlowResponse {
    type Error = flow::Error;
    fn try_from(debug_flow: flow::DebugFlow) -> Result<Self, flow::Error> {
        Ok(Self::new(debug_flow.try_into()?))
    }
}

#[utoipa::path(
    post,
    path = "",
    description = "Create a debug flow",
    responses(
        (status = http::StatusCode::OK, description = "Debug Flow created", body = CreateDebugFlowResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn create_debug_flow(
    State(app_state): State<web::AppState>,
    Json(new_debug_flow): Json<CreateDebugFlowRequest>,
) -> api::Result<CreateDebugFlowResponse> {
    let resp: CreateDebugFlowResponse = app_state
        .debug_flow_dir()
        .create_debug_flow(&new_debug_flow.name, false)
        .map_err(|e| api::AppError::InternalServerError(e.to_string()))?
        .try_into()
        .map_err(|e: flow::Error| api::AppError::InternalServerError(e.to_string()))?;

    Ok(Json(resp))
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct FullDebugFlowRequestResponse {
    debug_flow: flow::DebugFlowData,
}

impl FullDebugFlowRequestResponse {
    pub fn new(debug_flow: flow::DebugFlowData) -> Self {
        Self { debug_flow }
    }
}

impl From<flow::DebugFlowData> for FullDebugFlowRequestResponse {
    fn from(value: flow::DebugFlowData) -> Self {
        Self::new(value)
    }
}

impl From<&flow::DebugFlowData> for FullDebugFlowRequestResponse {
    fn from(value: &flow::DebugFlowData) -> Self {
        Self::new(value.clone())
    }
}
#[utoipa::path(
    get,
    path = "/{id}",
    description = "Get a debug flow",
    responses(
        (status = http::StatusCode::OK, description = "DebugFlow is available", body = FullDebugFlowRequestResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::NOT_FOUND, description = "File not found", body = api::ApiStatusDetailResponse),
    )
)]
async fn get_debug_flow(
    State(app_state): State<web::AppState>,
    Path(id): Path<String>,
) -> api::Result<FullDebugFlowRequestResponse> {
    let debug_flow = match app_state.debug_flow_dir().get_debug_flow_by_id(&id) {
        Ok(p) => p,
        Err(flow::Error::Io(_, io_err)) => match io_err.kind() {
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

    Ok(Json(debug_flow.data().into()))
}

#[utoipa::path(
    delete,
    path = "/{id}",
    description = "Delete a debug flow",
    responses(
        (status = http::StatusCode::OK, description = "DebugFlow is deleted", body = api::ApiStatusResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::NOT_FOUND, description = "File not found", body = api::ApiStatusDetailResponse),
    )
)]
async fn delete_debug_flow(
    State(app_state): State<web::AppState>,
    Path(id): Path<String>,
) -> api::Result<api::ApiStatusResponse> {
    match app_state.debug_flow_dir().delete_debug_flow_by_id(&id) {
        Ok(_) => Ok(Json(http::StatusCode::OK.into())),
        Err(flow::Error::Io(_, io_err)) => match io_err.kind() {
            io::ErrorKind::NotFound => Err(api::AppError::NotFound(id)),
            _ => Err(api::AppError::InternalServerError(
                io_err.kind().to_string(),
            )),
        },
        Err(e) => Err(api::AppError::InternalServerError(e.to_string())),
    }
}

#[utoipa::path(
    post,
    path = "/{id}",
    description = "Store a debug flow",
    responses(
        (status = http::StatusCode::OK, description = "Debug Flow is stored", body = api::ApiStatusResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn store_debug_flow(
    State(app_state): State<web::AppState>,
    Path(id): Path<String>,
    Json(new_debug_flow): Json<FullDebugFlowRequestResponse>,
) -> api::Result<api::ApiStatusResponse> {
    match app_state.debug_flow_dir().save_debug_flow(&new_debug_flow.debug_flow) {
        Ok(_) => Ok(Json(http::StatusCode::OK.into())),
        Err(flow::Error::Io(_, io_err)) => match io_err.kind() {
            io::ErrorKind::NotFound => Err(api::AppError::NotFound(id)),
            _ => Err(api::AppError::InternalServerError(
                io_err.kind().to_string(),
            )),
        },
        Err(e) => Err(api::AppError::InternalServerError(e.to_string())),
    }
}
