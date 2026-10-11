import {
  GardenPlant,
  Plant,
  GardenSpace,
  EnvironmentalObservation,
  EnvironmentalContext,
  PlantPhotoAnalysisResult,
  StructuredSymptomReport,
  RankedDiagnosisCause,
  ContextualDiagnosisReport,
  DiagnosisEvidenceStrength,
  DiagnosisEvidenceItem
} from '../types';
import { secureIds } from '../utils/secureId';

export interface DiagnosisParams {
  space: GardenSpace;
  plant?: GardenPlant | Plant | null;
  symptoms: StructuredSymptomReport;
  environmentalObservations?: EnvironmentalObservation[];
  environmentalContext?: EnvironmentalContext | null;
  visionResult?: PlantPhotoAnalysisResult | null;
}

export class PlantHealthDiagnosticEngine {
  /**
   * Diagnoses plant health using all assembled contextual evidence:
   * botanical requirements, lifecycle stage, care history, physical measurements, and symptoms.
   */
  diagnose(params: DiagnosisParams): ContextualDiagnosisReport {
    const {
      space,
      plant,
      symptoms,
      environmentalObservations = [],
      environmentalContext,
      visionResult
    } = params;

    const reportId = secureIds.diagnostic();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // 1. Resolve Plant Metadata & Provenance
    const resolvedPlant: Plant | null = plant
      ? 'plant' in plant
        ? plant.plant
        : plant
      : null;

    const plantName = resolvedPlant?.name || 'Your Plant';
    const plantId = resolvedPlant?.id;
    const plantInstanceId = plant && 'instanceId' in plant ? plant.instanceId : undefined;
    const botanicalSource =
      resolvedPlant?.dataQuality?.sources?.[0]?.name || 'Botanical Knowledge Base (ICAR/TNAU)';

    // 2. Resolve Instance History
    const gardenPlant = plant && ('careHistory' in plant || 'instanceId' in plant || 'lastWateredAt' in plant)
      ? (plant as GardenPlant)
      : null;
    const lifecycleStage = gardenPlant?.lifecycleStage || 'vegetative';
    const lastWateredAt = gardenPlant?.lastWateredAt ? new Date(gardenPlant.lastWateredAt).getTime() : null;
    const hoursSinceWater = lastWateredAt ? (nowMs - lastWateredAt) / (1000 * 3600) : null;

    // Recent soil checks
    const recentSoilChecks = (gardenPlant?.careHistory || [])
      .filter((c) => c.type === 'soil_checked')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastSoilCheck = recentSoilChecks[0];
    const hoursSinceSoilCheck = lastSoilCheck
      ? (nowMs - new Date(lastSoilCheck.timestamp).getTime()) / (1000 * 3600)
      : null;

    // 3. Resolve Physical Environmental Observations (M13)
    const spaceObs = environmentalObservations.filter(
      (o) => o.spaceId === space.id && o.dataQuality === 'valid'
    );

    const latestSoilMoisture = spaceObs
      .filter((o) => o.type === 'soil_moisture')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const latestAirTemp = spaceObs
      .filter((o) => o.type === 'air_temperature')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const isMoistureStale = latestSoilMoisture
      ? (nowMs - new Date(latestSoilMoisture.timestamp).getTime()) > 24 * 3600 * 1000
      : false;

    const isTempStale = latestAirTemp
      ? (nowMs - new Date(latestAirTemp.timestamp).getTime()) > 24 * 3600 * 1000
      : false;

    // 4. Candidate Causes Collection
    const candidateCauses: RankedDiagnosisCause[] = [];
    const sym = symptoms.primarySymptom;
    const part = symptoms.affectedPart || 'whole_plant';
    const notes = symptoms.userNotes?.toLowerCase() || '';

    // ==========================================
    // CAUSE 1: Overwatering / Root Hypoxia
    // ==========================================
    if (
      sym === 'yellow_leaves' ||
      sym === 'wilting' ||
      sym === 'drooping' ||
      sym === 'leaf_drop' ||
      sym === 'root_concerns'
    ) {
      const supporting: DiagnosisEvidenceItem[] = [];
      const conflicting: DiagnosisEvidenceItem[] = [];
      const missing: string[] = [];

      // Symptom distribution evidence
      if (part === 'leaves_lower' || symptoms.distribution === 'old_leaves') {
        supporting.push({
          description: 'Yellowing primarily affects lower, older leaves first, typical of early root waterlogging.',
          source: 'user_observation'
        });
      }

      // Soil moisture sensor evidence
      if (latestSoilMoisture && !isMoistureStale && latestSoilMoisture.value >= 60) {
        supporting.push({
          description: `Physical soil moisture sensor measured ${latestSoilMoisture.value}%, indicating continuously saturated potting medium.`,
          source: 'sensor_measurement',
          timestamp: latestSoilMoisture.timestamp
        });
      } else if (latestSoilMoisture && !isMoistureStale && latestSoilMoisture.value < 25) {
        conflicting.push({
          description: `Soil moisture sensor measured low moisture (${latestSoilMoisture.value}%), making overwatering unlikely.`,
          source: 'sensor_measurement',
          timestamp: latestSoilMoisture.timestamp
        });
      } else if (latestSoilMoisture && isMoistureStale) {
        supporting.push({
          description: `Historical soil moisture was ${latestSoilMoisture.value}%, but measurement is older than 24h and needs fresh confirmation.`,
          source: 'sensor_measurement',
          isStale: true,
          timestamp: latestSoilMoisture.timestamp
        });
        missing.push('Fresh soil moisture test needed (current reading is older than 24h).');
      }

      // Care history evidence
      if (lastSoilCheck && hoursSinceSoilCheck !== null && hoursSinceSoilCheck < 24 && lastSoilCheck.soilCondition === 'moist') {
        supporting.push({
          description: `Finger soil test ${Math.round(hoursSinceSoilCheck)}h ago confirmed soil was moist at 1 inch depth.`,
          source: 'user_observation',
          timestamp: lastSoilCheck.timestamp
        });
      } else if (lastSoilCheck && hoursSinceSoilCheck !== null && hoursSinceSoilCheck < 24 && lastSoilCheck.soilCondition === 'dry') {
        conflicting.push({
          description: `Finger soil test ${Math.round(hoursSinceSoilCheck)}h ago reported dry soil at 1 inch depth.`,
          source: 'user_observation',
          timestamp: lastSoilCheck.timestamp
        });
      }

      // Recent watering evidence
      if (hoursSinceWater !== null && hoursSinceWater < 18) {
        supporting.push({
          description: `Plant was watered recently (${Math.round(hoursSinceWater)}h ago).`,
          source: 'user_observation'
        });
      } else if (hoursSinceWater !== null && hoursSinceWater > 120) {
        conflicting.push({
          description: `Plant has not been watered in ${Math.round(hoursSinceWater / 24)} days.`,
          source: 'user_observation'
        });
      }

      // Botanical requirement evidence
      if (resolvedPlant) {
        supporting.push({
          description: `Botanical guidance: "${resolvedPlant.wateringText || 'Allow top inch to dry between waterings'}"`,
          source: 'verified_botanical',
          attribution: botanicalSource
        });
      }

      // Weather context (Milestone 16) - supporting evidence, not proof
      if (
        environmentalContext &&
        !environmentalContext.isUnavailable &&
        !space.isSheltered &&
        space.type !== 'indoor' &&
        (environmentalContext.snapshot.rainfallMm >= 5 || environmentalContext.snapshot.humidityPercent >= 85)
      ) {
        supporting.push({
          description: `Outdoor weather recorded rainfall (${environmentalContext.snapshot.rainfallMm}mm) and high relative humidity (${environmentalContext.snapshot.humidityPercent}%), sustaining moisture in exposed containers. (Note: Weather is supporting context, not proof of disease).`,
          source: 'general_precaution',
          timestamp: environmentalContext.snapshot.timestamp
        });
      }

      // Missing info check
      if (!latestSoilMoisture && !lastSoilCheck) {
        missing.push('Soil dampness at 1 inch depth has not been checked today.');
      }
      missing.push('Confirmation of clear drainage holes at the base of the container.');

      const freshActiveEvidenceCount = supporting.filter(
        (s) => !s.isStale && s.source !== 'verified_botanical'
      ).length;

      const strength: DiagnosisEvidenceStrength =
        conflicting.length > 0 || isMoistureStale
          ? 'possible'
          : freshActiveEvidenceCount >= 2
          ? 'likely'
          : 'possible';

      candidateCauses.push({
        id: 'cause-overwatering',
        title: 'Overwatering & Root Hypoxia',
        explanation:
          'Soggy potting mix prevents plant roots from absorbing oxygen. Drowned roots cannot pump water or nutrients upwards, leading to yellowing lower leaves and limp stems.',
        strength,
        supportingEvidence: supporting,
        conflictingEvidence: conflicting,
        missingInformation: missing,
        safeTreatmentSteps: [
          'Pause surface watering immediately until top 1 inch of soil feels dry to the touch.',
          'Empty any standing runoff water accumulated in the container saucer.',
          'Verify that drainage holes at the bottom of the container are not blocked by compacted soil or debris.',
          'Place the plant in bright, indirect light with good airflow to assist natural transpiration.'
        ],
        urgentEscalationTriggers: [
          'If the stem base near the soil line turns black, mushy, or smells foul, root rot has progressed. Take healthy top cuttings immediately.'
        ],
        suggestedCareAction: {
          category: 'inspection',
          title: 'Drainage & Soil Moisture Aeration Check',
          description: `Inspect pot drainage holes and ensure soil surface dries out before giving ${plantName} any more water.`,
          priority: 'high'
        }
      });
    }

    // ==========================================
    // CAUSE 2: Underwatering & Desiccation Stress
    // ==========================================
    if (
      sym === 'wilting' ||
      sym === 'brown_leaves' ||
      sym === 'drooping' ||
      sym === 'leaf_drop'
    ) {
      const supporting: DiagnosisEvidenceItem[] = [];
      const conflicting: DiagnosisEvidenceItem[] = [];
      const missing: string[] = [];

      // Soil sensor
      if (latestSoilMoisture && !isMoistureStale && latestSoilMoisture.value < 25) {
        supporting.push({
          description: `Soil moisture sensor confirms very dry potting mix (${latestSoilMoisture.value}%).`,
          source: 'sensor_measurement',
          timestamp: latestSoilMoisture.timestamp
        });
      } else if (latestSoilMoisture && !isMoistureStale && latestSoilMoisture.value >= 60) {
        conflicting.push({
          description: `Soil moisture sensor indicates adequate moisture (${latestSoilMoisture.value}%).`,
          source: 'sensor_measurement',
          timestamp: latestSoilMoisture.timestamp
        });
      }

      // Watering history
      if (hoursSinceWater !== null && hoursSinceWater > 72) {
        supporting.push({
          description: `It has been ${Math.round(hoursSinceWater / 24)} days since the last recorded watering.`,
          source: 'user_observation'
        });
      } else if (hoursSinceWater !== null && hoursSinceWater < 12) {
        conflicting.push({
          description: `Plant was watered just ${Math.round(hoursSinceWater)}h ago.`,
          source: 'user_observation'
        });
      }

      // Heat context
      if (latestAirTemp && !isTempStale && latestAirTemp.value >= 32) {
        supporting.push({
          description: `Warm temperature (${latestAirTemp.value}°C) accelerates moisture loss from container root zones.`,
          source: 'sensor_measurement',
          timestamp: latestAirTemp.timestamp
        });
      } else if (
        environmentalContext &&
        !environmentalContext.isUnavailable &&
        (environmentalContext.snapshot.temperatureC >= 32 || environmentalContext.snapshot.maxTemperatureC >= 33)
      ) {
        supporting.push({
          description: `Ambient weather temperature (${environmentalContext.snapshot.temperatureC}°C, forecast high ${environmentalContext.snapshot.maxTemperatureC}°C) accelerates container drying. (Note: Weather is supporting context, not proof of disease).`,
          source: 'general_precaution',
          timestamp: environmentalContext.snapshot.timestamp
        });
      }

      if (notes.includes('crisp') || notes.includes('dry') || notes.includes('crunchy')) {
        supporting.push({
          description: 'Gardener notes crispy, dry leaf texture.',
          source: 'user_observation'
        });
      }

      missing.push('Finger soil test depth confirmation at 1–2 inches deep.');

      const strength: DiagnosisEvidenceStrength =
        conflicting.length > 0
          ? 'possible'
          : supporting.length >= 2
          ? 'likely'
          : 'possible';

      candidateCauses.push({
        id: 'cause-underwatering',
        title: 'Underwatering & Dehydration',
        explanation:
          'When container soil dries out completely, root hairs desiccate and lose turgor pressure. Leaves droop and margins turn crispy and brown.',
        strength,
        supportingEvidence: supporting,
        conflictingEvidence: conflicting,
        missingInformation: missing,
        safeTreatmentSteps: [
          'Confirm soil dryness with finger before deep watering.',
          'Give the plant a slow, thorough drink at the base until water emerges from the bottom drainage holes.',
          'If potting mix has shrunk away from container walls, bottom-water by placing the pot in a shallow tub of water for 20 minutes.',
          'Snip completely dead, crispy brown leaves to help the plant conserve energy.',
          'Mulch container surface with coco-chips or crushed dry leaves to preserve moisture.'
        ],
        suggestedCareAction: {
          category: 'watering',
          title: `Thorough Base Watering for ${plantName}`,
          description: 'Rehydrate root ball slowly and check that water penetrates the potting mix rather than channeling along pot edges.',
          priority: 'high'
        }
      });
    }

    // ==========================================
    // CAUSE 3: High Temperature Stress / Heat Scorch
    // ==========================================
    if (
      sym === 'brown_leaves' ||
      sym === 'curling' ||
      sym === 'drooping' ||
      sym === 'spots'
    ) {
      const supporting: DiagnosisEvidenceItem[] = [];
      const conflicting: DiagnosisEvidenceItem[] = [];
      const missing: string[] = [];

      const maxTempTolerance = resolvedPlant?.temperatureRequirements?.maxC || 36;

      if (latestAirTemp && !isTempStale && latestAirTemp.value >= maxTempTolerance) {
        supporting.push({
          description: `Measured air temperature (${latestAirTemp.value}°C) exceeds documented heat tolerance (${maxTempTolerance}°C).`,
          source: 'sensor_measurement',
          attribution: botanicalSource,
          timestamp: latestAirTemp.timestamp
        });
      } else if (latestAirTemp && !isTempStale && latestAirTemp.value < 28) {
        conflicting.push({
          description: `Measured air temperature (${latestAirTemp.value}°C) is well within pleasant growth range.`,
          source: 'sensor_measurement',
          timestamp: latestAirTemp.timestamp
        });
      }

      if (part === 'new_growth' || part === 'leaves_upper') {
        supporting.push({
          description: 'Upper canopy and tender new shoots are curling inward to reduce solar radiation exposure.',
          source: 'user_observation'
        });
      }

      if (symptoms.progression === 'sudden_1_2_days') {
        supporting.push({
          description: 'Sudden onset coincides with direct exposure or recent hot afternoon.',
          source: 'user_observation'
        });
      }

      missing.push('Afternoon direct sun hours on the container.');

      const strength: DiagnosisEvidenceStrength =
        conflicting.length > 0
          ? 'possible'
          : supporting.length >= 2
          ? 'likely'
          : 'possible';

      candidateCauses.push({
        id: 'cause-heat-stress',
        title: 'Heat Stress & Sun Scorch',
        explanation:
          'High ambient temperatures and intense direct midday sun cause leaf margins to curl, scorch, and lose moisture faster than roots can replace it.',
        strength,
        supportingEvidence: supporting,
        conflictingEvidence: conflicting,
        missingInformation: missing,
        safeTreatmentSteps: [
          'Shift the container into bright, dappled shade during peak heat hours (11:30 AM to 3:30 PM).',
          'Never spray or mist foliage in direct hot midday sun, as water droplets can focus light and scorch leaves.',
          'Provide a buffer saucer or insulating outer pot to protect roots from hot ceramic/plastic container walls.',
          'Check soil dampness in the morning before heat sets in.'
        ],
        suggestedCareAction: {
          category: 'protection',
          title: `Midday Heat Shielding for ${plantName}`,
          description: 'Move container back from hot reflective walls and provide midday shade during extreme sunny hours.',
          priority: 'normal'
        }
      });
    }

    // ==========================================
    // CAUSE 4: Nutrient Deficiency / Soil Depletion
    // ==========================================
    if (
      sym === 'yellow_leaves' ||
      sym === 'stunted_growth' ||
      sym === 'not_flowering' ||
      sym === 'not_growing'
    ) {
      const supporting: DiagnosisEvidenceItem[] = [];
      const conflicting: DiagnosisEvidenceItem[] = [];
      const missing: string[] = [];

      if (symptoms.progression === 'chronic_weeks' || symptoms.progression === 'gradual_past_week') {
        supporting.push({
          description: 'Gradual, steady development over several weeks points toward nutrient exhaustion rather than acute shock.',
          source: 'user_observation'
        });
      } else if (symptoms.progression === 'sudden_1_2_days') {
        conflicting.push({
          description: 'Sudden 24–48h onset is more characteristic of moisture or temperature shock than nutrient depletion.',
          source: 'user_observation'
        });
      }

      if (part === 'leaves_lower' || symptoms.distribution === 'old_leaves') {
        supporting.push({
          description: 'Uniform yellowing on older lower leaves indicates mobile nitrogen relocation to support new tips.',
          source: 'verified_botanical',
          attribution: 'ICAR Plant Nutrition Guide'
        });
      }

      // Check lifecycle stage
      if (lifecycleStage === 'flowering' || lifecycleStage === 'fruiting') {
        supporting.push({
          description: `Plant is in high-energy ${lifecycleStage} stage, requiring steady organic nutrient replenishment.`,
          source: 'user_observation'
        });
      }

      // Check Vision AI enrichment
      if (
        visionResult &&
        (visionResult.observations?.leafCondition?.toLowerCase().includes('chlorosis') ||
          visionResult.observations?.discoloration?.toLowerCase().includes('yellow') ||
          visionResult.possibleCauses?.some((c) => c.toLowerCase().includes('nutrient')))
      ) {
        supporting.push({
          description: `AI Vision analysis note: ${visionResult.observations.leafCondition || 'Interveinal chlorosis observed on foliage'}`,
          source: 'image_analysis'
        });
      }

      missing.push('Date of last potting soil compost refresh or top-dressing.');

      const strength: DiagnosisEvidenceStrength =
        conflicting.length > 0
          ? 'possible'
          : supporting.length >= 2
          ? 'likely'
          : 'possible';

      candidateCauses.push({
        id: 'cause-chlorosis',
        title: 'Nutrient Chlorosis & Soil Depletion',
        explanation:
          'Container potting mixes leach nutrients over time. When soil nitrogen or micro-nutrients are depleted, plants cannot synthesize adequate chlorophyll, turning leaves pale yellow.',
        strength,
        supportingEvidence: supporting,
        conflictingEvidence: conflicting,
        missingInformation: missing,
        safeTreatmentSteps: [
          'Top-dress the container with a gentle handful (50–100g) of well-rotted vermicompost or composted cow manure.',
          'Water gently with diluted compost tea or seaweed extract to deliver gentle organic nutrients.',
          'Avoid concentrated chemical fertilizers on dry soil, which can burn sensitive container roots.'
        ],
        suggestedCareAction: {
          category: 'feeding',
          title: `Organic Compost Top-Dress for ${plantName}`,
          description: 'Top-dress soil with well-rotted vermicompost and water gently to replenish leached container nutrients.',
          priority: 'normal'
        }
      });
    }

    // ==========================================
    // CAUSE 5: Pest Infestation (Sap-Feeding Insects)
    // ==========================================
    if (
      sym === 'insects' ||
      sym === 'pests' ||
      sym === 'spots' ||
      sym === 'curling'
    ) {
      const supporting: DiagnosisEvidenceItem[] = [];
      const conflicting: DiagnosisEvidenceItem[] = [];
      const missing: string[] = [];

      supporting.push({
        description: 'User reported visible insect activity, webbing, or localized speckling on foliage.',
        source: 'user_observation'
      });

      if (part === 'new_growth' || part === 'leaves_upper') {
        supporting.push({
          description: 'Sap-sucking insects (aphids, thrips, spider mites) preferentially target tender new shoots.',
          source: 'verified_botanical',
          attribution: 'TNAU Home Garden Pest Guide'
        });
      }

      if (visionResult && visionResult.observations?.visibleInsectsOrPests) {
        supporting.push({
          description: `AI Vision observation note: ${visionResult.observations.visibleInsectsOrPests}`,
          source: 'image_analysis'
        });
      }

      missing.push('Check the undersides of leaves and stem joints under good light with a magnifying glass.');

      candidateCauses.push({
        id: 'cause-pests',
        title: 'Sap-Feeding Pest Infestation (Aphids / Mites / Mealybugs)',
        explanation:
          'Tiny insects pierce foliage to extract plant sap, causing stippled spots, curled tips, and stunted growth.',
        strength: 'likely',
        supportingEvidence: supporting,
        conflictingEvidence: conflicting,
        missingInformation: missing,
        safeTreatmentSteps: [
          'Isolate the container 2–3 feet away from nearby plants to prevent spread.',
          'Take the plant outdoors or to the sink and wash the undersides of leaves with a firm stream of water.',
          'For persistent infestations, spray with an organic neem oil solution (5ml cold-pressed neem oil + 2 drops mild dish soap per 1 liter water) at dusk.',
          'Never spray oils during hot daytime hours to prevent leaf sunburn.'
        ],
        urgentEscalationTriggers: [
          'If dense fluffy white cottony clusters (mealybugs) cover stem junctions, wipe them off directly with a cotton swab dipped in rubbing alcohol.'
        ],
        suggestedCareAction: {
          category: 'protection',
          title: `Leaf Underside Pest Check & Wipe for ${plantName}`,
          description: 'Examine leaf undersides, isolate container if needed, and gently wash off soft-bodied pests.',
          priority: 'high'
        }
      });
    }

    // ==========================================
    // CAUSE 6: Fungal Foliar Infection (Leaf Spot / Mildew)
    // ==========================================
    if (sym === 'spots' || sym === 'leaf_drop') {
      const supporting: DiagnosisEvidenceItem[] = [];
      const conflicting: DiagnosisEvidenceItem[] = [];
      const missing: string[] = [];

      supporting.push({
        description: 'Discrete spots or lesions reported on leaf surface.',
        source: 'user_observation'
      });

      if (space.type === 'indoor' || space.type === 'balcony') {
        supporting.push({
          description: 'Enclosed spaces with still air and evening foliage dampness promote fungal spore germination.',
          source: 'general_precaution'
        });
      }

      missing.push('Observation whether spots have distinct yellow halos or fuzzy white powder.');

      candidateCauses.push({
        id: 'cause-leaf-spots',
        title: 'Fungal Leaf Spot or Powdery Mildew',
        explanation:
          'Fungal spores settle on leaves that stay wet for extended periods, especially in humid or crowded conditions with poor air circulation.',
        strength: 'possible',
        supportingEvidence: supporting,
        conflictingEvidence: conflicting,
        missingInformation: missing,
        safeTreatmentSteps: [
          'Water only at the soil line; avoid wetting foliage.',
          'Carefully snip off and discard heavily infected individual leaves. Do not compost them.',
          'Increase spacing between containers to improve gentle air movement around the plant.',
          'Clean pruning scissors with rubbing alcohol between plants to prevent spreading spores.'
        ],
        suggestedCareAction: {
          category: 'pruning',
          title: `Remove Spotted Leaves & Ensure Airflow for ${plantName}`,
          description: 'Snip affected leaves, disinfect shears, and water strictly at base to keep foliage dry.',
          priority: 'normal'
        }
      });
    }

    // ==========================================
    // CAUSE 7: General Inspection Fallback (When evidence is minimal)
    // ==========================================
    if (candidateCauses.length === 0) {
      candidateCauses.push({
        id: 'cause-insufficient-data',
        title: 'Environmental Acclimation or General Observation Check',
        explanation:
          'Available observations indicate mild stress or normal plant growth adjustments. Plants regularly shed older leaves or pause growth during environmental shifts.',
        strength: 'insufficient_evidence',
        supportingEvidence: [
          {
            description: `Reported symptom: ${sym.replace('_', ' ')} (${symptoms.userNotes || 'General check'})`,
            source: 'user_observation'
          }
        ],
        conflictingEvidence: [],
        missingInformation: [
          'Finger test soil moisture depth.',
          'Direct sunlight exposure hours.',
          'Detailed look at leaf undersides.'
        ],
        safeTreatmentSteps: [
          'Observe the plant for 48 hours without changing multiple variables simultaneously.',
          'Do not apply chemical pesticides or heavy fertilizers without confirmed diagnosis.',
          'Confirm that container drainage holes weep freely after watering.',
          'Inspect the soil with your finger before adding any water.'
        ],
        suggestedCareAction: {
          category: 'inspection',
          title: `Baseline 48-Hour Observation for ${plantName}`,
          description: 'Perform a 1-inch finger soil test and observe whether new growth appears healthy.',
          priority: 'low'
        }
      });
    }

    // 5. Rank candidate causes by strength: 'likely' first, then 'possible', then 'insufficient_evidence'
    const strengthWeight: Record<DiagnosisEvidenceStrength, number> = {
      likely: 3,
      possible: 2,
      insufficient_evidence: 1
    };

    candidateCauses.sort((a, b) => strengthWeight[b.strength] - strengthWeight[a.strength]);

    // Overall evidence strength
    const overallStrength: DiagnosisEvidenceStrength = candidateCauses.some((c) => c.strength === 'likely')
      ? 'likely'
      : candidateCauses.some((c) => c.strength === 'possible')
      ? 'possible'
      : 'insufficient_evidence';

    // Summary sentence
    const topCause = candidateCauses[0];
    const summary =
      topCause.strength === 'likely'
        ? `Evidence suggests ${topCause.title} is the most probable cause for ${plantName}'s symptoms.`
        : topCause.strength === 'possible'
        ? `${topCause.title} is a potential factor, but physical soil and environmental checks are needed to confirm.`
        : `Evidence is currently insufficient for a definitive diagnosis. Reversible low-risk inspection is advised.`;

    // Follow-up questions
    const followUpQuestions: string[] = [
      'When you press your finger 1 inch into the pot soil, is it cool and damp or bone dry?',
      'Are the discolored leaves located at the bottom older base or the top fresh shoots?',
      'Does water drain freely from the container bottom within 60 seconds of watering?'
    ];

    const generalPrecautions = [
      'Never apply harsh synthetic pesticides without confirmed pest identification.',
      'Change only one gardening variable at a time (e.g. adjust watering OR shift location, not both at once).',
      'Record outcomes in your garden notebook after 48–72 hours to assess plant recovery.'
    ];

    return {
      id: reportId,
      spaceId: space.id,
      plantInstanceId,
      plantId,
      plantName,
      timestamp: nowIso,
      symptoms,
      summary,
      rankedCauses: candidateCauses,
      overallEvidenceStrength: overallStrength,
      generalPrecautions,
      followUpQuestions,
      isOfflineDeterministic: true,
      aiVisionIncluded: !!visionResult,
      disclaimer:
        'This diagnosis is an advisory educational tool grounded in botanical science and your reported context. Visual observations alone cannot replace a physical soil inspection.'
    };
  }
}

export const plantHealthDiagnosticEngine = new PlantHealthDiagnosticEngine();
