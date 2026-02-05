import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { basename, join } from '@tauri-apps/api/path';
import { localFileStorage } from '@/infrastructure/storage/LocalFileStorage';

const MAX_DIMENSION = 4096;

export interface ImagePickResult {
  data: Uint8Array;
  fileName: string;
}

export interface ConvertedImage {
  blob: Blob;
  width: number;
  height: number;
  outputName: string;
  previewUrl: string; // Object URL for preview
}

/**
 * Open file picker for floor plan images.
 * Returns null if user cancels.
 */
export async function pickFloorPlanImage(): Promise<ImagePickResult | null> {
  const filePath = await open({
    multiple: false,
    filters: [{
      name: 'Floor Plan Images',
      extensions: ['png', 'jpeg', 'jpg', 'bmp', 'tif', 'tiff'],
    }],
  });

  if (!filePath) return null;

  const data = await readFile(filePath as string);
  const fileName = await basename(filePath as string);

  return { data: new Uint8Array(data), fileName };
}

/**
 * Load image data, decode via canvas (or tiff.js for TIFF),
 * resize if needed, convert to PNG, return blob + metadata.
 */
export async function loadAndConvertImage(
  fileData: Uint8Array,
  fileName: string
): Promise<ConvertedImage> {
  const lowerName = fileName.toLowerCase();
  let imageBitmap: ImageBitmap;

  if (lowerName.endsWith('.tif') || lowerName.endsWith('.tiff')) {
    // TIFF: decode via tiff.js
    const { decode } = await import('tiff.js');
    // Convert Uint8Array.buffer to ArrayBuffer for tiff.js
    const arrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength) as ArrayBuffer;
    const decoded = decode(arrayBuffer);
    // decoded[0] is the first page with width, height, data (RGBA Uint8Array)
    const page = decoded[0];
    const canvas = document.createElement('canvas');
    canvas.width = page.width;
    canvas.height = page.height;
    const ctx = canvas.getContext('2d')!;
    const imageData = new ImageData(
      new Uint8ClampedArray(page.data),
      page.width,
      page.height
    );
    ctx.putImageData(imageData, 0, 0);
    imageBitmap = await createImageBitmap(canvas);
  } else {
    // PNG, JPEG, BMP: browser decodes natively
    const mimeType = getMimeType(lowerName);
    const arrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: mimeType });
    imageBitmap = await createImageBitmap(blob);
  }

  // Resize if needed (maintain aspect ratio)
  let drawWidth = imageBitmap.width;
  let drawHeight = imageBitmap.height;
  if (drawWidth > MAX_DIMENSION || drawHeight > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / drawWidth, MAX_DIMENSION / drawHeight);
    drawWidth = Math.round(drawWidth * scale);
    drawHeight = Math.round(drawHeight * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = drawWidth;
  canvas.height = drawHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageBitmap, 0, 0, drawWidth, drawHeight);

  // Convert to PNG blob
  const outputBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });

  // Derive output filename (replace extension with .png)
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const outputName = `${baseName}.png`;

  // Create preview URL
  const previewUrl = URL.createObjectURL(outputBlob);

  return {
    blob: outputBlob,
    width: drawWidth,
    height: drawHeight,
    outputName,
    previewUrl,
  };
}

/**
 * Save converted PNG to floor_plans directory.
 * Returns relative path for database storage.
 */
export async function saveConvertedImage(
  blob: Blob,
  outputName: string
): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  const floorPlansDir = await localFileStorage.getFloorPlansDirectory();

  // Generate unique name if collision exists
  const uniqueName = await generateUniqueName(floorPlansDir, outputName);
  const targetPath = await join(floorPlansDir, uniqueName);

  await writeFile(targetPath, uint8);

  return `floor_plans/${uniqueName}`;
}

async function generateUniqueName(dir: string, fileName: string): Promise<string> {
  const { exists } = await import('@tauri-apps/plugin-fs');

  let candidate = fileName;
  let counter = 1;

  while (await exists(await join(dir, candidate))) {
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'png';
    const base = fileName.replace(/\.[^.]+$/, '');
    candidate = `${base}_${counter}.${ext}`;
    counter++;
  }

  return candidate;
}

function getMimeType(fileName: string): string {
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg';
  if (fileName.endsWith('.bmp')) return 'image/bmp';
  return 'application/octet-stream';
}
