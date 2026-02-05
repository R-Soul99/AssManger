import { useState, useEffect } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';
import { localFileStorage } from '@/infrastructure/storage/LocalFileStorage';

/**
 * Hook to load floor plan image from relative path.
 * Returns object URL for use in <img src>.
 * Handles cleanup on unmount.
 */
export function useFloorPlanImage(relativePath: string | null): {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
} {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadImage() {
      if (!relativePath) {
        setImageUrl(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const absolutePath = await localFileStorage.getAbsolutePath(relativePath);
        const fileData = await readFile(absolutePath);
        const blob = new Blob([new Uint8Array(fileData)], { type: 'image/png' });
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setImageUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load image');
          setImageUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [relativePath]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return { imageUrl, loading, error };
}
