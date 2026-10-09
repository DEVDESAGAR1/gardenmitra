import { describe, it, expect } from 'vitest';
import { plantKnowledgeProvider } from '../services/localPlantKnowledgeProvider';
import { GardenProfile } from '../types';

describe('Plant Recommendation Logic', () => {
  const baseProfile: GardenProfile = {
    id: 'test-1',
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    spaceType: 'balcony',
    spaceSize: 'small',
    sunlight: '2_to_4h',
    experience: 'complete_beginner',
    goal: 'kitchen_garden',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('ranks container-friendly herbs highly for a small balcony with 2-4 hours of sunlight', async () => {
    const recs = await plantKnowledgeProvider.getRecommendations(baseProfile);
    expect(recs.length).toBeGreaterThan(0);

    const topPlants = recs.slice(0, 3).map((r) => r.plant.id);
    // Mint, coriander, or fenugreek should be among the top recommendations
    expect(topPlants.some((id) => id === 'mint' || id === 'coriander' || id === 'fenugreek')).toBe(true);

    const mintRec = recs.find((r) => r.plant.id === 'mint');
    expect(mintRec).toBeDefined();
    expect(mintRec!.matchScore).toBeGreaterThanOrEqual(70);
    expect(mintRec!.reasoning.length).toBeGreaterThan(0);
  });

  it('generates a warning note when a full-sun crop is recommended for a low-sunlight profile', async () => {
    const lowSunProfile: GardenProfile = {
      ...baseProfile,
      sunlight: 'less_than_2h',
      goal: 'vegetables'
    };

    const recs = await plantKnowledgeProvider.getRecommendations(lowSunProfile);
    const tomatoRec = recs.find((r) => r.plant.id === 'cherry-tomato');

    expect(tomatoRec).toBeDefined();
    expect(tomatoRec?.warningNote).toBeDefined();
    expect(tomatoRec?.warningNote).toContain('5+ hours');
  });

  it('boosts flowers when the goal is set to flowers', async () => {
    const flowerProfile: GardenProfile = {
      ...baseProfile,
      sunlight: 'more_than_6h',
      goal: 'flowers'
    };

    const recs = await plantKnowledgeProvider.getRecommendations(flowerProfile);
    const marigoldRec = recs.find((r) => r.plant.id === 'marigold');

    expect(marigoldRec).toBeDefined();
    expect(marigoldRec!.matchScore).toBeGreaterThan(80);
    expect(marigoldRec!.reasoning.some((r) => r.includes('blooms') || r.includes('flowers'))).toBe(true);
  });

  it('includes geographic context in reasoning', async () => {
    const recs = await plantKnowledgeProvider.getRecommendations(baseProfile);
    const mintRec = recs.find((r) => r.plant.id === 'mint');
    expect(mintRec!.reasoning.some((r) => r.includes('Mumbai'))).toBe(true);
  });
});
