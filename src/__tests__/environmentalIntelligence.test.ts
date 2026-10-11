import { describe, it, expect } from 'vitest';
import {
  validateEnvironmentalObservation,
  convertLuxToApproximatePpfd
} from '../services/environmentalValidation';
import { EnvironmentalService } from '../services/environmentalService';
import {
  EnvironmentalObservation,
  GardenPlant,
  SensorDevice
} from '../types';
import { PLANT_CATALOG } from '../data/plants';

describe('Milestone 13: Physical Environmental Validation', () => {
  it('validates legitimate physical environmental observations across all supported types', () => {
    const validAirTemp = validateEnvironmentalObservation({
      spaceId: 'space-balcony-1',
      type: 'air_temperature',
      value: 29.5,
      unit: '°C',
      timestamp: new Date().toISOString(),
      source: 'manual'
    });
    expect(validAirTemp.isValid).toBe(true);
    expect(validAirTemp.quality).toBe('valid');
    expect(validAirTemp.errors.length).toBe(0);

    const validSoilMoisture = validateEnvironmentalObservation({
      spaceId: 'space-balcony-1',
      type: 'soil_moisture',
      value: 45,
      unit: '%',
      timestamp: new Date().toISOString(),
      source: 'connected_sensor'
    });
    expect(validSoilMoisture.isValid).toBe(true);

    const validLight = validateEnvironmentalObservation({
      spaceId: 'space-balcony-1',
      type: 'ambient_light',
      value: 45000,
      unit: 'lux',
      timestamp: new Date().toISOString(),
      source: 'manual'
    });
    expect(validLight.isValid).toBe(true);
  });

  it('rejects non-finite values (NaN, Infinity) and physically impossible ranges', () => {
    const nanCheck = validateEnvironmentalObservation({
      spaceId: 'space-1',
      type: 'air_temperature',
      value: NaN,
      unit: '°C',
      timestamp: new Date().toISOString(),
      source: 'manual'
    });
    expect(nanCheck.isValid).toBe(false);
    expect(nanCheck.errors.some((e) => e.includes('finite'))).toBe(true);

    const impossibleHeat = validateEnvironmentalObservation({
      spaceId: 'space-1',
      type: 'air_temperature',
      value: 120, // 120°C is impossible on balcony
      unit: '°C',
      timestamp: new Date().toISOString(),
      source: 'manual'
    });
    expect(impossibleHeat.isValid).toBe(false);
    expect(impossibleHeat.errors.some((e) => e.includes('physically possible'))).toBe(true);

    const impossibleHumidity = validateEnvironmentalObservation({
      spaceId: 'space-1',
      type: 'relative_humidity',
      value: 150, // > 100%
      unit: '%',
      timestamp: new Date().toISOString(),
      source: 'manual'
    });
    expect(impossibleHumidity.isValid).toBe(false);
  });

  it('rejects invalid timestamps and timestamps in the future', () => {
    const badDate = validateEnvironmentalObservation({
      spaceId: 'space-1',
      type: 'air_temperature',
      value: 25,
      unit: '°C',
      timestamp: 'not-a-valid-iso-date',
      source: 'manual'
    });
    expect(badDate.isValid).toBe(false);
    expect(badDate.errors.some((e) => e.includes('timestamp format'))).toBe(true);

    const futureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const futureCheck = validateEnvironmentalObservation({
      spaceId: 'space-1',
      type: 'air_temperature',
      value: 25,
      unit: '°C',
      timestamp: futureDate,
      source: 'manual'
    });
    expect(futureCheck.isValid).toBe(false);
    expect(futureCheck.errors.some((e) => e.includes('future'))).toBe(true);
  });

  it('verifies explicit units and approximate PPFD conversion with honest approximation flag', () => {
    const wrongUnit = validateEnvironmentalObservation({
      spaceId: 'space-1',
      type: 'soil_moisture',
      value: 50,
      unit: '°C', // soil moisture cannot be °C
      timestamp: new Date().toISOString(),
      source: 'manual'
    });
    expect(wrongUnit.isValid).toBe(false);
    expect(wrongUnit.errors.some((e) => e.includes('Invalid unit'))).toBe(true);

    const converted = convertLuxToApproximatePpfd(50000);
    expect(converted.ppfd).toBeGreaterThan(0);
    expect(converted.isApproximation).toBe(true);
  });
});

describe('Milestone 13: Environmental Service Ingestion & Deduplication', () => {
  const service = new EnvironmentalService();

  it('ingests valid observations and rejects rapid duplicates within 30 seconds', () => {
    const existing: EnvironmentalObservation[] = [];
    const nowIso = new Date().toISOString();

    const first = service.ingestObservation(existing, {
      spaceId: 'space-balcony',
      type: 'air_temperature',
      value: 30,
      unit: '°C',
      timestamp: nowIso,
      source: 'manual'
    });
    expect(first.success).toBe(true);
    expect(first.observation).toBeDefined();

    existing.push(first.observation!);

    // Duplicate check: identical space, type, value, and timestamp
    const duplicate = service.ingestObservation(existing, {
      spaceId: 'space-balcony',
      type: 'air_temperature',
      value: 30,
      unit: '°C',
      timestamp: nowIso,
      source: 'manual'
    });
    expect(duplicate.success).toBe(false);
    expect(duplicate.errors?.[0]).toContain('Duplicate observation detected');
  });

  it('registers sensor devices and detects duplicate device names in the same space', () => {
    const devices: SensorDevice[] = [];
    const firstDev = service.registerDevice(devices, {
      name: 'Balcony Soil Probe 1',
      type: 'soil_sensor',
      spaceId: 'space-balcony',
      supportedTypes: ['soil_moisture']
    });
    expect(firstDev.success).toBe(true);
    devices.push(firstDev.device!);

    const dupDev = service.registerDevice(devices, {
      name: 'Balcony Soil Probe 1',
      type: 'soil_sensor',
      spaceId: 'space-balcony',
      supportedTypes: ['soil_moisture']
    });
    expect(dupDev.success).toBe(false);
    expect(dupDev.error).toContain('already exists in this space');
  });

  it('computes statistical summaries and marks stale data if older than 24 hours', () => {
    const now = Date.now();
    const staleTime = new Date(now - 30 * 3600 * 1000).toISOString(); // 30h ago

    const staleObs: EnvironmentalObservation[] = [
      {
        id: 'obs-old-1',
        spaceId: 'space-1',
        type: 'air_temperature',
        value: 26,
        unit: '°C',
        timestamp: staleTime,
        source: 'manual',
        dataQuality: 'valid'
      },
      {
        id: 'obs-old-2',
        spaceId: 'space-1',
        type: 'air_temperature',
        value: 32,
        unit: '°C',
        timestamp: staleTime,
        source: 'manual',
        dataQuality: 'valid'
      }
    ];

    const summary = service.calculateSummary(staleObs, 'air_temperature', 'space-1');
    expect(summary).not.toBeNull();
    expect(summary!.min).toBe(26);
    expect(summary!.max).toBe(32);
    expect(summary!.avg).toBe(29);
    expect(summary!.isStale).toBe(true);
  });
});

describe('Milestone 13: Plant Requirement Comparisons & Explainable Insights', () => {
  const service = new EnvironmentalService();

  const tomatoPlant = PLANT_CATALOG.find((p) => p.id === 'cherry-tomato') || PLANT_CATALOG[0];

  const mockGardenPlant: GardenPlant = {
    plantId: tomatoPlant.id,
    plant: tomatoPlant,
    addedAt: new Date().toISOString(),
    status: 'planted',
    instanceId: 'inst-tomato-test-1',
    spaceId: 'space-test-1'
  };

  it('generates heat stress alert when measured temperature exceeds documented plant tolerance', () => {
    const observations: EnvironmentalObservation[] = [
      {
        id: 'obs-hot-1',
        spaceId: 'space-test-1',
        type: 'air_temperature',
        value: 41, // 41°C exceeds tomato optimal and upper limits
        unit: '°C',
        timestamp: new Date().toISOString(),
        source: 'manual',
        dataQuality: 'valid'
      }
    ];

    const insights = service.generatePlantEnvironmentalInsights(
      [mockGardenPlant],
      'space-test-1',
      observations
    );

    expect(insights.length).toBeGreaterThan(0);
    const heatInsight = insights.find((i) => i.title.includes('Heat Stress Risk') || i.title.includes('Warm'));
    expect(heatInsight).toBeDefined();
    expect(heatInsight!.supportingObservationIds).toContain('obs-hot-1');
    expect(heatInsight!.referencedRequirement?.source).toBeDefined();
  });

  it('generates low soil moisture warning and recommends base watering check', () => {
    const observations: EnvironmentalObservation[] = [
      {
        id: 'obs-dry-1',
        spaceId: 'space-test-1',
        type: 'soil_moisture',
        value: 14, // 14% is critically dry
        unit: '%',
        timestamp: new Date().toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      }
    ];

    const insights = service.generatePlantEnvironmentalInsights(
      [mockGardenPlant],
      'space-test-1',
      observations
    );

    const dryInsight = insights.find((i) => i.title.includes('Low Soil Moisture'));
    expect(dryInsight).toBeDefined();
    expect(dryInsight!.severity).toBe('warning');
    expect(dryInsight!.recommendedNextStep).toContain('finger test');
  });

  it('honestly reports missing environmental evidence when no measurements exist', () => {
    const insights = service.generatePlantEnvironmentalInsights(
      [mockGardenPlant],
      'space-empty',
      [] // No observations
    );

    expect(insights.length).toBe(1);
    expect(insights[0].evidenceQuality).toBe('insufficient_data');
    expect(insights[0].title).toContain('No Recent Sensor or Manual Readings');
  });
});
