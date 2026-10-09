import { describe, it, expect } from 'vitest';
import { taskGenerator } from '../services/localTaskGenerator';
import { BEGINNER_PLANTS } from '../data/plants';
import { GardenProfile } from '../types';

describe('Daily Garden Task Generator', () => {
  const profile: GardenProfile = {
    id: 'test-profile',
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    spaceType: 'balcony',
    spaceSize: 'small',
    sunlight: '4_to_6h',
    experience: 'complete_beginner',
    goal: 'kitchen_garden',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('generates fallback orientation tasks when no plants have been selected yet', () => {
    const tasks = taskGenerator.generateDailyTasks([], profile);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.some((t) => t.category === 'prep')).toBe(true);
  });

  it('generates bite-sized tasks with estimated total time under 15 minutes', () => {
    const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;
    const coriander = BEGINNER_PLANTS.find((p) => p.id === 'coriander')!;

    const tasks = taskGenerator.generateDailyTasks([mint, coriander], profile);
    const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

    expect(totalMinutes).toBeGreaterThanOrEqual(5);
    expect(totalMinutes).toBeLessThanOrEqual(15);
  });

  it('always includes the 1-inch finger test for moisture and mindful watering', () => {
    const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;
    const tasks = taskGenerator.generateDailyTasks([mint], profile);

    const fingerTest = tasks.find((t) => t.id === 'task-check-moisture');
    expect(fingerTest).toBeDefined();
    expect(fingerTest?.touchGrassPrompt).toBeDefined();
  });

  it('adds pinching tasks for mint/basil and leaf checks for coriander/spinach', () => {
    const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;
    const coriander = BEGINNER_PLANTS.find((p) => p.id === 'coriander')!;

    const tasks = taskGenerator.generateDailyTasks([mint, coriander], profile);

    const pinchTask = tasks.find((t) => t.id === 'task-pinch-tops');
    expect(pinchTask).toBeDefined();

    const leafTask = tasks.find((t) => t.id === 'task-leaf-inspect');
    expect(leafTask).toBeDefined();
  });
});
