import { useState, useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { localFileStorage } from '@/infrastructure/storage/LocalFileStorage';

interface UseFloorPlanImageResult {
  imageData: HTMLImageElement | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for loading floor plan images from Tauri file system.
 *
 * Converts relative file paths to absolute paths, then to valid Tauri URLs and loads the image.
 * Handles loading states and errors.
 *
 * @param imageRelativePath - Relative path to floor plan image (from FloorPlan entity)
 * @returns Object containing loaded image, loading state, and error state
 */
export function useFloorPlanImage(imageRelativePath: string | null | undefined): UseFloorPlanImageResult {
  const [imageData, setImageData] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Reset state when path changes
    setImageData(null);
    setError(null);

    // Handle empty path
    if (!imageRelativePath) {
      setLoading(false);
      setError('No image path provided');
      return;
    }

    setLoading(true);

    async function loadImage() {
      try {
        // Resolve absolute path first
        const absolutePath = await localFileStorage.getAbsolutePath(imageRelativePath!);

        if (cancelled) return;

        // Create new image element
        const img = new Image();
        imageRef.current = img;

        // Handle successful load
        const handleLoad = () => {
          if (!cancelled) {
            setImageData(img);
            setLoading(false);
            setError(null);
          }
        };

        // Handle load error
        const handleError = () => {
          if (!cancelled) {
            setImageData(null);
            setLoading(false);
            setError(`Failed to load image: ${imageRelativePath}`);
          }
        };

        // Attach event listeners
        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);

        // Convert absolute Tauri file path to valid src URL
        const imageSrc = convertFileSrc(absolutePath);
        img.src = imageSrc;
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          setError(`Invalid image path: ${imageRelativePath}`);
        }
      }
    }

    loadImage();

    // Cleanup function
    return () => {
      cancelled = true;
      imageRef.current = null;
    };
  }, [imageRelativePath]);

  return { imageData, loading, error };
}
