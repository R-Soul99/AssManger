import { useState, useEffect, useRef } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';
import { localFileStorage } from '@/infrastructure/storage/LocalFileStorage';

interface UseFloorPlanImageResult {
  imageData: HTMLImageElement | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for loading floor plan images from Tauri file system.
 *
 * Reads the file using Tauri's readFile API and creates an object URL.
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
  const objectUrlRef = useRef<string | null>(null);

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

        // Read file as bytes
        const fileData = await readFile(absolutePath);

        if (cancelled) return;

        // Detect MIME type from file extension
        const extension = imageRelativePath!.toLowerCase().split('.').pop();
        let mimeType = 'image/png'; // default
        if (extension === 'jpg' || extension === 'jpeg') {
          mimeType = 'image/jpeg';
        } else if (extension === 'png') {
          mimeType = 'image/png';
        } else if (extension === 'bmp') {
          mimeType = 'image/bmp';
        } else if (extension === 'tiff' || extension === 'tif') {
          mimeType = 'image/tiff';
        }

        // Create blob and object URL
        const blob = new Blob([new Uint8Array(fileData)], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

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

        // Set object URL as source
        img.src = objectUrl;
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          setError(err instanceof Error ? err.message : `Failed to load image: ${imageRelativePath}`);
        }
      }
    }

    loadImage();

    // Cleanup function
    return () => {
      cancelled = true;
      imageRef.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [imageRelativePath]);

  return { imageData, loading, error };
}
