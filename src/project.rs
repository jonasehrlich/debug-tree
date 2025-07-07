use crate::utils;
use serde::{Deserialize, Serialize};
use std::{ffi, fmt, fs, io, path};
use utoipa::ToSchema;

#[derive(thiserror::Error)]
pub enum Error {
    #[error("Path '{0}' is not a directory.")]
    NotADirectory(path::PathBuf),
    #[error("Project '{0}' exists already in project directory '{1}'.")]
    ProjectExistsAlready(String, path::PathBuf),
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
/// Abstraction for a directory containing debug-tree projects
#[derive(Clone)]
pub struct ProjectDir {
    /// Path of the project directory
    path: path::PathBuf,
}

impl ProjectDir {
    pub fn new(path: path::PathBuf) -> Result<ProjectDir, Error> {
        let p = ProjectDir { path };
        match p.create_if_not_exists() {
            Ok(()) => Ok(p),
            Err(e) => Err(e),
        }
    }

    /// Get a reference to the path of the project dir
    pub fn path(&self) -> &path::PathBuf {
        &self.path
    }

    /// Create the project directory if it does not exist
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

    /// Load of create a project in the project directory
    pub fn load_or_create_project(&self, name: &str) -> Result<Project, Error> {
        let mut project_path = self.path.clone();
        project_path.push(ProjectData::file_name_from_project_name(name));

        if project_path.exists() {
            Project::from_file(&project_path)
        } else {
            Project::from_project_dir_and_name(&self.path, name)
        }
    }

    /// Create a project with a name and store it in the project directory
    pub fn create_project(&self, name: &str, force: bool) -> Result<Project, Error> {
        let mut project_path = self.path.clone();
        project_path.push(ProjectData::file_name_from_project_name(name));

        match !project_path.is_file() || force {
            true => {
                let p = Project::new(&self.path, name);
                p.to_file()?;
                Ok(p)
            }
            false => Err(Error::ProjectExistsAlready(
                name.to_string(),
                self.path.clone(),
            )),
        }
    }

    /// Load a project from the project directory
    pub fn get_project_by_name(&self, name: &str) -> Result<Project, Error> {
        Project::from_project_dir_and_name(&self.path, name)
    }

    /// Load a project from the project directory
    pub fn get_project_by_id(&self, id: &str) -> Result<Project, Error> {
        Project::from_project_dir_and_id(&self.path, id)
    }

    pub fn delete_project_by_id(&self, id: &str) -> Result<(), Error> {
        let mut p = self.path.clone();
        p.push(ProjectData::file_name_from_id(id));
        fs::remove_file(p)?;
        Ok(())
    }

    /// Get the metadata objects for all projects in the project directory
    pub fn metadatas(&self) -> Result<impl Iterator<Item = ProjectMetadata> + '_, Error> {
        Ok(self
            .projects()?
            .filter_map(|project| project.try_into().ok()))
    }

    /// Get an iterator over all projects in the project directory
    pub fn projects(&self) -> Result<impl Iterator<Item = Project> + '_, Error> {
        Ok(fs::read_dir(self.path.clone())
            .map_err(|e| Error::Io(self.path.clone(), e))? // Handle error during initial read_dir
            .filter_map(|entry_result| {
                // Filter out non-files
                match entry_result {
                    Ok(entry) => {
                        let path = entry.path();
                        if path.is_file() && path.extension() == Some(ffi::OsStr::new("json")) {
                            match Project::from_file(&path) {
                                Ok(project) => Some(project),
                                Err(e) => {
                                    log::warn!("Error reading project from '{e}'");
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

    /// Save a project to the project directory
    pub fn save_project(&self, project: &ProjectData) -> Result<(), Error> {
        let mut p = self.path.clone();
        p.push(ProjectData::file_name_from_project_name(&project.name));
        project.to_file(&p)?;
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
pub struct ProjectData {
    /// Name of the project
    name: String,
    /// Representation of the reactflow state
    reactflow: ReactFlowState,
}

impl ProjectData {
    pub fn new(name: &str) -> Self {
        ProjectData {
            name: name.to_string(),
            reactflow: ReactFlowState::new(),
        }
    }

    /// Get the ID of the project
    pub fn id(&self) -> String {
        utils::to_kebab_case(self.name.as_str())
    }

    /// Get the name of the project
    pub fn name(&self) -> String {
        self.name.clone()
    }

    /// Store the project data to a file
    pub fn to_file(&self, path: &path::PathBuf) -> std::result::Result<(), Error> {
        let json_content = serde_json::to_string(self)?;
        std::fs::write(path, json_content)?;
        Ok(())
    }

    /// Get the file name from the project name
    pub fn file_name_from_project_name(name: &str) -> path::PathBuf {
        ProjectData::file_name_from_id(utils::to_kebab_case(name).as_str())
    }

    /// Get the file name from the project ID
    pub fn file_name_from_id(id: &str) -> path::PathBuf {
        let mut p = path::PathBuf::from(id);
        p.set_extension("json");
        p
    }

    /// Create project data from a file
    pub fn from_file(path: &path::PathBuf) -> Result<ProjectData, Error> {
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

pub struct Project {
    /// Path of the project
    path: path::PathBuf,
    /// Project data
    data: ProjectData,
}

impl Project {
    pub fn new(project_dir: &path::Path, name: &str) -> Self {
        let mut path = project_dir.to_path_buf();
        path.push(ProjectData::file_name_from_project_name(name));
        Project {
            path,
            data: ProjectData::new(name),
        }
    }

    /// Create a new object from a project directory and project name
    /// NOTE:
    pub fn from_project_dir_and_name(project_dir: &path::Path, name: &str) -> Result<Self, Error> {
        let mut path = project_dir.to_path_buf();
        path.push(ProjectData::file_name_from_project_name(name));

        Ok(Project {
            path: path.clone(),
            data: ProjectData::from_file(&path)?,
        })
    }

    pub fn from_project_dir_and_id(project_dir: &path::Path, id: &str) -> Result<Self, Error> {
        let mut path = project_dir.to_path_buf();
        path.push(ProjectData::file_name_from_id(id));

        Ok(Project {
            path: path.clone(),
            data: ProjectData::from_file(&path)?,
        })
    }

    pub fn from_file(path: &path::PathBuf) -> Result<Project, Error> {
        Ok(Project {
            path: path.clone(),
            data: ProjectData::from_file(path)?,
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

    pub fn data(&self) -> &ProjectData {
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
pub struct ProjectMetadata {
    /// ID of the project
    id: String,
    /// Name of the project
    name: String,
    /// Last modified date
    last_modified_date: chrono::DateTime<chrono::Utc>,
    /// Number of nodes in the project
    num_nodes: usize,
    /// Number of edges in the project
    num_edges: usize,
}

impl TryFrom<Project> for ProjectMetadata {
    type Error = Error;

    fn try_from(p: Project) -> Result<Self, Error> {
        let accessed = p.file_metadata()?.accessed()?;
        Ok(ProjectMetadata {
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
            ProjectData::file_name_from_project_name("HELLO WORLD"),
            path::Path::new("hello-world.json")
        );
    }
}
