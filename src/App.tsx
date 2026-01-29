import { useState } from 'react';
import { CreateProjectDialog, OpenProjectDialog, RecentProjectsList } from '@/presentation/components/project';
import { projectService } from '@/application/services/ProjectService';

function App() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<{ path: string; name: string } | null>(null);

  const handleProjectCreated = (path: string) => {
    const name = path.split(/[/\\]/).pop()?.replace(/\.(assetmap|db|sqlite)$/i, '') || 'Project';
    setCurrentProject({ path, name });
  };

  const handleProjectOpened = (path: string, name: string) => {
    setCurrentProject({ path, name });
  };

  const handleRecentProjectSelected = async (path: string) => {
    const result = await projectService.openExistingProject(path);
    if (result.success) {
      setCurrentProject({ path: result.path, name: result.name });
    } else {
      // Error handling - could show a toast or inline error
      console.error(result.error);
    }
  };

  // Welcome screen when no project is open
  if (!currentProject) {
    return (
      <>
        <div className="container">
          <h1>Visual Asset Mapper</h1>
          <div className="welcome-actions">
            <button onClick={() => setIsCreateOpen(true)} className="primary">
              Create New Project
            </button>
            <button onClick={() => setIsOpenDialogOpen(true)}>
              Open Project
            </button>
          </div>
          <RecentProjectsList onProjectSelect={handleRecentProjectSelected} />
        </div>

        <CreateProjectDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
        <OpenProjectDialog
          isOpen={isOpenDialogOpen}
          onClose={() => setIsOpenDialogOpen(false)}
          onProjectOpened={handleProjectOpened}
        />
      </>
    );
  }

  // Main application view when project is open
  return (
    <div className="container">
      <h1>Visual Asset Mapper</h1>
      <p>Current Project: {currentProject.name}</p>
      <p className="project-path">{currentProject.path}</p>
      <p>Phase 1: Foundation & Database Setup</p>
    </div>
  );
}

export default App;
