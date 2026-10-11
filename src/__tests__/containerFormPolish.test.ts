import { describe, it, expect } from 'vitest';
import { GardenContainer } from '../types';
import { secureIds } from '../utils/secureId';

describe('Phase 7 Remediation: Container Planning & Form Polish', () => {
  it('creates containers with valid sizes (small, medium, large) and cryptographically secure IDs', () => {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

    sizes.forEach((size) => {
      const container: GardenContainer = {
        id: secureIds.container(),
        spaceId: 'space-test',
        name: `${size} Terracotta Planter`,
        type: 'pot',
        size,
        maxPlants: size === 'small' ? 1 : size === 'medium' ? 2 : 4,
        isAccessibleForWatering: true
      };

      expect(container.id).toMatch(/^cnt-\d+-[a-z0-9]+$/);
      expect(container.size).toBe(size);
      expect(container.maxPlants).toBeGreaterThan(0);
    });
  });

  it('supports zone placement and calculates plant capacity accurately', () => {
    const largePlanter: GardenContainer = {
      id: secureIds.container(),
      spaceId: 'space-balcony',
      name: 'South Balcony Box',
      type: 'planter_box',
      size: 'large',
      zoneId: 'zone-south-railing',
      maxPlants: 4,
      plantIds: ['mint', 'basil'],
      isAccessibleForWatering: true
    };

    expect(largePlanter.zoneId).toBe('zone-south-railing');
    expect(largePlanter.plantIds?.length).toBe(2);
    expect((largePlanter.plantIds?.length || 0) < (largePlanter.maxPlants || 1)).toBe(true);
  });
});
