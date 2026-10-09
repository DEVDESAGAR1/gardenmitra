import { describe, it, expect } from 'vitest';
import { gardenAssistantProvider } from '../services/localAssistantProvider';
import { BEGINNER_PLANTS } from '../data/plants';
import { GardenProfile } from '../types';

describe('Garden Assistant Context Awareness', () => {
  const profile: GardenProfile = {
    id: 'test-profile',
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    spaceType: 'balcony',
    spaceSize: 'small',
    sunlight: '2_to_4h',
    experience: 'complete_beginner',
    goal: 'kitchen_garden',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;

  const context = {
    profile,
    selectedPlants: [mint],
    photoUploaded: true,
    tasksCount: 4,
    completedTasksCount: 1
  };

  it('incorporates user location and space in plant recommendations response', async () => {
    const res = await gardenAssistantProvider.respond('What should I grow?', [], context);
    expect(res.content).toContain('Pune');
    expect(res.content).toContain('balcony');
    expect(res.isRuleBased).toBe(true);
    expect(res.suggestedQuestions?.length).toBeGreaterThan(0);
  });

  it('answers "How often should I water this?" with moisture-check principles rather than rigid calendars', async () => {
    const res = await gardenAssistantProvider.respond('How often should I water this?', [], context);
    expect(res.content.toLowerCase()).toContain('finger');
    expect(res.content.toLowerCase()).toContain('moisture');
  });

  it('provides safe root and drainage troubleshooting for "Why are my leaves turning yellow?"', async () => {
    const res = await gardenAssistantProvider.respond('Why are my leaves turning yellow?', [], context);
    expect(res.content.toLowerCase()).toContain('overwatering');
    expect(res.content.toLowerCase()).toContain('drainage');
  });

  it('explains the Touch Grass philosophy when asked about going outside', async () => {
    const res = await gardenAssistantProvider.respond('Why do you tell me to touch grass and go outside?', [], context);
    expect(res.content.toLowerCase()).toContain('outside');
    expect(res.content.toLowerCase()).toContain('screen');
  });
});
