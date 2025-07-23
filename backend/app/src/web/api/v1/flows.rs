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
        .route("/flows", routing::get(list_flows).post(create_flow))
        .route(
            "/flows/{id}",
            routing::get(get_flow).delete(delete_flow).post(store_flow),
        )
}

/// API documentation for the flows endpoints.
#[derive(utoipa::OpenApi)]
#[openapi(paths(list_flows, create_flow, get_flow, delete_flow, store_flow), tags((name = "Debug Flow Management", description="Debug Flow related endpoints")) )]
pub(super) struct ApiDoc;

#[derive(Serialize, ToSchema)]
struct ListFlowsResponse {
    flows: Vec<flow::FlowMetadata>,
}
impl ListFlowsResponse {
    pub fn new() -> Self {
        ListFlowsResponse { flows: Vec::new() }
    }
}

impl<T> FromIterator<T> for ListFlowsResponse
where
    flow::FlowMetadata: From<T>,
{
    fn from_iter<I: IntoIterator<Item = T>>(iter: I) -> Self {
        let mut resp = ListFlowsResponse::new();
        for item in iter {
            resp.flows.push(item.into());
        }
        resp
    }
}

#[utoipa::path(
    get,
    path = "",
    description = "List all debug flows",
    responses(
        (status = http::StatusCode::OK, description = "List debug flows", body = ListFlowsResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn list_flows(State(app_state): State<web::AppState>) -> api::Result<ListFlowsResponse> {
    let flows = app_state
        .flows_dir()
        .metadatas()
        .map_err(|e| api::AppError::InternalServerError(e.to_string()))?;
    Ok(Json(flows.collect::<ListFlowsResponse>()))
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct CreateFlowRequest {
    name: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct CreateFlowResponse {
    flow: flow::FlowMetadata,
}

impl CreateFlowResponse {
    pub fn new(flow: flow::FlowMetadata) -> Self {
        Self { flow }
    }
}

impl TryFrom<flow::Flow> for CreateFlowResponse {
    type Error = flow::Error;
    fn try_from(flow: flow::Flow) -> Result<Self, flow::Error> {
        Ok(Self::new(flow.try_into()?))
    }
}

#[utoipa::path(
    post,
    path = "",
    description = "Create a debug flow",
    responses(
        (status = http::StatusCode::OK, description = "Debug Flow created", body = CreateFlowResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn create_flow(
    State(app_state): State<web::AppState>,
    Json(new_flow): Json<CreateFlowRequest>,
) -> api::Result<CreateFlowResponse> {
    let resp: CreateFlowResponse = app_state
        .flows_dir()
        .create_flow(&new_flow.name, false)
        .map_err(|e| api::AppError::InternalServerError(e.to_string()))?
        .try_into()
        .map_err(|e: flow::Error| api::AppError::InternalServerError(e.to_string()))?;

    Ok(Json(resp))
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct FullFlowRequestResponse {
    flow: flow::FlowData,
}

impl FullFlowRequestResponse {
    pub fn new(flow: flow::FlowData) -> Self {
        Self { flow }
    }
}

impl From<flow::FlowData> for FullFlowRequestResponse {
    fn from(value: flow::FlowData) -> Self {
        Self::new(value)
    }
}

impl From<&flow::FlowData> for FullFlowRequestResponse {
    fn from(value: &flow::FlowData) -> Self {
        Self::new(value.clone())
    }
}

#[utoipa::path(
    get,
    path = "/{id}",
    description = "Get a debug flow",
    responses(
        (status = http::StatusCode::OK, description = "Debug flow is available", body = FullFlowRequestResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::NOT_FOUND, description = "File not found", body = api::ApiStatusDetailResponse),
    )
)]
async fn get_flow(
    State(app_state): State<web::AppState>,
    Path(id): Path<String>,
) -> api::Result<FullFlowRequestResponse> {
    let flow = match app_state.flows_dir().get_flow_by_id(&id) {
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

    Ok(Json(flow.data().into()))
}

#[utoipa::path(
    delete,
    path = "/{id}",
    description = "Delete a debug flow",
    responses(
        (status = http::StatusCode::OK, description = "Debug flow is deleted", body = api::ApiStatusResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
        (status = http::StatusCode::NOT_FOUND, description = "File not found", body = api::ApiStatusDetailResponse),
    )
)]
async fn delete_flow(
    State(app_state): State<web::AppState>,
    Path(id): Path<String>,
) -> api::Result<api::ApiStatusResponse> {
    match app_state.flows_dir().delete_flow_by_id(&id) {
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
        (status = http::StatusCode::OK, description = "Debug flow is stored", body = api::ApiStatusResponse),
        (status = http::StatusCode::INTERNAL_SERVER_ERROR, description = "Internal server error", body = api::ApiStatusDetailResponse),
    )
)]
async fn store_flow(
    State(app_state): State<web::AppState>,
    Path(id): Path<String>,
    Json(new_flow): Json<FullFlowRequestResponse>,
) -> api::Result<api::ApiStatusResponse> {
    match app_state.flows_dir().save_flow(&new_flow.flow) {
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
