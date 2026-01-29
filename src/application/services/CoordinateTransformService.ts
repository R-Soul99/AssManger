/**
 * Service for transforming between normalized coordinates (0.0-1.0)
 * and pixel coordinates for rendering.
 *
 * Per CONTEXT.md:
 * - Silently clamp coordinates to 0.0-1.0 range
 * - Round to nearest integer pixel when converting to pixels
 */
export interface Point {
  x: number;
  y: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export class CoordinateTransformService {
  /**
   * Convert normalized coordinates (0.0-1.0) to pixel coordinates.
   * Pixels are rounded to nearest integer per CONTEXT.md.
   */
  normalizedToPixel(
    normalized: Point,
    dimensions: ImageDimensions
  ): Point {
    return {
      x: Math.round(normalized.x * dimensions.width),
      y: Math.round(normalized.y * dimensions.height),
    };
  }

  /**
   * Convert pixel coordinates to normalized coordinates (0.0-1.0).
   * Used when user places marker on floor plan.
   */
  pixelToNormalized(
    pixel: Point,
    dimensions: ImageDimensions
  ): Point {
    return {
      x: pixel.x / dimensions.width,
      y: pixel.y / dimensions.height,
    };
  }

  /**
   * Clamp normalized coordinates to valid 0.0-1.0 range.
   * Per CONTEXT.md: silently clamp if slightly outside range.
   */
  clampNormalized(point: Point): Point {
    return {
      x: Math.max(0, Math.min(1, point.x)),
      y: Math.max(0, Math.min(1, point.y)),
    };
  }

  /**
   * Check if normalized coordinates are within valid range.
   * Does NOT include clamping tolerance - use for strict validation.
   */
  isValidNormalized(point: Point): boolean {
    return (
      point.x >= 0 && point.x <= 1 &&
      point.y >= 0 && point.y <= 1
    );
  }

  /**
   * Calculate distance between two normalized points.
   * Returns normalized distance (0.0-sqrt(2) range).
   */
  normalizedDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate real-world distance using calibration scale.
   * @param point1 First point in normalized coordinates
   * @param point2 Second point in normalized coordinates
   * @param dimensions Image dimensions for pixel calculation
   * @param scale Calibration scale (real-world units per pixel)
   * @returns Distance in real-world units
   */
  calculateRealWorldDistance(
    point1: Point,
    point2: Point,
    dimensions: ImageDimensions,
    scale: number
  ): number {
    // Convert to pixels first
    const pixel1 = this.normalizedToPixel(point1, dimensions);
    const pixel2 = this.normalizedToPixel(point2, dimensions);

    // Calculate pixel distance
    const dx = pixel2.x - pixel1.x;
    const dy = pixel2.y - pixel1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    // Apply scale
    return pixelDistance * scale;
  }
}

// Export singleton instance for convenience
export const coordinateTransformService = new CoordinateTransformService();
