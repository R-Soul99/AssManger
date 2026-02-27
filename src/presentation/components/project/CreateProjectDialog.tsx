import { useState, useEffect } from 'react';
import { projectService } from '@/application/services/ProjectService';
import { CloudWarning } from '@/application/dto/ProjectDto';
import { CloudFolderWarningDialog } from './CloudFolderWarningDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (path: string) => void;
}

export function CreateProjectDialog({ isOpen, onClose, onProjectCreated }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cloudWarning, setCloudWarning] = useState<CloudWarning | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load default location
      projectService.getDefaultLocation().then(setLocation);
      setName('');
      setError(null);
      setCloudWarning(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBrowse = async () => {
    const selected = await projectService.showFolderDialog();
    if (selected) {
      setLocation(selected);
      setCloudWarning(null); // Reset warning for new location
    }
  };

  const handleCreate = async (ignoreWarning = false) => {
    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }
    if (!location.trim()) {
      setError('Please select a location.');
      return;
    }

    setIsCreating(true);
    setError(null);

    const result = await projectService.createNewProject({
      name: name.trim(),
      location: location.trim(),
      ignoreCloudWarning: ignoreWarning,
    });

    setIsCreating(false);

    if (result.success) {
      onProjectCreated(result.path);
      onClose();
    } else if ('cloudWarning' in result) {
      setCloudWarning(result.cloudWarning);
    } else {
      setError(result.error);
    }
  };

  const handleCloudWarningClose = () => {
    setCloudWarning(null);
  };

  const handleCloudWarningProceed = () => {
    setCloudWarning(null);
    handleCreate(true);
  };

  return (
    <>
      <div className="dialog-overlay">
        <div className="dialog">
          <h2>Create New Project</h2>

          {error && (
            <div className="error-message">{error}</div>
          )}

        <div className="form-group">
          <label htmlFor="project-name">Project Name</label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Asset Map"
            disabled={isCreating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="project-location">Location</label>
          <div className="input-with-button">
            <input
              id="project-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isCreating}
            />
            <button onClick={handleBrowse} disabled={isCreating}>
              Browse...
            </button>
          </div>
        </div>

        <div className="dialog-actions">
          <button onClick={onClose} disabled={isCreating}>
            Cancel
          </button>
          <button
            onClick={() => handleCreate(false)}
            disabled={isCreating}
            className="primary"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>

      {cloudWarning && (
        <CloudFolderWarningDialog
          open={!!cloudWarning}
          onClose={handleCloudWarningClose}
          onProceed={handleCloudWarningProceed}
          detectedProvider={cloudWarning.provider}
          detectedPath={location}
          recommendedPath={cloudWarning.recommendedLocation}
        />
      )}
    </>
  );
}
