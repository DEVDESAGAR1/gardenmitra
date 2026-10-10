import {
  GardenSpace,
  SpaceMeasurement
} from '../types';

/**
 * Space Measurement Engine (Milestone 9)
 * Handles physical measurements, scale references, and precise unit conversions.
 * Never fabricates precision or assumes standard tile sizes.
 */
export class SpaceMeasurementEngine {
  /**
   * Length conversion helper
   */
  convertLength(value: number, from: 'm' | 'cm' | 'ft', to: 'm' | 'cm' | 'ft'): number {
    if (from === to) return value;

    // Convert from -> meters
    let inMeters = value;
    if (from === 'cm') inMeters = value / 100;
    else if (from === 'ft') inMeters = value * 0.3048;

    // Convert meters -> to
    if (to === 'm') return Math.round(inMeters * 100) / 100;
    if (to === 'cm') return Math.round(inMeters * 100 * 10) / 10;
    if (to === 'ft') return Math.round((inMeters / 0.3048) * 100) / 100;
    return value;
  }

  /**
   * Area conversion helper
   */
  convertArea(value: number, from: 'm2' | 'ft2', to: 'm2' | 'ft2'): number {
    if (from === to) return value;
    if (from === 'm2' && to === 'ft2') return Math.round(value * 10.7639 * 10) / 10;
    if (from === 'ft2' && to === 'm2') return Math.round((value / 10.7639) * 100) / 100;
    return value;
  }

  /**
   * Derives default measurements from space setup dimensions or existing measurements
   */
  getMeasurementsForSpace(space: GardenSpace): SpaceMeasurement[] {
    const existing = space.measurements || [];
    if (existing.length > 0) return existing;

    const defaultMeasurements: SpaceMeasurement[] = [];

    // Check if space has user dimensions from setup wizard
    if (space.dimensions?.width) {
      const widthNum = parseFloat(space.dimensions.width);
      if (!isNaN(widthNum) && widthNum > 0) {
        defaultMeasurements.push({
          id: `m-width-${space.id}`,
          spaceId: space.id,
          name: 'Space Width',
          value: widthNum,
          unit: space.dimensions.unit === 'm' ? 'm' : 'ft',
          source: 'user_measured',
          confidence: 0.95,
          createdAt: space.createdAt || new Date().toISOString(),
          notes: 'Configured during space setup'
        });
      }
    }

    if (space.dimensions?.length) {
      const lengthNum = parseFloat(space.dimensions.length);
      if (!isNaN(lengthNum) && lengthNum > 0) {
        defaultMeasurements.push({
          id: `m-length-${space.id}`,
          spaceId: space.id,
          name: 'Space Depth / Length',
          value: lengthNum,
          unit: space.dimensions.unit === 'm' ? 'm' : 'ft',
          source: 'user_measured',
          confidence: 0.95,
          createdAt: space.createdAt || new Date().toISOString(),
          notes: 'Configured during space setup'
        });
      }
    }

    // If no dimensions are configured, provide size-bracket estimate with clear visual_estimate source
    if (defaultMeasurements.length === 0) {
      const sizeEstimates: Record<string, { w: number; d: number }> = {
        very_small: { w: 4, d: 3 },
        small: { w: 6, d: 4 },
        medium: { w: 10, d: 6 },
        large: { w: 16, d: 10 }
      };
      const est = sizeEstimates[space.size] || { w: 6, d: 4 };

      defaultMeasurements.push(
        {
          id: `m-est-w-${space.id}`,
          spaceId: space.id,
          name: 'Estimated Width',
          value: est.w,
          unit: 'ft',
          source: 'visual_estimate',
          confidence: 0.45,
          createdAt: new Date().toISOString(),
          notes: `Planning assumption based on ${space.size.replace(/_/g, ' ')} space category`
        },
        {
          id: `m-est-d-${space.id}`,
          spaceId: space.id,
          name: 'Estimated Depth',
          value: est.d,
          unit: 'ft',
          source: 'visual_estimate',
          confidence: 0.45,
          createdAt: new Date().toISOString(),
          notes: `Planning assumption based on ${space.size.replace(/_/g, ' ')} space category`
        }
      );
    }

    return defaultMeasurements;
  }

  /**
   * Helper to calibrate a space dimension using a known tile size
   * (e.g., "5 tiles wide" x "60cm tile")
   */
  calibrateFromTiles(
    spaceId: string,
    tileCount: number,
    tileSizeCm: number,
    dimensionName: string
  ): SpaceMeasurement {
    const totalCm = tileCount * tileSizeCm;
    const valueFt = Math.round((totalCm / 30.48) * 10) / 10;

    return {
      id: `m-tile-calib-${Date.now()}`,
      spaceId,
      name: dimensionName,
      value: valueFt,
      unit: 'ft',
      source: 'reference_calibrated',
      confidence: 0.85,
      createdAt: new Date().toISOString(),
      notes: `Calibrated from ${tileCount} floor tiles of ${tileSizeCm} cm each`
    };
  }

  /**
   * Validate measurement input defensively
   */
  validateMeasurement(name: string, value: number, unit: 'm' | 'cm' | 'ft'): { valid: boolean; error?: string } {
    if (!name.trim()) return { valid: false, error: 'Measurement name is required.' };
    if (isNaN(value) || value <= 0) return { valid: false, error: 'Value must be a positive number.' };
    if (unit === 'ft' && value > 150) return { valid: false, error: 'Value exceeds reasonable residential garden dimension.' };
    if (unit === 'm' && value > 50) return { valid: false, error: 'Value exceeds reasonable residential garden dimension.' };
    return { valid: true };
  }
}

export const spaceMeasurementEngine = new SpaceMeasurementEngine();
