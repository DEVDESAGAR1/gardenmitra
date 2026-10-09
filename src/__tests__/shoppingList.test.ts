import { describe, it, expect } from 'vitest';
import { shoppingProvider } from '../services/localShoppingProvider';
import { BEGINNER_PLANTS } from '../data/plants';
import { GardenProfile } from '../types';

describe('Shopping List Generation', () => {
  const profile: GardenProfile = {
    id: 'test-profile',
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    spaceType: 'balcony',
    spaceSize: 'small',
    sunlight: '2_to_4h',
    experience: 'complete_beginner',
    goal: 'kitchen_garden',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('returns an empty shopping list when 0 plants are selected', async () => {
    const items = await shoppingProvider.generateShoppingList([], profile);
    expect(items).toEqual([]);
  });

  it('generates essential beginner categories for selected crops', async () => {
    const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;
    const tomato = BEGINNER_PLANTS.find((p) => p.id === 'cherry-tomato')!;

    const items = await shoppingProvider.generateShoppingList([mint, tomato], profile);

    const categories = new Set(items.map((i) => i.category));
    expect(categories.has('container')).toBe(true);
    expect(categories.has('plant')).toBe(true);
    expect(categories.has('medium')).toBe(true);
    expect(categories.has('nutrients')).toBe(true);
    expect(categories.has('tools')).toBe(true);
  });

  it('adds dedicated mint pot and tomato support stakes when appropriate', async () => {
    const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;
    const tomato = BEGINNER_PLANTS.find((p) => p.id === 'cherry-tomato')!;

    const items = await shoppingProvider.generateShoppingList([mint, tomato], profile);

    const mintPotItem = items.find((i) => i.id === 'container-mint');
    expect(mintPotItem).toBeDefined();
    expect(mintPotItem?.whatIsThisFor).toContain('runners');

    const stakeItem = items.find((i) => i.id === 'tool-support-stake');
    expect(stakeItem).toBeDefined();
  });

  it('ensures every shopping item explains what it is for without brand bias', async () => {
    const coriander = BEGINNER_PLANTS.find((p) => p.id === 'coriander')!;
    const items = await shoppingProvider.generateShoppingList([coriander], profile);

    for (const item of items) {
      expect(item.whatIsThisFor).toBeDefined();
      expect(item.whatIsThisFor.length).toBeGreaterThan(10);
      expect(item.whyNeeded.length).toBeGreaterThan(10);
    }
  });
});
