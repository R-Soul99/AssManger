import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { CreateProjectDialog, OpenProjectDialog, RecentProjectsList } from '@/presentation/components/project';
import { projectService } from '@/application/services/ProjectService';
import CategoryManager from '@/presentation/components/category/CategoryManager';
import LocationManager from '@/presentation/components/location/LocationManager';
import { AssetList } from '@/presentation/components/asset';
import './App.css';

const theme = createTheme();

console.log('[App] Component loaded');

function App() {
  console.log('[App] Component rendering');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<{ path: string; name: string } | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showAssets, setShowAssets] = useState(false);

  // Auto-restore: re-enter the most recent project on mount (survives page refresh)
  useEffect(() => {
    const recent = projectService.getRecentProjects();
    if (recent.length === 0) return;
    const last = recent[0];
    projectService.openExistingProject(last.path).then(result => {
      if (result.success) {
        setCurrentProject({ path: result.path, name: result.name });
      }
    });
  }, []);

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
      </ThemeProvider>
    );
  }

  // Main application view when project is open
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="container">
        <h1>Visual Asset Mapper</h1>
        <p>Current Project: {currentProject.name}</p>
        <p className="project-path">{currentProject.path}</p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowAssets(!showAssets)}>
            {showAssets ? 'Hide Assets' : 'Manage Assets'}
          </button>
          <button onClick={() => setShowCategories(!showCategories)}>
            {showCategories ? 'Hide Categories' : 'Manage Categories'}
          </button>
          <button onClick={() => setShowLocations(!showLocations)}>
            {showLocations ? 'Hide Locations' : 'Manage Locations'}
          </button>
        </div>
        {showAssets && <AssetList />}
        {showCategories && <CategoryManager />}
        {showLocations && <LocationManager />}
      </div>
    </ThemeProvider>
  );
}

export default App;
