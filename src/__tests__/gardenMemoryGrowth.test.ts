import { describe, it, expect } from 'vitest';
import { gardenMemoryEngine } from '../services/gardenMemoryEngine';
import { growthTrackingEngine } from '../services/growthTrackingEngine';
import { normalizeGardenSpace } from '../context/GardenContext';
import {
  GardenPlant,
  GardenSpace,
  Plant,
  PlantHeightMeasurement
} from '../types';

describe('Milestone 12: Plant Instance Identity & Lifecycle Normalization', () => {
  const dummyPlant: Plant = {
    id: 'sweet-basil',
    name: 'Sweet Basil',
    category: 'herbs',
    difficulty: 'Easy',
    sunlightText: '4-6 hours',
    sunlightRequirement: 'full',
    wateringText: 'Keep moist',
    spaceText: '15cm pot',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '3-4 weeks',
    shortDescription: 'Fragrant Italian herb',
    basicRequirements: ['Sun', 'Moist soil'],
    recommendedFor: ['Kitchen', 'Balcony'],
    containerGuidance: 'Well-draining pot',
    growingTimeline: 'Seedlings in 7 days',
    basicCare: ['Water regularly'],
    thingsToWatchFor: ['Cold drafts']
  };

  it('assigns stable unique instanceId without altering catalog plant definitions', () => {
    const rawGardenPlant: GardenPlant = {
      plantId: 'sweet-basil',
      plant: dummyPlant,
      addedAt: '2026-03-01T10:00:00.000Z',
      status: 'planted'
    };

    const normalized = gardenMemoryEngine.normalizePlantInstance(rawGardenPlant, 'space-balcony-1', 0);

    expect(normalized.instanceId).toBeDefined();
    expect(normalized.instanceId).toContain('space-balcony-1');
    expect(normalized.instanceId).toContain('sweet-basil');
    expect(normalized.lifecycleStage).toBe('vegetative');
    expect(normalized.lifecycleHistory).toBeDefined();
    expect(normalized.lifecycleHistory!.length).toBeGreaterThan(0);
    expect(normalized.journalEntries).toBeDefined();
  });

  it('preserves existing plant dates without fabricating artificial planting dates', () => {
    const legacyPlant: GardenPlant = {
      plantId: 'sweet-basil',
      plant: dummyPlant,
      addedAt: '2026-01-15T08:00:00.000Z',
      status: 'planning'
    };

    const normalized = gardenMemoryEngine.normalizePlantInstance(legacyPlant, 'space-terrace-1', 1);

    expect(normalized.plantedAt).toBeUndefined(); // Must NOT fabricate plantedAt
    expect(normalized.lifecycleStage).toBe('planned');
  });

  it('maintains distinct plant identities when multiple instances share the same catalog plant', () => {
    const plantA: GardenPlant = {
      plantId: 'mint',
      plant: { ...dummyPlant, id: 'mint', name: 'Mint' },
      addedAt: '2026-02-01T10:00:00.000Z',
      status: 'planted'
    };
    const plantB: GardenPlant = {
      plantId: 'mint',
      plant: { ...dummyPlant, id: 'mint', name: 'Mint' },
      addedAt: '2026-02-15T10:00:00.000Z',
      status: 'planted'
    };

    const normA = gardenMemoryEngine.normalizePlantInstance(plantA, 'space-1', 0);
    const normB = gardenMemoryEngine.normalizePlantInstance(plantB, 'space-1', 1);

    expect(normA.instanceId).not.toBe(normB.instanceId);
  });
});

describe('Milestone 12: Growth Journal & Observation Provenance', () => {
  it('records journal entries with distinct occurredAt vs recordedAt timestamps', () => {
    const historicalTime = '2026-03-10T14:30:00.000Z';
    const entry = gardenMemoryEngine.createJournalEntry({
      plantInstanceId: 'inst-1',
      plantId: 'mint',
      spaceId: 'space-1',
      type: 'user_note',
      occurredAt: historicalTime,
      note: 'Noticed first two true leaves sprouting',
      source: 'user'
    });

    expect(entry.occurredAt).toBe(historicalTime);
    expect(entry.recordedAt).not.toBe(historicalTime);
    expect(entry.source).toBe('user');
    expect(entry.id).toBeDefined();
  });

  it('distinguishes user observations from AI inferences and care engine actions', () => {
    const userEntry = gardenMemoryEngine.createJournalEntry({
      plantInstanceId: 'inst-1',
      plantId: 'mint',
      spaceId: 'space-1',
      type: 'user_note',
      note: 'Soil felt completely dry',
      source: 'user'
    });

    const aiEntry = gardenMemoryEngine.createJournalEntry({
      plantInstanceId: 'inst-1',
      plantId: 'mint',
      spaceId: 'space-1',
      type: 'symptom_observed',
      note: 'Minor yellowing detected along outer leaf margins',
      source: 'vision_ai',
      confidence: 0.72
    });

    expect(userEntry.source).toBe('user');
    expect(userEntry.confidence).toBe(1.0);

    expect(aiEntry.source).toBe('vision_ai');
    expect(aiEntry.confidence).toBe(0.72);
  });
});

describe('Milestone 12: Growth Comparison & Measurement Intelligence', () => {
  it('calculates days elapsed, net height change, and average daily growth rate', () => {
    const day1Observation = {
      occurredAt: '2026-03-01T10:00:00.000Z',
      stage: 'vegetative' as const,
      heightCm: 10.0
    };
    const day15Observation = {
      occurredAt: '2026-03-15T10:00:00.000Z',
      stage: 'vegetative' as const,
      heightCm: 17.0
    };

    const comparison = growthTrackingEngine.compareObservations(day1Observation, day15Observation);

    expect(comparison.daysElapsed).toBe(14);
    expect(comparison.heightDeltaCm).toBe(7.0);
    expect(comparison.growthRateCmPerDay).toBe(0.5); // 7cm / 14 days = 0.5 cm/day
    expect(comparison.confidence).toBe('calibrated');
    expect(comparison.qualitativeSummary).toContain('+7cm');
  });

  it('includes an explicit perspective disclaimer when visual photos are compared', () => {
    const photoA = {
      occurredAt: '2026-03-01T10:00:00.000Z',
      stage: 'seedling' as const,
      mediaId: 'media-photo-1'
    };
    const photoB = {
      occurredAt: '2026-03-20T10:00:00.000Z',
      stage: 'vegetative' as const,
      mediaId: 'media-photo-2'
    };

    const comparison = growthTrackingEngine.compareObservations(photoA, photoB);

    expect(comparison.perspectiveDisclaimer).toBeDefined();
    expect(comparison.perspectiveDisclaimer).toContain('Camera angle, zoom, and framing differ');
    expect(comparison.confidence).toBe('qualitative_only');
    expect(comparison.stageTransition).toEqual({ from: 'seedling', to: 'vegetative' });
  });

  it('analyzes chronological height measurement series correctly', () => {
    const measurements: PlantHeightMeasurement[] = [
      { id: 'm1', heightCm: 5.0, measuredAt: '2026-03-01T00:00:00.000Z', source: 'user_measured' },
      { id: 'm2', heightCm: 12.0, measuredAt: '2026-03-15T00:00:00.000Z', source: 'user_measured' },
      { id: 'm3', heightCm: 19.0, measuredAt: '2026-03-29T00:00:00.000Z', source: 'user_measured' }
    ];

    const analysis = growthTrackingEngine.analyzeHeightMeasurements(measurements);

    expect(analysis.latestHeightCm).toBe(19.0);
    expect(analysis.totalGrowthCm).toBe(14.0);
    expect(analysis.measurementCount).toBe(3);
    expect(analysis.averageRateCmPerDay).toBeCloseTo(0.5, 1);
  });
});

describe('Milestone 12: Garden Insights & Space Normalization', () => {
  it('generates non-guilt-based check-in insights when plants have not been inspected recently', () => {
    const plantA: GardenPlant = {
      plantId: 'chilli',
      instanceId: 'space-1-chilli-0',
      plant: {
        id: 'chilli',
        name: 'Green Chilli',
        category: 'vegetables',
        difficulty: 'Easy',
        sunlightText: '6 hours',
        sunlightRequirement: 'full',
        wateringText: 'Moderate',
        spaceText: '25cm pot',
        containerFriendly: true,
        beginnerFriendly: true,
        approximateGrowthTime: '70 days',
        shortDescription: 'Spicy pepper',
        basicRequirements: [],
        recommendedFor: [],
        containerGuidance: '',
        growingTimeline: '',
        basicCare: [],
        thingsToWatchFor: []
      },
      spaceId: 'space-1',
      addedAt: '2026-01-01T00:00:00.000Z',
      lastCheckedAt: '2026-01-01T00:00:00.000Z', // Many days ago
      status: 'planted'
    };

    const spaces: GardenSpace[] = [
      {
        id: 'space-1',
        name: 'Balcony',
        type: 'balcony',
        size: 'small',
        sunlight: '4_to_6h',
        goal: 'kitchen_garden',
        photos: [],
        plants: [plantA],
        tasks: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ];

    const insights = gardenMemoryEngine.generateGardenInsights([plantA], spaces);

    expect(insights.length).toBeGreaterThan(0);
    const checkIn = insights.find((i) => i.category === 'check_in');
    expect(checkIn).toBeDefined();
    expect(checkIn!.title).toContain('Gentle check-in');
    expect(checkIn!.description).toContain('Touch the top inch of soil');
  });

  it('normalizes legacy space idempotently and preserves existing care history', () => {
    const legacySpace: GardenSpace = {
      id: 'space-legacy',
      name: 'Old Space',
      type: 'balcony',
      size: 'small',
      sunlight: '2_to_4h',
      goal: 'kitchen_garden',
      photos: [],
      plants: [
        {
          plantId: 'mint',
          plant: {
            id: 'mint',
            name: 'Pudina',
            category: 'herbs',
            difficulty: 'Very Easy',
            sunlightText: 'Partial',
            sunlightRequirement: 'partial',
            wateringText: 'Regular',
            spaceText: 'Pot',
            containerFriendly: true,
            beginnerFriendly: true,
            approximateGrowthTime: '20 days',
            shortDescription: 'Mint',
            basicRequirements: [],
            recommendedFor: [],
            containerGuidance: '',
            growingTimeline: '',
            basicCare: [],
            thingsToWatchFor: []
          },
          addedAt: '2026-01-01T00:00:00.000Z',
          status: 'planted',
          careHistory: [
            {
              id: 'care-1',
              plantId: 'mint',
              spaceId: 'space-legacy',
              type: 'watered',
              timestamp: '2026-01-02T10:00:00.000Z'
            }
          ]
        }
      ],
      tasks: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    const normalized = normalizeGardenSpace(legacySpace);

    expect(normalized.plants[0].instanceId).toBeDefined();
    expect(normalized.plants[0].careHistory?.length).toBe(1);
    expect(normalized.plants[0].lifecycleStage).toBe('vegetative');
  });
});
