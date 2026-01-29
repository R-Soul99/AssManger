import { useState } from 'react';
import { projectService } from '@/application/services/ProjectService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProjectOpened: (path: string, name: string) => void;
}

export function OpenProjectDialog({ isOpen, onClose, onProjectOpened }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

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
      onProjectOpened(result.path, result.name);
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
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
  );
}
