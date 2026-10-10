import { describe, it, expect } from 'vitest';
import { PLANT_CATALOG, BEGINNER_PLANTS } from '../data/plants';
import { plantKnowledgeProvider, LocalPlantKnowledgeProvider } from '../services/localPlantKnowledgeProvider';
import { GardenProfile } from '../types';

describe('Milestone 11: Plant Knowledge Catalog & Provenance Integrity', () => {
  it('contains over 100 curated plant profiles and preserves all 10 legacy beginner plants', () => {
    expect(PLANT_CATALOG.length).toBeGreaterThanOrEqual(100);

    const legacyIds = [
      'mint',
      'coriander',
      'holy-basil',
      'sweet-basil',
      'spinach',
      'fenugreek',
      'chilli',
      'cherry-tomato',
      'radish',
      'marigold'
    ];

    legacyIds.forEach((id) => {
      const found = PLANT_CATALOG.find((p) => p.id === id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(id);
      expect(found!.name).toBeDefined();
    });

    // Check backward-compatible alias export
    expect(BEGINNER_PLANTS.length).toBe(PLANT_CATALOG.length);
  });

  it('guarantees zero duplicate plant IDs across the entire catalog', () => {
    const idSet = new Set<string>();
    PLANT_CATALOG.forEach((plant) => {
      expect(idSet.has(plant.id)).toBe(false);
      idSet.add(plant.id);
    });
    expect(idSet.size).toBe(PLANT_CATALOG.length);
  });

  it('validates physical constraints and prevents zero/negative depth measurements', () => {
    PLANT_CATALOG.forEach((plant) => {
      if (plant.containerRequirements) {
        const req = plant.containerRequirements;
        if (req.minimumDepthCm !== undefined) {
          expect(req.minimumDepthCm).toBeGreaterThan(0);
        }
        if (req.recommendedDepthCm !== undefined && req.minimumDepthCm !== undefined) {
          expect(req.recommendedDepthCm).toBeGreaterThanOrEqual(req.minimumDepthCm);
        }
        if (req.minimumVolumeLitres !== undefined) {
          expect(req.minimumVolumeLitres).toBeGreaterThan(0);
        }
      }
    });
  });

  it('ensures every curated plant has provenance and reviewed attribution metadata', () => {
    PLANT_CATALOG.forEach((plant) => {
      expect(plant.dataQuality).toBeDefined();
      expect(['verified', 'reviewed', 'provisional']).toContain(plant.dataQuality!.status);
      expect(plant.dataQuality!.sources.length).toBeGreaterThan(0);

      // Verified plants must have real sources with name attribution
      if (plant.dataQuality!.status === 'verified') {
        expect(plant.dataQuality!.sources.some((s) => s.name.length > 0)).toBe(true);
      }
    });
  });
});

describe('Milestone 11: Plant Search & Filtering Operations', () => {
  const provider = new LocalPlantKnowledgeProvider();

  it('searches plants by common name, Hindi name, and scientific name', async () => {
    // Common name search
    const tulsiResults = await provider.searchPlants('tulsi');
    expect(tulsiResults.some((p) => p.id === 'holy-basil')).toBe(true);

    // Scientific name search
    const ocimumResults = await provider.searchPlants('Ocimum');
    expect(ocimumResults.some((p) => p.id === 'holy-basil' || p.id === 'sweet-basil')).toBe(true);

    // Hindi name search
    const pudinaResults = await provider.searchPlants('पुदीना');
    expect(pudinaResults.some((p) => p.id === 'mint')).toBe(true);
  });

  it('searches plants by regional Indian language synonyms', async () => {
    // Tamil search: "Koththamalli" (Coriander) or "Thulasi"
    const corianderResults = await provider.searchPlants('Kothamalli');
    expect(corianderResults.some((p) => p.id === 'coriander')).toBe(true);

    // Marathi search: "Methi"
    const methiResults = await provider.searchPlants('Methi');
    expect(methiResults.some((p) => p.id === 'fenugreek')).toBe(true);
  });

  it('filters plants accurately by category', async () => {
    const herbList = await provider.searchPlants('', { category: 'herbs' });
    expect(herbList.length).toBeGreaterThan(0);
    herbList.forEach((p) => expect(p.category).toBe('herbs'));

    const indoorList = await provider.searchPlants('', { category: 'indoor' });
    expect(indoorList.length).toBeGreaterThan(0);
    indoorList.forEach((p) => expect(p.category).toBe('indoor'));
  });

  it('filters plants by pet-safe and edible flags', async () => {
    const petSafeList = await provider.searchPlants('', { petSafeOnly: true });
    petSafeList.forEach((p) => expect(p.toxicToPets).toBe(false));

    const edibleList = await provider.searchPlants('', { edibleOnly: true });
    edibleList.forEach((p) => expect(p.edible).toBe(true));
  });

  it('filters plants by container depth limits', async () => {
    const shallowPlanters = await provider.searchPlants('', { maxContainerDepthCm: 15 });
    shallowPlanters.forEach((p) => {
      if (p.containerRequirements?.minimumDepthCm) {
        expect(p.containerRequirements.minimumDepthCm).toBeLessThanOrEqual(15);
      }
    });
  });
});

describe('Milestone 11: Explainable Recommendation Intelligence', () => {
  const baseProfile: GardenProfile = {
    id: 'rec-test-1',
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    spaceType: 'balcony',
    spaceSize: 'small',
    sunlight: '4_to_6h',
    experience: 'complete_beginner',
    goal: 'kitchen_garden',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('provides explainable recommendations with positive reasons and next actions', async () => {
    const recs = await plantKnowledgeProvider.getRecommendations(baseProfile);
    expect(recs.length).toBeGreaterThan(0);

    const firstRec = recs[0];
    expect(firstRec.positiveReasons).toBeDefined();
    expect(firstRec.positiveReasons!.length).toBeGreaterThan(0);
    expect(firstRec.nextAction).toBeDefined();
    expect(typeof firstRec.nextAction).toBe('string');
  });

  it('reduces confidence to tentative when sunlight is unknown', async () => {
    const unknownSunProfile: GardenProfile = {
      ...baseProfile,
      sunlight: 'unknown'
    };

    const recs = await plantKnowledgeProvider.getRecommendations(unknownSunProfile);
    const mintRec = recs.find((r) => r.plant.id === 'mint');

    expect(mintRec).toBeDefined();
    expect(mintRec!.missingInformation).toBeDefined();
    expect(mintRec!.missingInformation!.some((m) => m.includes('sunlight'))).toBe(true);
    expect(mintRec!.confidenceLevel).toBe('tentative');
  });

  it('flags potential conflicts and warnings when container depth or sunlight mismatches', async () => {
    const lowLightWindowsill: GardenProfile = {
      ...baseProfile,
      spaceType: 'windowsill',
      sunlight: 'less_than_2h'
    };

    const recs = await plantKnowledgeProvider.getRecommendations(lowLightWindowsill);
    const tomatoRec = recs.find((r) => r.plant.id === 'cherry-tomato');

    expect(tomatoRec).toBeDefined();
    expect(tomatoRec!.potentialConflicts).toBeDefined();
    expect(tomatoRec!.potentialConflicts!.length).toBeGreaterThan(0);
  });
});
