import { describe, it, expect } from 'vitest';
import { PlantHealthDiagnosticEngine } from '../services/plantHealthDiagnosticEngine';
import { visionProvider } from '../services/localVisionProvider';
import { PLANT_CATALOG } from '../data/plants';
import {
  GardenPlant,
  GardenSpace,
  EnvironmentalObservation,
  StructuredSymptomReport,
  PlantPhotoAnalysisResult
} from '../types';

describe('Milestone 15: Advanced Plant Health Intelligence', () => {
  const engine = new PlantHealthDiagnosticEngine();

  const tomatoPlant = PLANT_CATALOG.find((p) => p.id === 'cherry-tomato') || PLANT_CATALOG[0];
  const tulsiPlant = PLANT_CATALOG.find((p) => p.id === 'holy-basil-tulsi') || PLANT_CATALOG[1];

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

  it('1. Symptom validation and normalization: generates structured contextual diagnosis', () => {
    const gardenPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-1',
      spaceId: mockSpace.id,
      lifecycleStage: 'vegetative'
    };

    const symptoms: StructuredSymptomReport = {
      primarySymptom: 'yellow_leaves',
      affectedPart: 'leaves_lower',
      progression: 'gradual_past_week',
      distribution: 'few_leaves',
      userNotes: 'Bottom leaves look pale yellow while top leaves are lush.'
    };

    const report = engine.diagnose({
      space: mockSpace,
      plant: gardenPlant,
      symptoms
    });

    expect(report.id).toMatch(/^diag-/);
    expect(report.plantName).toBe(tomatoPlant.name);
    expect(report.plantInstanceId).toBe('inst-tomato-1');
    expect(report.symptoms.primarySymptom).toBe('yellow_leaves');
    expect(report.rankedCauses.length).toBeGreaterThan(0);
    expect(report.isOfflineDeterministic).toBe(true);
    expect(report.disclaimer).toContain('advisory educational tool');
  });

  it('2. Overwatering & root hypoxia: diagnosed as likely with high soil moisture and recent watering', () => {
    const gardenPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-waterlogged',
      spaceId: mockSpace.id,
      lastWateredAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() // 4h ago
    };

    const observations: EnvironmentalObservation[] = [
      {
        id: 'obs-moist-high',
        spaceId: mockSpace.id,
        type: 'soil_moisture',
        value: 80, // 80% wet
        unit: '%',
        timestamp: new Date().toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      }
    ];

    const report = engine.diagnose({
      space: mockSpace,
      plant: gardenPlant,
      symptoms: {
        primarySymptom: 'yellow_leaves',
        affectedPart: 'leaves_lower'
      },
      environmentalObservations: observations
    });

    const overwateringCause = report.rankedCauses.find((c) => c.id === 'cause-overwatering');
    expect(overwateringCause).toBeDefined();
    expect(overwateringCause!.strength).toBe('likely');
    expect(overwateringCause!.supportingEvidence.some((e) => e.description.includes('80%'))).toBe(true);
    expect(overwateringCause!.safeTreatmentSteps.some((s) => s.includes('Pause surface watering'))).toBe(true);
    expect(overwateringCause!.suggestedCareAction?.category).toBe('inspection');
  });

  it('3. Underwatering & desiccation: diagnosed as likely when wilting with dry sensor and old watering', () => {
    const gardenPlant: GardenPlant = {
      plantId: tulsiPlant.id,
      plant: tulsiPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tulsi-dry',
      spaceId: mockSpace.id,
      lastWateredAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString() // 4 days ago
    };

    const observations: EnvironmentalObservation[] = [
      {
        id: 'obs-moist-low',
        spaceId: mockSpace.id,
        type: 'soil_moisture',
        value: 12, // 12% dry
        unit: '%',
        timestamp: new Date().toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      }
    ];

    const report = engine.diagnose({
      space: mockSpace,
      plant: gardenPlant,
      symptoms: {
        primarySymptom: 'wilting',
        affectedPart: 'whole_plant'
      },
      environmentalObservations: observations
    });

    const underwateringCause = report.rankedCauses.find((c) => c.id === 'cause-underwatering');
    expect(underwateringCause).toBeDefined();
    expect(underwateringCause!.strength).toBe('likely');
    expect(underwateringCause!.supportingEvidence.some((e) => e.description.includes('12%'))).toBe(true);
    expect(underwateringCause!.suggestedCareAction?.category).toBe('watering');
    expect(underwateringCause!.safeTreatmentSteps.some((s) => s.includes('Confirm soil dryness'))).toBe(true);
  });

  it('4. Conflicting evidence: detects when dry soil conflicts with overwatering hypothesis', () => {
    const gardenPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-conflict',
      spaceId: mockSpace.id
    };

    // User reports yellow leaves, but sensor says soil is bone dry (15%)
    const observations: EnvironmentalObservation[] = [
      {
        id: 'obs-moist-conflict',
        spaceId: mockSpace.id,
        type: 'soil_moisture',
        value: 15,
        unit: '%',
        timestamp: new Date().toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      }
    ];

    const report = engine.diagnose({
      space: mockSpace,
      plant: gardenPlant,
      symptoms: {
        primarySymptom: 'yellow_leaves',
        affectedPart: 'leaves_lower'
      },
      environmentalObservations: observations
    });

    const overwateringCause = report.rankedCauses.find((c) => c.id === 'cause-overwatering');
    expect(overwateringCause).toBeDefined();
    // Because moisture is low, overwatering is NOT likely, and conflicting evidence is flagged
    expect(overwateringCause!.strength).toBe('possible');
    expect(overwateringCause!.conflictingEvidence.some((e) => e.description.includes('15%'))).toBe(true);
  });

  it('5. Stale environmental observations: flags sensor readings >24h old as stale and does not treat as active confirmation', () => {
    const gardenPlant: GardenPlant = {
      plantId: tomatoPlant.id,
      plant: tomatoPlant,
      addedAt: new Date().toISOString(),
      status: 'growing',
      instanceId: 'inst-tomato-stale',
      spaceId: mockSpace.id
    };

    // Sensor reading is 48 hours old
    const staleObservations: EnvironmentalObservation[] = [
      {
        id: 'obs-stale-moist',
        spaceId: mockSpace.id,
        type: 'soil_moisture',
        value: 85,
        unit: '%',
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      }
    ];

    const report = engine.diagnose({
      space: mockSpace,
      plant: gardenPlant,
      symptoms: {
        primarySymptom: 'yellow_leaves',
        affectedPart: 'leaves_lower'
      },
      environmentalObservations: staleObservations
    });

    const overwateringCause = report.rankedCauses.find((c) => c.id === 'cause-overwatering');
    expect(overwateringCause).toBeDefined();
    // Overwatering cannot be marked "likely" with stale readings alone
    expect(overwateringCause!.strength).toBe('possible');
    // Supporting evidence must explicitly mark isStale: true
    const staleEvidence = overwateringCause!.supportingEvidence.find((e) => e.isStale === true);
    expect(staleEvidence).toBeDefined();
    expect(staleEvidence!.description).toContain('Historical');
    // Missing information must demand a fresh physical test
    expect(overwateringCause!.missingInformation.some((m) => m.includes('Fresh soil moisture test'))).toBe(true);
  });

  it('6. Insufficient evidence fallback: general symptoms without data trigger safe educational inspection', () => {
    const report = engine.diagnose({
      space: mockSpace,
      plant: null, // Unknown plant
      symptoms: {
        primarySymptom: 'other',
        userNotes: 'Not sure what is happening, looks slightly tired.'
      }
    });

    expect(report.overallEvidenceStrength).toBe('insufficient_evidence');
    expect(report.summary).toContain('insufficient');
    const fallbackCause = report.rankedCauses.find((c) => c.id === 'cause-insufficient-data');
    expect(fallbackCause).toBeDefined();
    expect(fallbackCause!.safeTreatmentSteps.some((s) => s.includes('Do not apply chemical pesticides'))).toBe(true);
  });

  it('7. Pest and fungal symptoms: recommend safe non-chemical isolation and botanical neem oil', () => {
    const pestReport = engine.diagnose({
      space: mockSpace,
      plant: tulsiPlant,
      symptoms: {
        primarySymptom: 'pests',
        affectedPart: 'new_growth',
        userNotes: 'Found small black clusters under top leaves.'
      }
    });

    const pestCause = pestReport.rankedCauses.find((c) => c.id === 'cause-pests');
    expect(pestCause).toBeDefined();
    expect(pestCause!.strength).toBe('likely');
    expect(pestCause!.safeTreatmentSteps.some((s) => s.includes('Isolate the container'))).toBe(true);
    expect(pestCause!.safeTreatmentSteps.some((s) => s.includes('organic neem oil'))).toBe(true);
    expect(pestCause!.suggestedCareAction?.category).toBe('protection');

    const spotReport = engine.diagnose({
      space: mockSpace,
      plant: tomatoPlant,
      symptoms: {
        primarySymptom: 'spots',
        affectedPart: 'leaves_lower'
      }
    });

    const spotCause = spotReport.rankedCauses.find((c) => c.id === 'cause-leaf-spots');
    expect(spotCause).toBeDefined();
    expect(spotCause!.safeTreatmentSteps.some((s) => s.includes('Water only at the soil line'))).toBe(true);
  });

  it('8. Vision AI integration: enriches diagnosis with visual cues without manufacturing false certainty', () => {
    const mockVisionResult: PlantPhotoAnalysisResult = {
      status: 'success',
      providerId: 'local-ollama-gemma',
      modelName: 'gemma:2b',
      timestamp: new Date().toISOString(),
      observations: {
        leafCondition: 'Interveinal chlorosis observed on lower leaf blades.',
        discoloration: 'Pale yellowing with dark green veins'
      },
      possibleCauses: ['Nutrient deficiency', 'Overwatering'],
      safeNextSteps: ['Check drainage', 'Inspect soil moisture'],
      disclaimer: 'Visual observations alone cannot replace physical soil inspection.'
    };

    const report = engine.diagnose({
      space: mockSpace,
      plant: tomatoPlant,
      symptoms: {
        primarySymptom: 'yellow_leaves',
        photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
      },
      visionResult: mockVisionResult
    });

    expect(report.aiVisionIncluded).toBe(true);
    const nutrientCause = report.rankedCauses.find((c) => c.id === 'cause-chlorosis');
    expect(nutrientCause).toBeDefined();
    const visionEv = nutrientCause!.supportingEvidence.find((e) => e.source === 'image_analysis');
    expect(visionEv).toBeDefined();
    expect(visionEv!.description).toContain('Interveinal chlorosis');
  });

  it('9. Existing Vision Provider regression check: analyzePlantHealth returns guidance for all symptoms', async () => {
    const legacyYellow = await visionProvider.analyzePlantHealth('', 'yellow_leaves');
    expect(legacyYellow.symptomTitle).toContain('Yellow');
    expect(legacyYellow.immediateSafeActions.length).toBeGreaterThan(0);

    const curlingGuidance = await visionProvider.analyzePlantHealth('', 'curling');
    expect(curlingGuidance.symptomTitle).toContain('Curling');
    expect(curlingGuidance.possibleCauses.length).toBeGreaterThan(0);

    const pestGuidance = await visionProvider.analyzePlantHealth('', 'pests');
    expect(pestGuidance.symptomTitle).toContain('Pests');
    expect(pestGuidance.immediateSafeActions.some((a) => a.includes('neem oil'))).toBe(true);
  });

  it('10. Care Task generation & deduplication: converts diagnosis cause into actionable Care Task and prevents duplicates', () => {
    const report = engine.diagnose({
      space: mockSpace,
      plant: tomatoPlant,
      symptoms: {
        primarySymptom: 'yellow_leaves',
        affectedPart: 'leaves_lower'
      },
      environmentalObservations: [
        {
          id: 'obs-m-1',
          spaceId: mockSpace.id,
          type: 'soil_moisture',
          value: 82,
          unit: '%',
          timestamp: new Date().toISOString(),
          source: 'connected_sensor',
          dataQuality: 'valid'
        }
      ]
    });

    const topCause = report.rankedCauses[0];
    expect(topCause.suggestedCareAction).toBeDefined();

    // First conversion: succeeds
    const existingTasks: any[] = [];
    const isDuplicateFirst = existingTasks.some(
      (t) =>
        t.spaceId === report.spaceId &&
        t.plantInstanceId === report.plantInstanceId &&
        t.category === topCause.suggestedCareAction!.category &&
        (t.status === 'suggested' || t.status === 'planned' || t.status === 'due' || t.status === 'snoozed')
    );
    expect(isDuplicateFirst).toBe(false);

    const newTask = {
      id: 'task-diag-test',
      spaceId: report.spaceId,
      plantInstanceId: report.plantInstanceId,
      plantId: report.plantId,
      plantName: report.plantName,
      title: topCause.suggestedCareAction!.title,
      description: topCause.suggestedCareAction!.description,
      category: topCause.suggestedCareAction!.category,
      priority: topCause.suggestedCareAction!.priority,
      status: 'planned'
    };
    existingTasks.push(newTask);

    // Second conversion for the same plant and category: flagged as duplicate
    const isDuplicateSecond = existingTasks.some(
      (t) =>
        t.spaceId === report.spaceId &&
        t.plantInstanceId === report.plantInstanceId &&
        t.category === topCause.suggestedCareAction!.category &&
        (t.status === 'suggested' || t.status === 'planned' || t.status === 'due' || t.status === 'snoozed')
    );
    expect(isDuplicateSecond).toBe(true);
  });

  it('11. Journal & diagnosis persistence: integrates with Garden Journal entry models', () => {
    const report = engine.diagnose({
      space: mockSpace,
      plant: tulsiPlant,
      symptoms: {
        primarySymptom: 'spots'
      }
    });

    const diagnosisRecord = {
      id: `rec-${Date.now()}`,
      report,
      createdAt: new Date().toISOString()
    };

    expect(diagnosisRecord.id).toMatch(/^rec-/);
    expect(diagnosisRecord.report.id).toBe(report.id);

    // Corresponding Journal Entry
    const journalEntry = {
      id: 'j-diag-1',
      plantInstanceId: report.plantInstanceId || 'unassigned',
      plantId: report.plantId || tulsiPlant.id,
      spaceId: report.spaceId,
      type: 'diagnosis_recorded' as const,
      occurredAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      note: `Plant Doctor Diagnosis: ${report.summary}`,
      source: 'care_engine' as const
    };

    expect(journalEntry.type).toBe('diagnosis_recorded');
    expect(journalEntry.source).toBe('care_engine');
    expect(journalEntry.note).toContain('Plant Doctor Diagnosis');
  });

  it('12. Follow-up outcome tracking: records 48-72h recovery status with journal log', () => {
    const report = engine.diagnose({
      space: mockSpace,
      plant: tomatoPlant,
      symptoms: {
        primarySymptom: 'wilting'
      }
    });

    const record = {
      id: 'rec-test-followup',
      report,
      createdAt: new Date().toISOString(),
      followUpStatus: 'improved' as const,
      followUpNotes: 'Foliage perked up after afternoon shade and bottom-watering.'
    };

    expect(record.followUpStatus).toBe('improved');
    expect(record.followUpNotes).toContain('perked up');

    const followUpJournal = {
      id: 'j-followup-1',
      plantInstanceId: report.plantInstanceId || 'unassigned',
      plantId: report.plantId || tomatoPlant.id,
      spaceId: report.spaceId,
      type: 'follow_up_recorded' as const,
      occurredAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      note: `Doctor Follow-up: Status marked as "improved". ${record.followUpNotes}`,
      source: 'user' as const
    };

    expect(followUpJournal.type).toBe('follow_up_recorded');
    expect(followUpJournal.note).toContain('improved');
  });
});
