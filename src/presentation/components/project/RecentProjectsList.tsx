import { useState, useEffect } from 'react';
import { projectService } from '@/application/services/ProjectService';
import { RecentProject } from '@/application/dto/ProjectDto';

interface Props {
  onProjectSelect: (path: string) => void;
}

export function RecentProjectsList({ onProjectSelect }: Props) {
  const [projects, setProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    setProjects(projectService.getRecentProjects());
  }, []);

  if (projects.length === 0) {
    return (
      <div className="recent-projects-empty">
        <p>No recent projects</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="recent-projects">
      <h3>Recent Projects</h3>
      <ul>
        {projects.map((project) => (
          <li key={project.path}>
            <button
              onClick={() => onProjectSelect(project.path)}
              className="recent-project-item"
            >
              <span className="project-name">{project.name}</span>
              <span className="project-date">{formatDate(project.lastOpened)}</span>
              <span className="project-path">{project.path}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
