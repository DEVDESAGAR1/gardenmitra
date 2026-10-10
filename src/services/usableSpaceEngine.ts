import {
  GardenSpace,
  SpaceLayout,
  UsableSpaceCalculation
} from '../types';
import { spaceMeasurementEngine } from './spaceMeasurementEngine';

export interface UsableSpaceOptions {
  minWalkwayWidthFt?: number; // default: 2.0 ft
}

/**
 * Usable Space Engine (Milestone 9)
 * Calculates floor space allocation and flags practical physical conflicts.
 * Clearly separates measured geometry from planning assumptions.
 */
export class UsableSpaceEngine {
  calculateUsableSpace(
    space: GardenSpace,
    options: UsableSpaceOptions = {}
  ): UsableSpaceCalculation {
    const minWalkwayWidth = options.minWalkwayWidthFt ?? 2.0;
    const assumptions: string[] = [];
    const warnings: string[] = [];

    // 1. Determine Floor Dimensions & Total Area
    const measurements = spaceMeasurementEngine.getMeasurementsForSpace(space);
    const widthM = measurements.find((m) => m.name.toLowerCase().includes('width'));
    const depthM = measurements.find((m) => m.name.toLowerCase().includes('depth') || m.name.toLowerCase().includes('length'));

    let widthFt = 6;
    let depthFt = 4;
    let isEstimate = true;

    if (widthM) {
      widthFt = spaceMeasurementEngine.convertLength(widthM.value, widthM.unit as any, 'ft');
      if (widthM.source === 'user_measured' || widthM.source === 'reference_calibrated') {
        isEstimate = false;
      }
    }
    if (depthM) {
      depthFt = spaceMeasurementEngine.convertLength(depthM.value, depthM.unit as any, 'ft');
      if (depthM.source === 'user_measured' || depthM.source === 'reference_calibrated') {
        isEstimate = false;
      }
    }

    const totalFloorAreaSqFt = Math.round(widthFt * depthFt * 10) / 10;

    if (isEstimate) {
      assumptions.push(
        `Total dimensions (${widthFt}ft × ${depthFt}ft) are approximate based on ${space.size.replace(/_/g, ' ')} space category.`
      );
    } else {
      assumptions.push(`Based on documented dimensions: ${widthFt}ft width × ${depthFt}ft depth.`);
    }

    // 2. Walkway Area Calculation
    // Central walkway traversing the depth of the space
    const safeWalkwayWidth = Math.min(minWalkwayWidth, widthFt * 0.45);
    const walkingAreaSqFt = Math.round(depthFt * safeWalkwayWidth * 10) / 10;
    assumptions.push(`Preserving a ${safeWalkwayWidth.toFixed(1)}ft access walkway along primary movement path.`);

    // 3. Permanent Obstacles / Clearance Area (e.g., entrance clearance, drainage)
    let obstacleAreaSqFt = 0;
    const layout: SpaceLayout | undefined = space.layout;

    if (layout) {
      const obstacleZones = layout.zones.filter(
        (z) => z.type === 'furniture_obstacle' || z.type === 'doorway_access'
      );
      obstacleAreaSqFt = Math.round(obstacleZones.length * 3.0 * 10) / 10; // ~3 sq ft per obstacle zone
    }

    // 4. Container Occupied Area
    let containerAreaSqFt = 0;
    const containers = layout?.containers || [];

    containers.forEach((c) => {
      // Small pot: ~0.8 sq ft; medium: ~1.5 sq ft; large/growbag: ~3.0 sq ft
      let potArea = 1.2;
      if (c.size === 'small') potArea = 0.8;
      else if (c.size === 'large') potArea = 2.8;
      containerAreaSqFt += potArea;
    });
    containerAreaSqFt = Math.round(containerAreaSqFt * 10) / 10;

    // 5. Usable Planting Area
    // Usable = Total - Walkway - Obstacles
    const rawUsable = totalFloorAreaSqFt - walkingAreaSqFt - obstacleAreaSqFt;
    const usablePlantingAreaSqFt = Math.max(0, Math.round(rawUsable * 10) / 10);

    // 6. Practical Safety Warnings & Conflict Checks
    if (usablePlantingAreaSqFt <= 0) {
      warnings.push('Walkway and permanent obstacles currently occupy the entire floor area. Consider vertical wall planters.');
    }

    if (containerAreaSqFt > usablePlantingAreaSqFt) {
      warnings.push(`Existing containers (${containerAreaSqFt} sq ft) exceed estimated perimeter planting area (${usablePlantingAreaSqFt} sq ft). Walkway access may be hindered.`);
    }

    if (space.type === 'balcony') {
      warnings.push('Railing planter load limit cannot be determined visually. Verify bracket strength before hanging heavy moist pots.');
    } else if (space.type === 'terrace' && containers.filter((c) => c.size === 'large').length >= 6) {
      warnings.push('High concentration of large wet containers on roof slab. Group pots along structural load-bearing beams or perimeter walls.');
    }

    const confidence = isEstimate
      ? 'rough_estimate'
      : (space.coverage && space.coverage.overallConfidence > 0.7)
      ? 'high'
      : 'moderate';

    return {
      spaceId: space.id,
      totalFloorAreaSqFt,
      usablePlantingAreaSqFt,
      walkingAreaSqFt,
      obstacleAreaSqFt,
      containerOccupiedAreaSqFt: containerAreaSqFt,
      unit: 'sq_ft',
      confidence,
      assumptions,
      warnings
    };
  }
}

export const usableSpaceEngine = new UsableSpaceEngine();
