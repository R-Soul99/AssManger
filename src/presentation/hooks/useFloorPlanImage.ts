import { useState, useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface UseFloorPlanImageResult {
  imageData: HTMLImageElement | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for loading floor plan images from Tauri file system.
 *
 * Converts relative file paths to valid Tauri URLs and loads the image.
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

    // Create new image element
    const img = new Image();
    imageRef.current = img;

    // Handle successful load
    const handleLoad = () => {
      setImageData(img);
      setLoading(false);
      setError(null);
    };

    // Handle load error
    const handleError = () => {
      setImageData(null);
      setLoading(false);
      setError(`Failed to load image: ${imageRelativePath}`);
    };

    // Attach event listeners
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // Convert Tauri file path to valid src URL
    try {
      const imageSrc = convertFileSrc(imageRelativePath);
      img.src = imageSrc;
    } catch (err) {
      setLoading(false);
      setError(`Invalid image path: ${imageRelativePath}`);
    }

    // Cleanup function
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      imageRef.current = null;
    };
  }, [imageRelativePath]);

  return { imageData, loading, error };
}
