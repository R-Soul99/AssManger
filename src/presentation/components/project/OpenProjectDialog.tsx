import { useState } from 'react';
import { projectService } from '@/application/services/ProjectService';
import { BackupPromptDialog } from './BackupPromptDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProjectOpened: (path: string, name: string) => void;
}

export function OpenProjectDialog({ isOpen, onClose, onProjectOpened }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  const [pendingProject, setPendingProject] = useState<{
    path: string;
    name: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleBrowse = async () => {
    const selected = await projectService.showOpenDialog();
    if (selected) {
      await handleOpen(selected);
    }
  };

  const handleOpen = async (path: string) => {
    setIsOpening(true);
    setError(null);

    const result = await projectService.openExistingProject(path);

    setIsOpening(false);

    if (result.success) {
      // Check if migrations are needed
      if (result.needsMigration) {
        setPendingProject({ path: result.path, name: result.name });
        setShowBackupPrompt(true);
      } else {
        onProjectOpened(result.path, result.name);
        onClose();
      }
    } else {
      setError(result.error);
    }
  };

  const handleBackupComplete = async () => {
    setShowBackupPrompt(false);
    await runMigrationsAndComplete();
  };

  const handleSkipBackup = async () => {
    setShowBackupPrompt(false);
    await runMigrationsAndComplete();
  };

  const handleBackupCancel = () => {
    setShowBackupPrompt(false);
    setPendingProject(null);
  };

  const runMigrationsAndComplete = async () => {
    if (!pendingProject) return;

    setIsOpening(true);
    const migrationResult = await projectService.runPendingMigrations();
    setIsOpening(false);

    if (migrationResult.success) {
      onProjectOpened(pendingProject.path, pendingProject.name);
      onClose();
      setPendingProject(null);
    } else {
      setError(`Migration failed: ${migrationResult.error}`);
      setPendingProject(null);
    }
  };

  return (
    <>
      <div className="dialog-overlay">
        <div className="dialog">
          <h2>Open Project</h2>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <p>Select an existing Asset Map database file to open.</p>

          <div className="dialog-actions">
            <button onClick={onClose} disabled={isOpening}>
              Cancel
            </button>
            <button
              onClick={handleBrowse}
              disabled={isOpening}
              className="primary"
            >
              {isOpening ? 'Opening...' : 'Browse...'}
            </button>
          </div>
        </div>
      </div>

      {pendingProject && (
        <BackupPromptDialog
          open={showBackupPrompt}
          databasePath={pendingProject.path}
          onBackupComplete={handleBackupComplete}
          onSkipBackup={handleSkipBackup}
          onCancel={handleBackupCancel}
        />
      )}
    </>
  );
}
