import { describe, it, expect, beforeEach } from 'vitest';
import { GardenPerformanceService } from '../services/gardenPerformanceService';
import {
  Garden,
  GardenSpace,
  GardenPlant,
  AdaptiveCareTask,
  DiagnosisRecord
} from '../types';
import { PLANT_CATALOG } from '../data/plants';

describe('Milestone 17: Garden Performance & Analytics Architecture', () => {
  let service: GardenPerformanceService;

  const tomato = PLANT_CATALOG.find((p) => p.id === 'cherry-tomato') || PLANT_CATALOG[0];
  const mint = PLANT_CATALOG.find((p) => p.id === 'mint') || PLANT_CATALOG[1];
  const basil = PLANT_CATALOG.find((p) => p.id === 'holy-basil-tulsi') || PLANT_CATALOG[2];

  const mockSpace1: GardenSpace = {
    id: 'space-balcony-1',
    name: 'Main Balcony',
    type: 'balcony',
    size: 'medium',
    sunlight: '4_to_6h',
    goal: 'kitchen_garden',
    photos: [],
    plants: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockSpace2: GardenSpace = {
    id: 'space-terrace-2',
    name: 'Rooftop Terrace',
    type: 'terrace',
    size: 'large',
    sunlight: 'more_than_6h',
    goal: 'vegetables',
    photos: [],
    plants: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockGarden: Garden = {
    id: 'garden-main',
    name: 'Home Garden',
    location: { city: 'Bengaluru', state: 'KA', country: 'India' },
    experience: 'beginner',
    spaces: [mockSpace1, mockSpace2],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    service = new GardenPerformanceService();
  });

  describe('3.3 Plant Inventory & Lifecycle Analytics', () => {
    it('correctly calculates active, planned, harvested, and removed plant counts across categories and spaces', () => {
      const activePlant: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-active-1',
        spaceId: mockSpace1.id,
        lifecycleStage: 'vegetative'
      };

      const plannedPlant: GardenPlant = {
        plantId: mint.id,
        plant: mint,
        addedAt: new Date().toISOString(),
        status: 'planning',
        instanceId: 'inst-plan-1',
        spaceId: mockSpace1.id,
        lifecycleStage: 'planned'
      };

      const harvestedPlant: GardenPlant = {
        plantId: basil.id,
        plant: basil,
        addedAt: new Date().toISOString(),
        status: 'harvested',
        instanceId: 'inst-harv-1',
        spaceId: mockSpace2.id,
        lifecycleStage: 'harvest'
      };

      const removedPlant: GardenPlant = {
        plantId: mint.id,
        plant: mint,
        addedAt: new Date().toISOString(),
        status: 'harvested',
        instanceId: 'inst-rem-1',
        spaceId: mockSpace2.id,
        lifecycleStage: 'removed'
      };

      const spacesWithPlants: GardenSpace[] = [
        { ...mockSpace1, plants: [activePlant, plannedPlant] },
        { ...mockSpace2, plants: [harvestedPlant, removedPlant] }
      ];

      const inventory = service.calculateInventorySummary(spacesWithPlants);

      expect(inventory.activeCount).toBe(1);
      expect(inventory.plannedCount).toBe(1);
      expect(inventory.harvestedCount).toBe(2);
      expect(inventory.removedCount).toBe(1);
      expect(inventory.totalPlants).toBe(4);
      expect(inventory.bySpace.find((s) => s.spaceId === mockSpace1.id)?.count).toBe(2);
      expect(inventory.bySpace.find((s) => s.spaceId === mockSpace2.id)?.count).toBe(2);
    });

    it('distinguishes user-confirmed milestones from automated/system-recorded milestones', () => {
      const plantWithMilestones: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-milestone-test',
        spaceId: mockSpace1.id,
        lifecycleStage: 'flowering',
        lifecycleHistory: [
          {
            id: 'lh-1',
            stage: 'seedling',
            transitionedAt: '2026-09-01T10:00:00Z',
            source: 'system' // System recorded
          },
          {
            id: 'lh-2',
            stage: 'flowering',
            transitionedAt: '2026-09-20T10:00:00Z',
            source: 'user' // User confirmed
          }
        ]
      };

      const spaces: GardenSpace[] = [{ ...mockSpace1, plants: [plantWithMilestones] }];
      const lifecycle = service.calculateLifecycleSummary(spaces);

      expect(lifecycle.confirmedMilestonesCount).toBe(1);
      expect(lifecycle.inferredMilestonesCount).toBe(1);
      expect(lifecycle.milestoneTimeline.length).toBe(2);
      expect(lifecycle.milestoneTimeline[0].stage).toBe('flowering');
      expect(lifecycle.milestoneTimeline[0].isConfirmed).toBe(true);
      expect(lifecycle.stageCounts['flowering']).toBe(1);
    });
  });

  describe('3.4 Physical Growth & Height Analytics', () => {
    it('requires at least 2 dated measurements to establish growth trend and rate', () => {
      // Plant with only 1 measurement
      const plantSingleMeasurement: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-single-m',
        spaceId: mockSpace1.id,
        heightMeasurements: [
          {
            id: 'h-1',
            heightCm: 12.0,
            measuredAt: '2026-10-01T10:00:00Z',
            source: 'user_measured'
          }
        ]
      };

      // Plant with 3 dated measurements
      const plantMultipleMeasurements: GardenPlant = {
        plantId: mint.id,
        plant: mint,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-multi-m',
        spaceId: mockSpace1.id,
        heightMeasurements: [
          {
            id: 'h-2',
            heightCm: 10.0,
            measuredAt: '2026-10-01T10:00:00Z',
            source: 'user_measured'
          },
          {
            id: 'h-3',
            heightCm: 14.5,
            measuredAt: '2026-10-10T10:00:00Z',
            source: 'user_measured'
          },
          {
            id: 'h-4',
            heightCm: 18.0,
            measuredAt: '2026-10-21T10:00:00Z', // 20 days elapsed from h-2
            source: 'user_measured'
          }
        ]
      };

      const spaces: GardenSpace[] = [
        { ...mockSpace1, plants: [plantSingleMeasurement, plantMultipleMeasurements] }
      ];

      const growth = service.calculateGrowthSummary(spaces);

      expect(growth.totalHeightMeasurements).toBe(4);
      expect(growth.plantsWithMeasurements).toBe(2);
      expect(growth.plantsWithSufficientData).toBe(1); // Only plantMultipleMeasurements

      const singleRate = growth.plantGrowthRates.find((r) => r.plantInstanceId === 'inst-single-m');
      expect(singleRate?.status).toBe('insufficient_data');
      expect(singleRate?.growthRateCmPerDay).toBeUndefined();
      expect(singleRate?.dataLimitations[0]).toContain('At least 2 dated measurements are required');

      const multiRate = growth.plantGrowthRates.find((r) => r.plantInstanceId === 'inst-multi-m');
      expect(multiRate?.status).toBe('sufficient_data');
      expect(multiRate?.initialHeightCm).toBe(10.0);
      expect(multiRate?.latestHeightCm).toBe(18.0);
      expect(multiRate?.deltaCm).toBe(8.0);
      expect(multiRate?.daysElapsed).toBe(20);
      expect(multiRate?.growthRateCmPerDay).toBe(0.4); // 8cm / 20 days = 0.4 cm/day
    });

    it('defensively ignores non-positive and invalid measurements without failing', () => {
      const plantWithBadMeasurements: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-bad-m',
        spaceId: mockSpace1.id,
        heightMeasurements: [
          {
            id: 'h-bad-1',
            heightCm: -5.0, // Invalid negative
            measuredAt: '2026-10-01T10:00:00Z',
            source: 'user_measured'
          },
          {
            id: 'h-bad-2',
            heightCm: 0, // Invalid zero
            measuredAt: '2026-10-02T10:00:00Z',
            source: 'user_measured'
          }
        ]
      };

      const spaces: GardenSpace[] = [{ ...mockSpace1, plants: [plantWithBadMeasurements] }];
      const growth = service.calculateGrowthSummary(spaces);

      expect(growth.totalHeightMeasurements).toBe(0);
      expect(growth.plantsWithSufficientData).toBe(0);
    });
  });

  describe('3.5 Care Activity Analytics & Transparent Denominator', () => {
    it('calculates completion rate with strict denominator (Completed + Due + Postponed + Snoozed) while excluding Dismissed tasks', () => {
      const tasks: AdaptiveCareTask[] = [
        {
          id: 'task-1',
          spaceId: mockSpace1.id,
          title: 'Watering 1',
          description: '',
          category: 'watering',
          priority: 'high',
          status: 'completed',
          estimatedMinutes: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-2',
          spaceId: mockSpace1.id,
          title: 'Pruning 1',
          description: '',
          category: 'pruning',
          priority: 'normal',
          status: 'completed',
          estimatedMinutes: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-3',
          spaceId: mockSpace1.id,
          title: 'Watering 2',
          description: '',
          category: 'watering',
          priority: 'high',
          status: 'due',
          estimatedMinutes: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-4',
          spaceId: mockSpace1.id,
          title: 'Watering 3',
          description: '',
          category: 'watering',
          priority: 'high',
          status: 'postponed', // Postponed by rain
          estimatedMinutes: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-5',
          spaceId: mockSpace1.id,
          title: 'Inspection',
          description: '',
          category: 'inspection',
          priority: 'normal',
          status: 'dismissed', // Dismissed by gardener -> MUST NOT be in denominator
          estimatedMinutes: 2,
          createdAt: new Date().toISOString()
        }
      ];

      const care = service.calculateCareActivitySummary(tasks, [mockSpace1], mockSpace1.id);

      expect(care.totalCompletedTasks).toBe(2);
      expect(care.totalPendingTasks).toBe(2); // 1 due + 1 postponed
      expect(care.totalEligibleTasks).toBe(4); // 2 completed + 1 due + 1 postponed = 4 (dismissed excluded)
      expect(care.completionRatePercent).toBe(50); // 2 / 4 = 50%
      expect(care.tasksByCategory.watering).toBe(1);
      expect(care.tasksByCategory.pruning).toBe(1);
      expect(care.denominatorExplanation).toContain('Dismissed tasks are excluded');
    });

    it('returns null completion rate when no tasks are eligible without dividing by zero', () => {
      const care = service.calculateCareActivitySummary([], [mockSpace1], mockSpace1.id);
      expect(care.totalEligibleTasks).toBe(0);
      expect(care.completionRatePercent).toBeNull();
    });
  });

  describe('3.6 Plant Health & Recovery Follow-Up Analytics', () => {
    it('summarizes diagnosis follow-up outcomes and flags plants that warrant renewed inspection', () => {
      const diagnoses: DiagnosisRecord[] = [
        {
          id: 'diag-1',
          report: {
            id: 'rep-1',
            spaceId: mockSpace1.id,
            plantInstanceId: 'inst-sick-1',
            plantName: 'Tomato Plant',
            timestamp: new Date().toISOString(),
            symptoms: { primarySymptom: 'yellow_leaves' },
            summary: '',
            rankedCauses: [],
            overallEvidenceStrength: 'likely',
            generalPrecautions: [],
            followUpQuestions: [],
            isOfflineDeterministic: true,
            disclaimer: ''
          },
          createdAt: new Date().toISOString(),
          followUpStatus: 'resolved'
        },
        {
          id: 'diag-2',
          report: {
            id: 'rep-2',
            spaceId: mockSpace1.id,
            plantInstanceId: 'inst-sick-2',
            plantName: 'Mint Herb',
            timestamp: new Date().toISOString(),
            symptoms: { primarySymptom: 'wilting' },
            summary: '',
            rankedCauses: [],
            overallEvidenceStrength: 'likely',
            generalPrecautions: [],
            followUpQuestions: [],
            isOfflineDeterministic: true,
            disclaimer: ''
          },
          createdAt: new Date().toISOString(),
          followUpStatus: 'no_change' // Outcome: no change!
        }
      ];

      const health = service.calculateHealthRecoverySummary(diagnoses, mockSpace1.id);

      expect(health.totalDiagnoses).toBe(2);
      expect(health.totalFollowUps).toBe(2);
      expect(health.outcomes.resolved).toBe(1);
      expect(health.outcomes.no_change).toBe(1);
      expect(health.recurringSymptoms.some((s) => s.symptom === 'yellow_leaves')).toBe(true);
      expect(health.plantsWarrantingInspection.length).toBe(1);
      expect(health.plantsWarrantingInspection[0].plantInstanceId).toBe('inst-sick-2');
      expect(health.plantsWarrantingInspection[0].reason).toContain('no_change');
    });
  });

  describe('3.7 & 3.8 Explainable Insights Engine & Historical Transparency', () => {
    it('generates deterministic insights with stable keys and transparent data limitations', () => {
      const plant: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-insight-plant',
        spaceId: mockSpace1.id,
        lifecycleStage: 'fruiting',
        heightMeasurements: [
          { id: 'm-1', heightCm: 15, measuredAt: '2026-10-01T10:00:00Z', source: 'user_measured' },
          { id: 'm-2', heightCm: 21, measuredAt: '2026-10-11T10:00:00Z', source: 'user_measured' }
        ]
      };

      const spaces: GardenSpace[] = [{ ...mockSpace1, plants: [plant] }];

      const report = service.generatePerformanceReport({
        garden: mockGarden,
        spaces,
        selectedSpaceId: mockSpace1.id,
        timeWindow: 'all_time'
      });

      expect(report.insights.length).toBeGreaterThan(0);
      expect(report.hasHistoricalWeather).toBe(false);
      expect(report.historicalWeatherNote).toContain('Historical weather archive is not stored locally');

      const growthInsight = report.insights.find((i) => i.category === 'growth');
      expect(growthInsight).toBeDefined();
      expect(growthInsight?.stableKey).toContain('growth-trend');
      expect(growthInsight?.title).toContain('+6 cm');
      expect(growthInsight?.recordsExamined).toBe(2);
      expect(growthInsight?.actionType).toBe('record_height');

      // The exact same inputs must produce the exact same stableKeys and outputs
      const secondReport = service.generatePerformanceReport({
        garden: mockGarden,
        spaces,
        selectedSpaceId: mockSpace1.id,
        timeWindow: 'all_time'
      });

      expect(secondReport.insights.map((i) => i.stableKey)).toEqual(
        report.insights.map((i) => i.stableKey)
      );
    });

    it('filters report strictly to selected space without leaking other spaces', () => {
      const plantSpace1: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-sp1',
        spaceId: mockSpace1.id
      };

      const plantSpace2: GardenPlant = {
        plantId: basil.id,
        plant: basil,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-sp2',
        spaceId: mockSpace2.id
      };

      const spaces: GardenSpace[] = [
        { ...mockSpace1, plants: [plantSpace1] },
        { ...mockSpace2, plants: [plantSpace2] }
      ];

      const reportSpace1 = service.generatePerformanceReport({
        garden: mockGarden,
        spaces,
        selectedSpaceId: mockSpace1.id
      });

      expect(reportSpace1.inventory.totalPlants).toBe(1);
      expect(reportSpace1.inventory.bySpace.length).toBe(1);
      expect(reportSpace1.inventory.bySpace[0].spaceId).toBe(mockSpace1.id);
    });
  });
});
