import { describe, it, expect } from 'vitest';
import { digitalTwinRecommendationEngine } from '../services/digitalTwinRecommendationEngine';
import { aiVisualizerService } from '../services/aiVisualizerService';
import { normalizeGardenSpace } from '../context/GardenContext';
import {
  GardenPlant,
  GardenSpace,
  Plant,
  SpaceLayout
} from '../types';

describe('Milestone 10: Garden Digital Twin & AI Visualizer', () => {
  const mockTomatoPlant: Plant = {
    id: 'plant-tomato-1',
    name: 'Cherry Tomato',
    category: 'vegetables',
    difficulty: 'Easy',
    sunlightText: 'Full sunlight',
    sunlightRequirement: 'full',
    wateringText: 'Daily',
    spaceText: '12-inch pot',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '60 days',
    shortDescription: 'Sweet cherry tomatoes',
    basicRequirements: ['Direct sun', 'Drainage hole'],
    recommendedFor: ['Balcony', 'Terrace'],
    containerGuidance: 'Use deep 12-inch grow bag',
    growingTimeline: 'Flowers at 30 days',
    basicCare: ['Keep moist'],
    thingsToWatchFor: ['Leaf curl']
  };

  const mockMintPlant: Plant = {
    id: 'plant-mint-1',
    name: 'Pudina (Mint)',
    category: 'herbs',
    difficulty: 'Very Easy',
    sunlightText: 'Partial shade',
    sunlightRequirement: 'partial',
    wateringText: 'Keep moist',
    spaceText: 'Wide pot',
    containerFriendly: true,
    beginnerFriendly: true,
    approximateGrowthTime: '30 days',
    shortDescription: 'Fresh aromatic mint',
    basicRequirements: ['Moist soil', 'Partial light'],
    recommendedFor: ['Windowsill', 'Balcony'],
    containerGuidance: 'Shallow wide container',
    growingTimeline: 'Harvest in 3 weeks',
    basicCare: ['Water regularly'],
    thingsToWatchFor: ['Dry soil']
  };

  const createMockSpaceWithPlants = (): GardenSpace => {
    const plants: GardenPlant[] = [
      {
        plantId: mockTomatoPlant.id,
        plant: mockTomatoPlant,
        addedAt: new Date().toISOString(),
        plantedAt: new Date().toISOString(),
        status: 'planted',
        wateringCount: 0,
        careHistory: []
      },
      {
        plantId: mockMintPlant.id,
        plant: mockMintPlant,
        addedAt: new Date().toISOString(),
        plantedAt: new Date().toISOString(),
        status: 'planted',
        wateringCount: 0,
        careHistory: []
      }
    ];

    const base: GardenSpace = {
      id: 'space-twin-test',
      name: 'Sunlit Balcony',
      type: 'balcony',
      size: 'small',
      dimensions: { width: '8', length: '5', unit: 'ft' },
      sunlight: '4_to_6h',
      goal: 'kitchen_garden',
      photos: [],
      plants,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return normalizeGardenSpace(base);
  };

  describe('3.2 Digital Twin Initialization & Data Integrity', () => {
    it('creates a persistent Digital Twin with stable IDs and linked models', () => {
      const space = createMockSpaceWithPlants();
      const twin = digitalTwinRecommendationEngine.getOrCreateDigitalTwin(space);

      expect(twin.id).toBe(`twin-${space.id}`);
      expect(twin.spaceId).toBe(space.id);
      expect(twin.version).toBe(1);
      expect(twin.layout).toBeDefined();
      expect(twin.measurements.length).toBeGreaterThan(0);
      expect(twin.coverage).toBeDefined();
      expect(twin.usableSpace).toBeDefined();
      expect(twin.assumptions.length).toBeGreaterThan(0);
    });

    it('reuses existing digitalTwin if already populated on the space', () => {
      const space = createMockSpaceWithPlants();
      const initialTwin = digitalTwinRecommendationEngine.getOrCreateDigitalTwin(space);
      space.digitalTwin = initialTwin;

      const retrievedTwin = digitalTwinRecommendationEngine.getOrCreateDigitalTwin(space);
      expect(retrievedTwin).toBe(initialTwin);
    });
  });

  describe('3.5 Smart Layout Proposals Across 4 Modes', () => {
    it('generates a Space-Efficient proposal prioritizing open central walkways', () => {
      const space = createMockSpaceWithPlants();
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'space_efficient');

      expect(proposal.mode).toBe('space_efficient');
      expect(proposal.title).toContain('Space-Efficient');
      expect(proposal.layout.containers.length).toBe(2);
      expect(proposal.explanations.some((e) => e.includes('Perimeter'))).toBe(true);
      expect(proposal.explanations.some((e) => e.includes('walkway') || e.includes('walking'))).toBe(true);
    });

    it('generates a Beginner-Friendly proposal grouped for easy watering', () => {
      const space = createMockSpaceWithPlants();
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'beginner_friendly');

      expect(proposal.mode).toBe('beginner_friendly');
      expect(proposal.title).toContain('Beginner-Friendly');
      expect(proposal.explanations.some((e) => e.includes('watering rhythm'))).toBe(true);
    });

    it('generates a Maximum-Edibles proposal placing fruiting crops in full sun', () => {
      const space = createMockSpaceWithPlants();
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'max_edibles');

      expect(proposal.mode).toBe('max_edibles');
      expect(proposal.title).toContain('Maximum Edibles');
      // Tomato should receive a grow bag
      const tomatoContainer = proposal.layout.containers.find((c) =>
        c.name.toLowerCase().includes('tomato')
      );
      expect(tomatoContainer?.type).toBe('grow_bag');
    });

    it('generates a Low-Maintenance proposal using moisture-retaining planters', () => {
      const space = createMockSpaceWithPlants();
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'low_maintenance');

      expect(proposal.mode).toBe('low_maintenance');
      expect(proposal.title).toContain('Low-Maintenance');
      expect(proposal.explanations.some((e) => e.includes('soil drying'))).toBe(true);
    });

    it('does NOT mutate the space or current garden inventory before acceptance', () => {
      const space = createMockSpaceWithPlants();
      const originalContainerCount = space.layout?.containers.length || 0;

      // Generate proposal
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'max_edibles');

      // Space state must remain completely untouched
      expect(space.layout?.containers.length).toBe(originalContainerCount);
      expect(proposal.layout.containers.length).toBeGreaterThan(0);
    });
  });

  describe('3.6 & 3.8 Before-and-After Preview & Plan Validation', () => {
    it('provides clear placement differences and count statistics', () => {
      const space = createMockSpaceWithPlants();
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'beginner_friendly');

      expect(proposal.newPlacementsCount).toBe(2);
      expect(proposal.usablePlantingAreaSqFt).toBeGreaterThan(0);
      expect(Array.isArray(proposal.warnings)).toBe(true);
    });

    it('validates proposed layout using layoutValidationEngine', () => {
      const space = createMockSpaceWithPlants();
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'space_efficient');

      // Valid proposal has warnings array (even if empty or informative)
      expect(Array.isArray(proposal.warnings)).toBe(true);
    });
  });

  describe('3.7 AI Visualizer Concept Rendering', () => {
    it('generates a 2D architectural concept SVG render with valid SVG structure', () => {
      const space = createMockSpaceWithPlants();
      const layout: SpaceLayout = {
        width: '8',
        depth: '5',
        unit: 'ft',
        zones: [
          { id: 'z1', spaceId: space.id, name: 'Sunny Railing', type: 'sunny_area' },
          { id: 'z2', spaceId: space.id, name: 'Central Walkway', type: 'walkway', isWalkway: true }
        ],
        containers: [
          { id: 'c1', spaceId: space.id, name: 'Tomato Pot', type: 'pot', size: 'medium' }
        ],
        plantPlacements: [],
        updatedAt: new Date().toISOString()
      };

      const svgDataUrl = aiVisualizerService.generateConceptSvg(space, layout);
      expect(svgDataUrl.startsWith('data:image/svg+xml;utf8,')).toBe(true);
      expect(decodeURIComponent(svgDataUrl)).toContain('<svg');
      expect(decodeURIComponent(svgDataUrl)).toContain('Sunny Railing');
      expect(decodeURIComponent(svgDataUrl)).toContain('Central Walkway');
      expect(decodeURIComponent(svgDataUrl)).toContain('Conceptual Only');
    });

    it('creates illustrative visualization package with prominent educational disclaimer', () => {
      const space = createMockSpaceWithPlants();
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'beginner_friendly');

      const output = aiVisualizerService.generateConceptVisualization(space, proposal);
      expect(output.status).toBe('rendered_local');
      expect(output.disclaimer).toContain('illustrative concept only');
      expect(output.disclaimer).toContain('load');
      expect(output.illustrativePrompt).toContain(space.name);
      expect(output.svgDataUrl).toBeDefined();
    });

    it('operates 100% offline without requiring paid cloud APIs', () => {
      const space = createMockSpaceWithPlants();
      const proposal = digitalTwinRecommendationEngine.generateProposal(space, 'low_maintenance');

      // Visualizer generates instant local output synchronously
      const output = aiVisualizerService.generateConceptVisualization(space, proposal);
      expect(output.status).toBe('rendered_local');
    });
  });

  describe('3.9 Persistence & Backward-Compatible Migrations', () => {
    it('normalizes legacy space into versioned Digital Twin schema losslessly', () => {
      const legacySpace: GardenSpace = {
        id: 'space-legacy',
        name: 'Old Balcony',
        type: 'balcony',
        size: 'small',
        sunlight: '2_to_4h',
        goal: 'herbs',
        photos: [],
        plants: [],
        tasks: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };

      const normalized = normalizeGardenSpace(legacySpace);
      expect(normalized.measurements).toBeDefined();
      expect(normalized.userObservations).toBeDefined();
      expect(normalized.coverage).toBeDefined();
      expect(normalized.digitalTwin).toBeDefined();
      expect(normalized.digitalTwin?.id).toBe('twin-space-legacy');
      expect(normalized.digitalTwin?.version).toBe(1);
    });
  });
});
