import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography } from '@mui/material';
import { ProjectPicker } from '@/presentation/components/project';
import { projectService } from '@/application/services/ProjectService';
import { AppShell, CanvasPlaceholder, DetailsPanel, BottomToolbar } from '@/presentation/components/layout';
import './App.css';

const theme = createTheme();

console.log('[App] Component loaded');

function App() {
  console.log('[App] Component rendering');
  const [currentDatabasePath, setCurrentDatabasePath] = useState<string | null>(null);

  // Auto-restore: re-enter the most recent project on mount (survives page refresh)
  // Skip auto-restore if migrations are needed (user must go through manual open flow with backup prompt)
  useEffect(() => {
    const recent = projectService.getRecentProjects();
    if (recent.length === 0) return;
    const last = recent[0];
    projectService.openExistingProject(last.path).then(result => {
      if (result.success && !result.needsMigration) {
        // Only auto-restore if no migrations needed
        setCurrentDatabasePath(result.path);
      }
      // If migrations needed, user must manually open via ProjectPicker (triggers backup prompt)
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

  // Main application view when project is open
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell
        leftPanel={
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Location tree coming in 02-02
            </Typography>
          </Box>
        }
        centerPanel={<CanvasPlaceholder selectedLocationId={null} />}
        rightPanel={<DetailsPanel state={{ type: 'empty' }} />}
        toolbar={<BottomToolbar />}
      />
    </ThemeProvider>
  );
}

export default App;
