declare module 'tiff.js' {
  export interface TiffPage {
    width: number;
    height: number;
    data: Uint8Array;
  }

  export function decode(buffer: ArrayBuffer): TiffPage[];
}
