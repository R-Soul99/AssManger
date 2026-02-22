import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ProjectPicker } from '@/presentation/components/project';
import { projectService } from '@/application/services/ProjectService';
import CategoryManager from '@/presentation/components/category/CategoryManager';
import LocationManager from '@/presentation/components/location/LocationManager';
import { AssetList } from '@/presentation/components/asset';
import { FloorPlanList } from '@/presentation/components/floorplan';
import './App.css';

const theme = createTheme();

console.log('[App] Component loaded');

function App() {
  console.log('[App] Component rendering');
  const [currentDatabasePath, setCurrentDatabasePath] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showFloorPlans, setShowFloorPlans] = useState(false);

  // Auto-restore: re-enter the most recent project on mount (survives page refresh)
  useEffect(() => {
    const recent = projectService.getRecentProjects();
    if (recent.length === 0) return;
    const last = recent[0];
    projectService.openExistingProject(last.path).then(result => {
      if (result.success) {
        setCurrentDatabasePath(result.path);
      }
    });
  }, []);

  const handleDatabaseLoaded = (path: string) => {
    setCurrentDatabasePath(path);
  };

  // Welcome screen when no project is open
  if (!currentDatabasePath) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ProjectPicker onDatabaseLoaded={handleDatabaseLoaded} />
      </ThemeProvider>
    );
  }

  // Extract project name from path
  const projectName = currentDatabasePath.split(/[/\\]/).pop()?.replace(/\.(assetmap|db|sqlite)$/i, '') || 'Project';

  // Main application view when project is open
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="container">
        <h1>Visual Asset Mapper</h1>
        <p>Current Project: {projectName}</p>
        <p className="project-path">{currentDatabasePath}</p>
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
          <button onClick={() => setShowFloorPlans(!showFloorPlans)}>
            {showFloorPlans ? 'Hide Floor Plans' : 'Manage Floor Plans'}
          </button>
        </div>
        {showAssets && <AssetList />}
        {showCategories && <CategoryManager />}
        {showLocations && <LocationManager />}
        {showFloorPlans && <FloorPlanList />}
      </div>
    </ThemeProvider>
  );
}

export default App;
