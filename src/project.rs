use crate::utils;
use serde::{Deserialize, Serialize};
use std::{fmt, fs, io, path};
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
        project_path.push(Project::file_name_from_project_name(name));

        if project_path.exists() {
            Project::from_file(&project_path)
        } else {
            let p = Project::new(name, None);
            match p.to_file(&project_path) {
                Ok(()) => Ok(p),
                Err(e) => Err(e),
            }
        }
    }

    /// Create a project with a name and store it in the project directory
    pub fn create_project(&self, name: &str, force: bool) -> Result<Project, Error> {
        let mut project_path = self.path.clone();
        project_path.push(Project::file_name_from_project_name(name));

        match !project_path.is_file() || force {
            true => {
                let p = Project::new(name, None);
                p.to_file(&project_path)?;
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
        let mut p = self.path.clone();
        p.push(Project::file_name_from_project_name(name));
        Project::from_file(&p)
    }

    /// Load a project from the project directory
    pub fn get_project_by_id(&self, id: &str) -> Result<Project, Error> {
        let mut p = self.path.clone();
        p.push(Project::file_name_from_id(id));
        Project::from_file(&p)
    }

    pub fn delete_project_by_id(&self, id: &str) -> Result<(), Error> {
        let mut p = self.path.clone();
        p.push(Project::file_name_from_id(id));
        fs::remove_file(p)?;
        Ok(())
    }

    /// Get an iterator over all projects in the project directory
    pub fn projects_iter(&self) -> Result<impl Iterator<Item = Project> + '_, Error> {
        let files_iter = fs::read_dir(self.path.clone())
            .map_err(|e| Error::Io(self.path.clone(), e))? // Handle error during initial read_dir
            .filter_map(|entry_result| {
                // Filter out non-files
                match entry_result {
                    Ok(entry) => {
                        let path = entry.path();
                        // Only consider files that might be JSON projects
                        // You might want to refine this to check for a .json extension
                        if path.is_file() {
                            match Project::from_file(&path) {
                                Ok(project) => Some(project),
                                Err(e) => {
                                    log::warn!("Error reading project from '{}'", e);
                                    None // Propagate error from previous filter_map
                                }
                            }
                        } else {
                            None // Skip directories or other non-file entries
                        }
                    }
                    Err(e) => {
                        // Ignore bad directory entries
                        log::warn!("Error reading directory entry {}", e);
                        None
                    }
                }
            });

        Ok(files_iter)
    }

    /// Save a project to the project directory
    pub fn save_project(&self, project: &Project) -> Result<(), Error> {
        let mut p = self.path.clone();
        p.push(Project::file_name_from_project_name(&project.name));
        project.to_file(&p)?;
        Ok(())
    }
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Project {
    /// Name of the project
    name: String,
    /// Some form of JSON to represent the state of the debug tree, this is managed by the frontend application
    zustand: Option<serde_json::Value>,
}

impl Project {
    pub fn new(name: &str, zustand: Option<serde_json::Value>) -> Self {
        Project {
            name: name.to_string(),
            zustand,
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

    /// Get the file name from the project name
    pub fn file_name_from_project_name(name: &str) -> path::PathBuf {
        Project::file_name_from_id(utils::to_kebab_case(name).as_str())
    }

    /// Get the file name from the project ID
    pub fn file_name_from_id(id: &str) -> path::PathBuf {
        let mut p = path::PathBuf::from(id);
        p.set_extension("json");
        p
    }

    /// Store the project to a file
    pub fn to_file(&self, path: &path::PathBuf) -> std::result::Result<(), Error> {
        let json_content = serde_json::to_string(self)?;
        std::fs::write(path, json_content)?;
        Ok(())
    }

    /// Create a project from a file
    pub fn from_file(path: &path::PathBuf) -> Result<Project, Error> {
        let file_content = std::fs::read_to_string(path)?;
        serde_json::from_str(&file_content).map_err(Error::Json)
    }
}

#[derive(Serialize, ToSchema)]
pub struct Metadata {
    id: String,
    name: String,
}

impl From<Project> for Metadata {
    fn from(project: Project) -> Self {
        Metadata {
            id: project.id(),
            name: project.name(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_name() {
        assert_eq!(
            Project::file_name_from_project_name("HELLO WORLD"),
            path::Path::new("hello-world.json")
        );
    }
}
