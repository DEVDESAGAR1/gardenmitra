import { describe, it, expect } from 'vitest';
import {
  layoutValidationEngine,
  layoutRecommendationEngine
} from '../services/layoutOptimizationEngine';
import {
  GardenSpace,
  SpaceLayout,
  GardenPlant,
  Plant,
  SpaceZone,
  GardenContainer
} from '../types';

describe('Milestone 6: Space & Layout Optimization', () => {
  const sampleTomato: Plant = {
    id: 'cherry-tomato',
    name: 'Cherry Tomato',
    category: 'vegetables',
    difficulty: 'Easy',
    sunlightText: '5-6+ hours direct sun',
    sunlightRequirement: 'full',
    wateringText: 'Water when top 1 inch dry',
    spaceText: '12-inch pot',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '60-80 days',
    shortDescription: 'Sweet starter tomatoes',
    basicRequirements: ['Direct sun', 'Regular water'],
    recommendedFor: ['Balcony', 'Terrace'],
    containerGuidance: '12+ inch pot',
    growingTimeline: 'Flowers at 30 days',
    basicCare: ['Full sun'],
    thingsToWatchFor: ['Leaf curl']
  };

  const sampleMint: Plant = {
    id: 'mint',
    name: 'Pudina / Mint',
    category: 'herbs',
    difficulty: 'Very Easy',
    sunlightText: '2-4 hours partial sun',
    sunlightRequirement: 'partial',
    wateringText: 'Keep soil moist',
    spaceText: '6-8 inch pot',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '20-30 days',
    shortDescription: 'Fast growing herb',
    basicRequirements: ['Partial sun', 'Moisture'],
    recommendedFor: ['Balcony', 'Windowsill'],
    containerGuidance: 'Separate container',
    growingTimeline: 'Harvest in 3 weeks',
    basicCare: ['Moist soil'],
    thingsToWatchFor: ['Spreading runners']
  };

  const sampleGardenPlants: GardenPlant[] = [
    {
      plantId: 'cherry-tomato',
      plant: sampleTomato,
      addedAt: new Date().toISOString(),
      status: 'planted',
      spaceId: 'space-balcony'
    },
    {
      plantId: 'mint',
      plant: sampleMint,
      addedAt: new Date().toISOString(),
      status: 'planted',
      spaceId: 'space-balcony'
    }
  ];

  const sunnyZone: SpaceZone = {
    id: 'zone-sun',
    spaceId: 'space-balcony',
    name: 'Sunny Railing',
    type: 'sunny_area'
  };

  const shadedZone: SpaceZone = {
    id: 'zone-shade',
    spaceId: 'space-balcony',
    name: 'Wall Shade',
    type: 'shaded_area'
  };

  const walkwayZone: SpaceZone = {
    id: 'zone-walkway',
    spaceId: 'space-balcony',
    name: '2ft Central Walkway',
    type: 'walkway',
    isWalkway: true
  };

  const doorwayZone: SpaceZone = {
    id: 'zone-door',
    spaceId: 'space-balcony',
    name: 'Balcony Door Threshold',
    type: 'doorway_access'
  };

  const baseLayout: SpaceLayout = {
    width: '6',
    depth: '8',
    unit: 'ft',
    zones: [sunnyZone, shadedZone, walkwayZone, doorwayZone],
    containers: [],
    plantPlacements: [],
    updatedAt: new Date().toISOString()
  };

  const baseSpace: GardenSpace = {
    id: 'space-balcony',
    name: 'Small Balcony',
    type: 'balcony',
    size: 'small',
    dimensions: { width: '6', length: '8', unit: 'ft' },
    sunlight: '4_to_6h',
    goal: 'kitchen_garden',
    photos: [],
    plants: sampleGardenPlants,
    tasks: [],
    layout: baseLayout,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('detects critical issue when a container blocks a designated walkway', () => {
    const blockingContainer: GardenContainer = {
      id: 'cnt-pot-1',
      spaceId: 'space-balcony',
      name: 'Big Terracotta Pot',
      type: 'pot',
      size: 'large',
      zoneId: 'zone-walkway', // Assigned to walkway!
      isAccessibleForWatering: true
    };

    const layoutWithBlockage: SpaceLayout = {
      ...baseLayout,
      containers: [blockingContainer]
    };

    const issues = layoutValidationEngine.validateLayout(
      baseSpace,
      layoutWithBlockage,
      sampleGardenPlants
    );

    const walkwayIssue = issues.find((i) => i.type === 'blocked_walkway');
    expect(walkwayIssue).toBeDefined();
    expect(walkwayIssue?.severity).toBe('critical');
    expect(walkwayIssue?.suggestedAction).toContain('unobstructed');
  });

  it('detects critical issue when a container blocks an entrance doorway', () => {
    const doorwayContainer: GardenContainer = {
      id: 'cnt-pot-2',
      spaceId: 'space-balcony',
      name: 'Entry Planter',
      type: 'pot',
      size: 'medium',
      zoneId: 'zone-door', // Assigned in front of doorway!
      isAccessibleForWatering: true
    };

    const layoutWithDoorBlockage: SpaceLayout = {
      ...baseLayout,
      containers: [doorwayContainer]
    };

    const issues = layoutValidationEngine.validateLayout(
      baseSpace,
      layoutWithDoorBlockage,
      sampleGardenPlants
    );

    const doorIssue = issues.find((i) => i.type === 'blocked_access');
    expect(doorIssue).toBeDefined();
    expect(doorIssue?.severity).toBe('critical');
  });

  it('detects sunlight incompatibility when full-sun plant is placed in shade', () => {
    const layoutWithShadedTomato: SpaceLayout = {
      ...baseLayout,
      plantPlacements: [
        {
          id: 'plm-1',
          spaceId: 'space-balcony',
          plantId: 'cherry-tomato',
          plantName: 'Cherry Tomato',
          zoneId: 'zone-shade' // Placed in shade!
        }
      ]
    };

    const issues = layoutValidationEngine.validateLayout(
      baseSpace,
      layoutWithShadedTomato,
      sampleGardenPlants
    );

    const sunIssue = issues.find((i) => i.type === 'sunlight_incompatibility');
    expect(sunIssue).toBeDefined();
    expect(sunIssue?.severity).toBe('warning');
    expect(sunIssue?.affectedPlantName).toBe('Cherry Tomato');
    expect(sunIssue?.message).toContain('shaded');
  });

  it('detects excessive container density in very small spaces', () => {
    const verySmallSpace: GardenSpace = {
      ...baseSpace,
      size: 'very_small'
    };

    const manyContainers: GardenContainer[] = [1, 2, 3, 4, 5].map((num) => ({
      id: `cnt-${num}`,
      spaceId: 'space-balcony',
      name: `Pot #${num}`,
      type: 'pot',
      size: 'small',
      isAccessibleForWatering: true
    }));

    const crowdedLayout: SpaceLayout = {
      ...baseLayout,
      containers: manyContainers
    };

    const issues = layoutValidationEngine.validateLayout(
      verySmallSpace,
      crowdedLayout,
      sampleGardenPlants
    );

    const densityIssue = issues.find((i) => i.type === 'excessive_density');
    expect(densityIssue).toBeDefined();
    expect(densityIssue?.severity).toBe('warning');
  });

  it('detects container watering accessibility problems', () => {
    const hardToReachContainer: GardenContainer = {
      id: 'cnt-hidden',
      spaceId: 'space-balcony',
      name: 'Deep Corner Pot',
      type: 'pot',
      size: 'medium',
      isAccessibleForWatering: false
    };

    const layoutWithInaccessiblePot: SpaceLayout = {
      ...baseLayout,
      containers: [hardToReachContainer]
    };

    const issues = layoutValidationEngine.validateLayout(
      baseSpace,
      layoutWithInaccessiblePot,
      sampleGardenPlants
    );

    const accessIssue = issues.find((i) => i.type === 'watering_difficulty');
    expect(accessIssue).toBeDefined();
    expect(accessIssue?.suggestedAction).toContain('1-inch soil moisture test');
  });

  it('generates explainable layout recommendations for plants and small spaces', () => {
    const recs = layoutRecommendationEngine.generateRecommendations(
      baseSpace,
      baseLayout,
      sampleGardenPlants
    );

    expect(recs.length).toBeGreaterThan(0);

    // Tomato recommendation
    const tomatoRec = recs.find((r) => r.plantId === 'cherry-tomato');
    expect(tomatoRec).toBeDefined();
    expect(tomatoRec?.headline).toContain('brightest sunny spot');
    expect(tomatoRec?.reason).toContain('solar energy');

    // Mint recommendation
    const mintRec = recs.find((r) => r.plantId === 'mint');
    expect(mintRec).toBeDefined();
    expect(mintRec?.headline).toContain('partial shade');
    expect(mintRec?.tip).toContain('separate container');

    // Small space walkway & vertical recommendations
    const verticalRec = recs.find((r) => r.id === 'rec-space-vertical');
    expect(verticalRec).toBeDefined();
    expect(verticalRec?.headline).toContain('vertical');

    const walkwayRec = recs.find((r) => r.id === 'rec-space-walkway');
    expect(walkwayRec).toBeDefined();
    expect(walkwayRec?.headline).toContain('2-foot');
  });
});
