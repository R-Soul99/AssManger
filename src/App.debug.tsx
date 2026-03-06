import { useState } from 'react';
import './App.css';

// Commenting out imports to isolate the issue
// import { CreateProjectDialog, OpenProjectDialog, RecentProjectsList } from '@/presentation/components/project';
// import { projectService } from '@/application/services/ProjectService';

console.log('[App.debug] Component loaded');

function App() {
  console.log('[App.debug] Component rendering');
  const [currentProject] = useState<{ path: string; name: string } | null>(null);

  // Simple welcome screen without the complex components
  if (!currentProject) {
    return (
      <div className="container">
        <h1>Visual Asset Mapper</h1>
        <div className="welcome-actions">
          <button onClick={() => console.log('Create clicked')} className="primary">
            Create New Project
          </button>
          <button onClick={() => console.log('Open clicked')}>
            Open Project
          </button>
        </div>
        <div className="recent-projects-empty">
          <p>No recent projects</p>
        </div>
      </div>
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
