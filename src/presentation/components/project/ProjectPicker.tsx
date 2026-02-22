import { useState } from 'react';
import { CreateProjectDialog } from './CreateProjectDialog';
import { OpenProjectDialog } from './OpenProjectDialog';
import { RecentProjectsList } from './RecentProjectsList';

interface Props {
  onDatabaseLoaded: (path: string) => void;
}

/**
 * Unified project picker component.
 * Displays when no database is currently loaded.
 * Provides three pathways: Create New, Open Existing, or select from Recent.
 */
export function ProjectPicker({ onDatabaseLoaded }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);

  const handleProjectCreated = (path: string) => {
    onDatabaseLoaded(path);
  };

  const handleProjectOpened = (path: string, _name: string) => {
    onDatabaseLoaded(path);
  };

  const handleRecentProjectSelected = (path: string) => {
    onDatabaseLoaded(path);
  };

  return (
    <>
      <div className="container">
        <h1>Visual Asset Mapper</h1>
        <div className="welcome-actions">
          <button onClick={() => setIsCreateOpen(true)} className="primary">
            Create New Database
          </button>
          <button onClick={() => setIsOpenDialogOpen(true)}>
            Open Database
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
