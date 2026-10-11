import { describe, it, expect } from 'vitest';
import { AdaptiveCareEngine } from '../services/adaptiveCareEngine';
import {
  GardenPlant,
  GardenSpace,
  EnvironmentalObservation,
  AdaptiveCareTask
} from '../types';
import { PLANT_CATALOG } from '../data/plants';

describe('Milestone 14: Adaptive Care Recommendation Engine', () => {
  const engine = new AdaptiveCareEngine();

  const tomatoPlant = PLANT_CATALOG.find((p) => p.id === 'cherry-tomato') || PLANT_CATALOG[0];
  const mintPlant = PLANT_CATALOG.find((p) => p.id === 'mint') || PLANT_CATALOG[1];

  const mockSpace: GardenSpace = {
    id: 'space-test-balcony',
    name: 'Sunny Balcony',
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

  it('holds off watering when soil moisture sensor is high or finger test was recently moist', () => {
    const gardenPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-1',
      spaceId: mockSpace.id,
      lastWateredAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() // 4h ago
    };

    const observations: EnvironmentalObservation[] = [
      {
        id: 'obs-moist-1',
        spaceId: mockSpace.id,
        type: 'soil_moisture',
        value: 75, // 75% moisture
        unit: '%',
        timestamp: new Date().toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      }
    ];

    const recs = engine.generateRecommendations(mockSpace, [gardenPlant], observations);
    const waterRec = recs.find((r) => r.category === 'watering');

    expect(waterRec).toBeDefined();
    expect(waterRec!.classification).toBe('no_action_needed');
    expect(waterRec!.actionTitle).toContain('Hold off watering');
    expect(waterRec!.reason).toContain('75% soil moisture');
  });

  it('recommends base watering when physical sensor confirms critically dry soil', () => {
    const gardenPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-2',
      spaceId: mockSpace.id,
      lastWateredAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
    };

    const observations: EnvironmentalObservation[] = [
      {
        id: 'obs-dry-1',
        spaceId: mockSpace.id,
        type: 'soil_moisture',
        value: 18, // 18% moisture (< 25%)
        unit: '%',
        timestamp: new Date().toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      }
    ];

    const recs = engine.generateRecommendations(mockSpace, [gardenPlant], observations);
    const waterRec = recs.find((r) => r.category === 'watering');

    expect(waterRec).toBeDefined();
    expect(waterRec!.classification).toBe('recommended');
    expect(waterRec!.priority).toBe('high');
    expect(waterRec!.actionTitle).toContain('Water');
    expect(waterRec!.supportingObservationIds).toContain('obs-dry-1');
  });

  it('recommends inspection when high ambient temperature evaporates container volume', () => {
    const gardenPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-3',
      spaceId: mockSpace.id,
      lastWateredAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString()
    };

    const observations: EnvironmentalObservation[] = [
      {
        id: 'obs-heat-1',
        spaceId: mockSpace.id,
        type: 'air_temperature',
        value: 36, // 36°C heat
        unit: '°C',
        timestamp: new Date().toISOString(),
        source: 'manual',
        dataQuality: 'valid'
      }
    ];

    const recs = engine.generateRecommendations(mockSpace, [gardenPlant], observations);
    const heatRec = recs.find((r) => r.actionTitle.includes('Heat Alert'));

    expect(heatRec).toBeDefined();
    expect(heatRec!.classification).toBe('needs_inspection');
    expect(heatRec!.priority).toBe('high');
    expect(heatRec!.reason).toContain('36°C');
  });

  it('generates lifecycle-specific care tasks for seedlings, flowering, and harvest', () => {
    const seedlingPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-seedling',
      spaceId: mockSpace.id,
      lifecycleStage: 'seedling'
    };

    const floweringPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-flower',
      spaceId: mockSpace.id,
      lifecycleStage: 'flowering'
    };

    const seedlingRecs = engine.generateRecommendations(mockSpace, [seedlingPlant], []);
    expect(seedlingRecs.some((r) => r.actionTitle.includes('young seedlings'))).toBe(true);

    const floweringRecs = engine.generateRecommendations(mockSpace, [floweringPlant], []);
    expect(floweringRecs.some((r) => r.category === 'feeding' && r.actionTitle.includes('flowering'))).toBe(true);
  });

  it('generates catalog-specific pruning care for vegetative herbs', () => {
    const mintGardenPlant: GardenPlant = {
      plantId: mintPlant.id,
      plant: mintPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-mint-veg',
      spaceId: mockSpace.id,
      lifecycleStage: 'vegetative'
    };

    const recs = engine.generateRecommendations(mockSpace, [mintGardenPlant], []);
    const pruningRec = recs.find((r) => r.category === 'pruning');
    expect(pruningRec).toBeDefined();
    expect(pruningRec!.actionTitle).toBeDefined();
    expect(pruningRec!.referencedRequirement?.source).toBeDefined();
  });
});

describe('Milestone 14: Adaptive Task Lifecycle & Deduplication', () => {
  const engine = new AdaptiveCareEngine();

  const tomatoPlant = PLANT_CATALOG.find((p) => p.id === 'cherry-tomato') || PLANT_CATALOG[0];

  const mockSpace: GardenSpace = {
    id: 'space-test-balcony',
    name: 'Sunny Balcony',
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

  const gardenPlant: GardenPlant = {
    plantId: tomatoPlant.id,
    plant: tomatoPlant,
    addedAt: new Date().toISOString(),
    status: 'growing',
    instanceId: 'inst-tomato-dedup-1',
    spaceId: mockSpace.id,
    lastWateredAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString() // 3 days ago
  };

  it('synchronizes recommendations into tasks and guarantees zero duplicate active tasks', () => {
    const recs = engine.generateRecommendations(mockSpace, [gardenPlant], []);
    let tasks: AdaptiveCareTask[] = [];

    // First synchronization
    tasks = engine.synchronizeTasksFromRecommendations(tasks, recs, mockSpace);
    const initialCount = tasks.length;
    expect(initialCount).toBeGreaterThan(0);

    // Second synchronization with identical recommendations
    tasks = engine.synchronizeTasksFromRecommendations(tasks, recs, mockSpace);
    expect(tasks.length).toBe(initialCount); // Must NOT duplicate active tasks!

    // Third synchronization
    tasks = engine.synchronizeTasksFromRecommendations(tasks, recs, mockSpace);
    expect(tasks.length).toBe(initialCount);
  });

  it('completes an adaptive task with optional notes and updates status to completed', () => {
    const recs = engine.generateRecommendations(mockSpace, [gardenPlant], []);
    let tasks = engine.synchronizeTasksFromRecommendations([], recs, mockSpace);

    const targetTaskId = tasks[0].id;
    const { tasks: updatedTasks, completedTask } = engine.completeTask(
      tasks,
      targetTaskId,
      'Watered deeply at the base until bottom saucer moist.'
    );

    expect(completedTask).toBeDefined();
    expect(completedTask!.status).toBe('completed');
    expect(completedTask!.completedAt).toBeDefined();
    expect(completedTask!.completionNotes).toContain('Watered deeply');

    const inList = updatedTasks.find((t) => t.id === targetTaskId);
    expect(inList!.status).toBe('completed');
  });

  it('snoozes an adaptive task for 24 hours and dismisses a task with reason', () => {
    const recs = engine.generateRecommendations(mockSpace, [gardenPlant], []);
    let tasks = engine.synchronizeTasksFromRecommendations([], recs, mockSpace);

    const taskToSnooze = tasks[0].id;
    tasks = engine.snoozeTask(tasks, taskToSnooze, 24);

    const snoozed = tasks.find((t) => t.id === taskToSnooze);
    expect(snoozed!.status).toBe('snoozed');
    expect(snoozed!.snoozedUntil).toBeDefined();
    expect(new Date(snoozed!.snoozedUntil!).getTime()).toBeGreaterThan(Date.now());

    // Dismiss a separate task if present
    if (tasks.length > 1) {
      const taskToDismiss = tasks[1].id;
      tasks = engine.dismissTask(tasks, taskToDismiss, 'Rain poured outdoors.');
      const dismissed = tasks.find((t) => t.id === taskToDismiss);
      expect(dismissed!.status).toBe('dismissed');
      expect(dismissed!.dismissReason).toContain('Rain poured');
    }
  });
});
