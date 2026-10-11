import {
  GardenSpace,
  GardenPlant,
  SunlightZone,
  SpaceLayout,
  UserConfirmableObservation,
  SpaceMeasurement,
  SpaceCaptureCoverage,
  GardenDigitalTwin
} from '../types';
import { sunlightEstimationEngine } from './sunlightEstimationEngine';
import { spaceMeasurementEngine } from './spaceMeasurementEngine';
import { captureCoverageEngine } from './captureCoverageEngine';
import { digitalTwinRecommendationEngine } from './digitalTwinRecommendationEngine';
import { gardenMemoryEngine } from './gardenMemoryEngine';

/**
 * Normalizes a stored or migrated GardenSpace ensuring backward compatibility
 * across all M1 through M17 data models (coverage, digitalTwin, sunlightZones, plant instances).
 */
export function normalizeGardenSpace(sp: GardenSpace): GardenSpace {
  const sunlightProfile =
    sp.sunlightProfile ||
    sunlightEstimationEngine.createInitialProfile(sp.sunlight || '2_to_4h', sp.type || 'balcony');

  const sunlightZones: SunlightZone[] =
    sp.sunlightZones && sp.sunlightZones.length > 0
      ? sp.sunlightZones
      : [
          {
            id: `sz-sunny-${sp.id}`,
            spaceId: sp.id,
            name: 'Sunny Zone',
            type: 'sunny',
            description: 'Direct sunlight area'
          },
          {
            id: `sz-partial-${sp.id}`,
            spaceId: sp.id,
            name: 'Partial Shade',
            type: 'partial_shade',
            description: 'Filtered light area'
          }
        ];

  const layout: SpaceLayout =
    sp.layout || {
      width: sp.dimensions?.width,
      depth: sp.dimensions?.length,
      unit: sp.dimensions?.unit || 'ft',
      zones: [
        {
          id: `zone-sunny-${sp.id}`,
          spaceId: sp.id,
          name: 'Sunny Area',
          type: 'sunny_area',
          sunlightZoneId: sunlightZones[0]?.id
        },
        {
          id: `zone-shade-${sp.id}`,
          spaceId: sp.id,
          name: 'Filtered Shade',
          type: 'shaded_area',
          sunlightZoneId: sunlightZones[1]?.id
        },
        {
          id: `zone-walkway-${sp.id}`,
          spaceId: sp.id,
          name: '2ft Central Walkway',
          type: 'walkway',
          isWalkway: true
        }
      ],
      containers: [],
      plantPlacements: [],
      updatedAt: new Date().toISOString()
    };

  const userObservations: UserConfirmableObservation[] = Array.isArray(sp.userObservations)
    ? sp.userObservations
    : [];

  const measurements: SpaceMeasurement[] =
    Array.isArray(sp.measurements) && sp.measurements.length > 0
      ? sp.measurements
      : spaceMeasurementEngine.getMeasurementsForSpace(sp);

  const coverage: SpaceCaptureCoverage =
    sp.coverage ||
    captureCoverageEngine.evaluateCoverage({
      ...sp,
      measurements,
      userObservations
    });

  const digitalTwin: GardenDigitalTwin =
    sp.digitalTwin ||
    digitalTwinRecommendationEngine.getOrCreateDigitalTwin({
      ...sp,
      layout,
      measurements,
      userObservations,
      coverage
    });

  return {
    ...sp,
    plants: (sp.plants || []).map((gp: GardenPlant, idx: number) => {
      const normalized = gardenMemoryEngine.normalizePlantInstance(gp, sp.id, idx);
      return {
        ...normalized,
        careHistory: Array.isArray(gp.careHistory) ? gp.careHistory : [],
        wateringCount: typeof gp.wateringCount === 'number' ? gp.wateringCount : 0
      };
    }),
    photos: Array.isArray(sp.photos) ? sp.photos : [],
    mediaAssets: Array.isArray(sp.mediaAssets) ? sp.mediaAssets : [],
    captureSessions: Array.isArray(sp.captureSessions) ? sp.captureSessions : [],
    isSheltered: sp.isSheltered !== undefined ? sp.isSheltered : (sp.type === 'indoor' || sp.type === 'windowsill'),
    sunlightProfile,
    sunlightZones,
    layout,
    measurements,
    userObservations,
    coverage,
    digitalTwin
  };
}
