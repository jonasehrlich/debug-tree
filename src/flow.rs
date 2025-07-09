use crate::utils;
use serde::{Deserialize, Serialize};
use std::{ffi, fmt, fs, io, path};
use utoipa::ToSchema;

#[derive(thiserror::Error)]
pub enum Error {
    #[error("Path '{0}' is not a directory.")]
    NotADirectory(path::PathBuf),
    #[error("Debug flow '{0}' exists already in directory '{1}'.")]
    DebugFlowExistsAlready(String, path::PathBuf),
    #[error("I/O error")]
    Io(path::PathBuf, #[source] io::Error),
    #[error("Failed to read directory entry: {0}")]
    EntryError(#[from] io::Error),
    #[error("JSON error")]
    Json(#[from] serde_json::Error),
}

impl fmt::Debug for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // This delegates the Debug formatting to the Display formatting
        fmt::Display::fmt(self, f)
    }
}
/// Abstraction for a directory containing debug flows
#[derive(Clone)]
pub struct FlowsDir {
    /// Path of the debug flow directory
    path: path::PathBuf,
}

impl FlowsDir {
    pub fn new(path: path::PathBuf) -> Result<FlowsDir, Error> {
        let p = FlowsDir { path };
        match p.create_if_not_exists() {
            Ok(()) => Ok(p),
            Err(e) => Err(e),
        }
    }

    /// Get a reference to the path of the debug flow dir
    pub fn path(&self) -> &path::PathBuf {
        &self.path
    }

    /// Create the debug flow directory if it does not exist
    fn create_if_not_exists(&self) -> Result<(), Error> {
        // Check if the provided path is actually a directory
        if self.path.exists() {
            if !self.path.is_dir() {
                Err(Error::NotADirectory(self.path.clone()))
            } else {
                Ok(())
            }
        } else {
            fs::create_dir_all(self.path.clone())?;
            Ok(())
        }
    }

    /// Load of create a debug flow in the storage directory
    pub fn load_or_create_flow(&self, name: &str) -> Result<Flow, Error> {
        let mut flow_path = self.path.clone();
        flow_path.push(FlowData::file_name_from_flow_name(name));

        if flow_path.exists() {
            Flow::from_file(&flow_path)
        } else {
            Flow::from_flows_dir_and_name(&self.path, name)
        }
    }

    /// Create a debug flow with a name and store it in the debug flow directory
    pub fn create_flow(&self, name: &str, force: bool) -> Result<Flow, Error> {
        let mut flow_path = self.path.clone();
        flow_path.push(FlowData::file_name_from_flow_name(name));

        match !flow_path.is_file() || force {
            true => {
                let p = Flow::new(&self.path, name);
                p.to_file()?;
                Ok(p)
            }
            false => Err(Error::DebugFlowExistsAlready(
                name.to_string(),
                self.path.clone(),
            )),
        }
    }

    /// Load a debug flow from the storage directory
    pub fn get_flow_by_name(&self, name: &str) -> Result<Flow, Error> {
        Flow::from_flows_dir_and_name(&self.path, name)
    }

    /// Load a debug flow from the storage directory
    pub fn get_flow_by_id(&self, id: &str) -> Result<Flow, Error> {
        Flow::from_flows_dir_and_id(&self.path, id)
    }

    pub fn delete_flow_by_id(&self, id: &str) -> Result<(), Error> {
        let mut p = self.path.clone();
        p.push(FlowData::file_name_from_id(id));
        fs::remove_file(p)?;
        Ok(())
    }

    /// Get the metadata objects for all debug flows in the debug flow directory
    pub fn metadatas(&self) -> Result<impl Iterator<Item = FlowMetadata> + '_, Error> {
        Ok(self.flows()?.filter_map(|flow| flow.try_into().ok()))
    }

    /// Get an iterator over all debug flows in the debug flow directory
    pub fn flows(&self) -> Result<impl Iterator<Item = Flow> + '_, Error> {
        Ok(fs::read_dir(self.path.clone())
            .map_err(|e| Error::Io(self.path.clone(), e))? // Handle error during initial read_dir
            .filter_map(|entry_result| {
                // Filter out non-files
                match entry_result {
                    Ok(entry) => {
                        let path = entry.path();
                        if path.is_file() && path.extension() == Some(ffi::OsStr::new("json")) {
                            match Flow::from_file(&path) {
                                Ok(flow) => Some(flow),
                                Err(e) => {
                                    log::warn!("Error reading debug flow from '{e}'");
                                    None // Propagate error from previous filter_map
                                }
                            }
                        } else {
                            None // Skip directories or other non-file entries
                        }
                    }
                    Err(e) => {
                        // Ignore bad directory entries
                        log::warn!("Error reading directory entry {e}");
                        None
                    }
                }
            }))
    }

    /// Save a debug flow to the debug flow directory
    pub fn save_flow(&self, debug_flow: &FlowData) -> Result<(), Error> {
        let mut p = self.path.clone();
        p.push(FlowData::file_name_from_flow_name(&debug_flow.name));
        debug_flow.to_file(&p)?;
        Ok(())
    }
}

#[derive(Serialize, Deserialize, ToSchema, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReactFlowState {
    /// Nodes of the reactflow state, the types of the nodes are managed on the frontend
    nodes: Vec<serde_json::Value>,
    /// Edges of the reactflow state, the types of the nodes are managed on the frontend
    edges: Vec<serde_json::Value>,
}

impl ReactFlowState {
    pub fn new() -> Self {
        ReactFlowState {
            nodes: Vec::new(),
            edges: Vec::new(),
        }
    }
}

#[derive(Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FlowData {
    /// Name of the debug flow
    name: String,
    /// Representation of the reactflow state
    reactflow: ReactFlowState,
}

impl FlowData {
    pub fn new(name: &str) -> Self {
        FlowData {
            name: name.to_string(),
            reactflow: ReactFlowState::new(),
        }
    }

    /// Get the ID of the debug flow
    pub fn id(&self) -> String {
        utils::to_kebab_case(self.name.as_str())
    }

    /// Get the name of the debug flow
    pub fn name(&self) -> String {
        self.name.clone()
    }

    /// Store the debug flow data to a file
    pub fn to_file(&self, path: &path::PathBuf) -> std::result::Result<(), Error> {
        let json_content = serde_json::to_string(self)?;
        std::fs::write(path, json_content)?;
        Ok(())
    }

    /// Get the file name from the debug flow name
    pub fn file_name_from_flow_name(name: &str) -> path::PathBuf {
        FlowData::file_name_from_id(utils::to_kebab_case(name).as_str())
    }

    /// Get the file name from the debug flow ID
    pub fn file_name_from_id(id: &str) -> path::PathBuf {
        let mut p = path::PathBuf::from(id);
        p.set_extension("json");
        p
    }

    /// Create debug flow data from a file
    pub fn from_file(path: &path::PathBuf) -> Result<FlowData, Error> {
        let file_content = std::fs::read_to_string(path)?;
        serde_json::from_str(&file_content).map_err(Error::Json)
    }

    /// Get the number of nodes in the diagram
    pub fn num_nodes(&self) -> usize {
        self.reactflow.nodes.len()
    }

    /// Get the number of edges in the diagram
    pub fn num_edges(&self) -> usize {
        self.reactflow.edges.len()
    }
}

pub struct Flow {
    /// Path of the debug flow
    path: path::PathBuf,
    /// Project data
    data: FlowData,
}

impl Flow {
    pub fn new(flows_dir: &path::Path, name: &str) -> Self {
        let mut path = flows_dir.to_path_buf();
        path.push(FlowData::file_name_from_flow_name(name));
        Flow {
            path,
            data: FlowData::new(name),
        }
    }

    /// Create a new object from a debug flow directory and debug flow name
    /// NOTE:
    pub fn from_flows_dir_and_name(flows_dir: &path::Path, name: &str) -> Result<Self, Error> {
        let mut path = flows_dir.to_path_buf();
        path.push(FlowData::file_name_from_flow_name(name));

        Ok(Flow {
            path: path.clone(),
            data: FlowData::from_file(&path)?,
        })
    }

    pub fn from_flows_dir_and_id(flows_dir: &path::Path, id: &str) -> Result<Self, Error> {
        let mut path = flows_dir.to_path_buf();
        path.push(FlowData::file_name_from_id(id));

        Ok(Flow {
            path: path.clone(),
            data: FlowData::from_file(&path)?,
        })
    }

    pub fn from_file(path: &path::PathBuf) -> Result<Flow, Error> {
        Ok(Flow {
            path: path.clone(),
            data: FlowData::from_file(path)?,
        })
    }

    pub fn id(&self) -> String {
        self.data.id()
    }

    pub fn name(&self) -> String {
        self.data.name()
    }
    pub fn to_file(&self) -> Result<(), Error> {
        self.data.to_file(&self.path)
    }

    pub fn data(&self) -> &FlowData {
        &self.data
    }

    pub fn num_nodes(&self) -> usize {
        self.data.num_nodes()
    }

    pub fn num_edges(&self) -> usize {
        self.data.num_edges()
    }

    pub fn file_metadata(&self) -> Result<fs::Metadata, Error> {
        Ok(fs::metadata(&self.path)?)
    }
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FlowMetadata {
    /// ID of the debug flow
    id: String,
    /// Name of the debug flow
    name: String,
    /// Last modified date
    last_modified_date: chrono::DateTime<chrono::Utc>,
    /// Number of nodes in the debug flow
    num_nodes: usize,
    /// Number of edges in the debug flow
    num_edges: usize,
}

impl TryFrom<Flow> for FlowMetadata {
    type Error = Error;

    fn try_from(p: Flow) -> Result<Self, Error> {
        let accessed = p.file_metadata()?.accessed()?;
        Ok(FlowMetadata {
            id: p.id(),
            name: p.name(),
            last_modified_date: accessed.into(),
            num_nodes: p.num_nodes(),
            num_edges: p.num_edges(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_name() {
        assert_eq!(
            FlowData::file_name_from_flow_name("HELLO WORLD"),
            path::Path::new("hello-world.json")
        );
    }
}
