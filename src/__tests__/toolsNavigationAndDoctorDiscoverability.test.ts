import { describe, it, expect } from 'vitest';
import { plantHealthDiagnosticEngine } from '../services/plantHealthDiagnosticEngine';
import { GardenSpace, StructuredSymptomReport } from '../types';
import { PLANT_CATALOG } from '../data/plants';

describe('Phase 1 Remediation: Navigation & Garden Doctor Discoverability', () => {
  const dummySymptoms: StructuredSymptomReport = {
    primarySymptom: 'yellow_leaves',
    affectedPart: 'leaves_lower',
    progression: 'gradual_past_week',
    distribution: 'few_leaves'
  };

  it('allows diagnosis to complete when a user has zero plants in their garden', () => {
    const spaceWithZeroPlants: GardenSpace = {
      id: 'space-zero-plants',
      name: 'Fresh Balcony Space',
      type: 'balcony',
      size: 'small',
      sunlight: '4_to_6h',
      goal: 'easy_plants',
      sunlightZones: [],
      plants: [],
      photos: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const report = plantHealthDiagnosticEngine.diagnose({
      space: spaceWithZeroPlants,
      plant: null, // Unknown / unspecified plant
      symptoms: dummySymptoms
    });

    expect(report).toBeDefined();
    expect(report.plantName).toBe('Your Plant');
    expect(report.summary).toContain("Your Plant's symptoms");
    expect(report.rankedCauses.length).toBeGreaterThan(0);
  });

  it('allows diagnosis using fallback space when no space has been configured yet', () => {
    const fallbackSpace: GardenSpace = {
      id: 'default-space',
      name: 'General Garden Space',
      type: 'garden',
      size: 'medium',
      sunlight: '4_to_6h',
      goal: 'easy_plants',
      sunlightZones: [],
      plants: [],
      photos: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const report = plantHealthDiagnosticEngine.diagnose({
      space: fallbackSpace,
      plant: null,
      symptoms: dummySymptoms
    });

    expect(report).toBeDefined();
    expect(report.spaceId).toBe('default-space');
    expect(report.rankedCauses[0].suggestedCareAction).toBeDefined();
  });

  it('accurately distinguishes botanical causes for specific plants from the catalog', () => {
    const mintPlant = PLANT_CATALOG[0];

    const spaceWithMint: GardenSpace = {
      id: 'space-mint',
      name: 'Kitchen Balcony',
      type: 'balcony',
      size: 'small',
      sunlight: '4_to_6h',
      goal: 'herbs',
      sunlightZones: [],
      photos: [],
      tasks: [],
      plants: [
        {
          plantId: mintPlant.id,
          instanceId: 'mint-inst-1',
          spaceId: 'space-mint',
          status: 'growing',
          addedAt: new Date().toISOString(),
          plant: mintPlant
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const report = plantHealthDiagnosticEngine.diagnose({
      space: spaceWithMint,
      plant: spaceWithMint.plants[0],
      symptoms: {
        primarySymptom: 'spots',
        affectedPart: 'leaves_lower',
        progression: 'gradual_past_week',
        distribution: 'few_leaves'
      }
    });

    expect(report.plantName).toBe('Mint (Pudina)');
    expect(report.rankedCauses.length).toBeGreaterThan(0);
    expect(report.rankedCauses.some((c) => c.title.toLowerCase().includes('leaf spot') || c.title.toLowerCase().includes('fungal') || c.title.toLowerCase().includes('blight'))).toBe(true);
  });
});
