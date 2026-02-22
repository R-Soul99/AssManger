import { useState, useEffect } from 'react';
import { projectService } from '@/application/services/ProjectService';
import { RecentProject } from '@/application/dto/ProjectDto';

interface Props {
  onProjectSelect: (path: string) => void;
}

export function RecentProjectsList({ onProjectSelect }: Props) {
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [missingProject, setMissingProject] = useState<RecentProject | null>(null);

  const loadProjects = () => {
    setProjects(projectService.getRecentProjects());
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (projects.length === 0) {
    return (
      <div className="recent-projects-empty">
        <p>No recent projects</p>
      </div>
    );
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleProjectClick = async (project: RecentProject) => {
    // Check if file exists by attempting to open it
    const result = await projectService.openExistingProject(project.path);
    if (result.success) {
      onProjectSelect(project.path);
    } else {
      // File not found - show locate/remove dialog
      setMissingProject(project);
    }
  };

  const handleLocate = async () => {
    if (!missingProject) return;

    const selected = await projectService.showOpenDialog();
    if (selected) {
      // User selected a file - open it
      const result = await projectService.openExistingProject(selected);
      if (result.success) {
        // Remove old path and add new path
        projectService.removeFromRecentProjects(missingProject.path);
        onProjectSelect(selected);
        setMissingProject(null);
        loadProjects();
      }
    }
  };

  const handleRemove = () => {
    if (!missingProject) return;

    projectService.removeFromRecentProjects(missingProject.path);
    setMissingProject(null);
    loadProjects();
  };

  const handleCancelDialog = () => {
    setMissingProject(null);
  };

  return (
    <>
      <div className="recent-projects">
        <h3>Recent Projects</h3>
        <ul>
          {projects.map((project) => (
            <li key={project.path}>
              <button
                onClick={() => handleProjectClick(project)}
                className="recent-project-item"
              >
                <span className="project-name">{project.name}.assetmap</span>
                <span className="project-date">Opened {formatRelativeTime(project.lastOpened)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Missing file dialog */}
      {missingProject && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Project Not Found</h2>
            <p>
              The project file <strong>{missingProject.name}.assetmap</strong> could not be found.
              It may have been moved or deleted.
            </p>
            <p className="project-path">Expected location: {missingProject.path}</p>
            <div className="dialog-actions">
              <button onClick={handleCancelDialog}>Cancel</button>
              <button onClick={handleRemove}>Remove from List</button>
              <button onClick={handleLocate} className="primary">Locate File...</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
