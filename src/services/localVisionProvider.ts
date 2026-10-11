import {
  GardenPhoto,
  GardenProfile,
  GardenSpace,
  Plant,
  GardenPlant,
  PlantHealthGuidance,
  PlantSymptom,
  VisionAnalysisResult,
  GardenPhotoAnalysisResult,
  PlantPhotoAnalysisResult,
  ModelAvailabilityStatus,
  EnvironmentalContext,
  MultiMediaAnalysisResult
} from '../types';
import { VisionProvider } from './types';

export class LocalVisionProvider implements VisionProvider {
  readonly id = 'local-vision-provider';
  readonly name = 'Local Safe Vision Provider (No External Model)';
  readonly isLocalMock = true;

  async checkAvailability(): Promise<{
    status: ModelAvailabilityStatus;
    message: string;
    modelsAvailable?: string[];
  }> {
    return {
      status: 'unavailable',
      message: 'Local vision model is not currently connected. Honest safe local guidance is active.'
    };
  }

  async analyzeGardenPhoto(
    photo: GardenPhoto,
    profile?: GardenProfile | null,
    space?: GardenSpace | null
  ): Promise<GardenPhotoAnalysisResult | VisionAnalysisResult> {
    const spaceName = space?.name || (profile?.spaceType ? profile.spaceType.toUpperCase() : 'YOUR GROWING SPACE');

    return {
      status: 'mock_local',
      providerId: this.id,
      timestamp: new Date().toISOString(),
      spaceId: space?.id || profile?.spaceId,
      message: 'Photo saved. AI garden analysis will be available when a vision model is connected.',
      spaceAssessment: `Your ${spaceName} photo has been saved to your local garden notebook. In future releases with a connected vision model (such as Gemma or a local multimodal backend), GardenMitra will identify railing safety, ambient shadow lines, and pot layout options directly from your camera.`,
      recommendedNextStep: 'For now, check your sunlight exposure and explore beginner-friendly plant matches based on your setup answers.',
      photoUrl: photo.dataUrl,
      observations: {
        likelySpaceType: space?.type || profile?.spaceType || 'Domestic growing space',
        visibleGrowingAreas: 'Growing space photo safely saved on device',
        visibleContainers: 'Check your container drainage holes',
        generalVisualObservations: [
          'Photo safely stored on device.',
          'AI garden analysis will run when a local vision model (Ollama / Gemma) is connected.'
        ]
      },
      disclaimer: 'No AI model was executed. Never claiming fabricated computer vision results.'
    };
  }

  async analyzeMultiMedia(
    items: { id: string; dataUrl: string; label?: string }[],
    space?: GardenSpace | null
  ): Promise<MultiMediaAnalysisResult> {
    const spaceName = space?.name || space?.type || 'Garden space';
    return {
      status: 'unavailable',
      providerId: this.id,
      timestamp: new Date().toISOString(),
      spaceId: space?.id,
      likelySpaceType: space?.type || 'Garden space',
      visibleBoundaries: 'Local safe mode active (No on-device model connected)',
      observations: [
        {
          category: 'System',
          description: `Saved ${items.length} photo(s)/keyframe(s) safely to ${spaceName}. Automated multimodal inference requires a connected local Ollama vision model.`,
          confidence: 'low',
          requiresUserConfirmation: false
        }
      ],
      uncertaintiesAndLimitations: [
        'No AI model was executed. Never claiming fabricated computer vision results.',
        'Physical safety, load capacity, and soil moisture must be inspected on-site.'
      ],
      suggestedAdditionalViews: ['Entrance looking outward', 'Drainage outlet and open sky'],
      disclaimer: 'No on-device AI model was executed. Safe local guidance active.'
    };
  }

  async analyzePlantPhoto(
    _photoDataUrl: string,
    context: {
      plant?: Plant | GardenPlant | null;
      symptom?: PlantSymptom;
      space?: GardenSpace | null;
      environmentalContext?: EnvironmentalContext | null;
    }
  ): Promise<PlantPhotoAnalysisResult> {
    const symptom = context.symptom || 'other';
    const guidance = await this.analyzePlantHealth(_photoDataUrl, symptom);
    const plantName = context.plant
      ? 'plant' in context.plant
        ? context.plant.plant.name
        : context.plant.name
      : 'Plant';

    return {
      status: 'mock_local',
      providerId: this.id,
      timestamp: new Date().toISOString(),
      plantId: context.plant && 'plantId' in context.plant ? context.plant.plantId : undefined,
      spaceId: context.space?.id,
      observations: {
        leafCondition: `Educational check for ${plantName} based on selected symptom: ${guidance.symptomTitle}`
      },
      possibleCauses: guidance.possibleCauses,
      safeNextSteps: guidance.immediateSafeActions,
      disclaimer: guidance.disclaimer,
      message: 'Local educational guidance (No external model used).'
    };
  }

  async analyzePlantHealth(
    _photoDataUrl: string,
    symptom: PlantSymptom
  ): Promise<PlantHealthGuidance> {
    const symptomMap: Record<PlantSymptom, PlantHealthGuidance> = {
      yellow_leaves: {
        symptomTitle: 'Yellow Leaves (Chlorosis)',
        possibleCauses: [
          'Overwatering is the #1 beginner culprit: soggy soil suffocates roots and prevents oxygen uptake',
          'Underwatering: if leaves are yellow, limp, and crisp at edges',
          'Natural aging of oldest lower leaves (normal if only 1–2 lower leaves shed)',
          'Nitrogen deficiency in exhausted potting soil'
        ],
        investigationSteps: [
          'Stick your finger 1–2 inches into the pot soil. Is it soggy or bone dry?',
          'Check if the container drainage hole is clogged or trapped in standing saucer water.',
          'Observe whether yellowing is on lower older leaves or tender top new leaves.'
        ],
        immediateSafeActions: [
          'Hold off watering until top 1 inch of soil feels dry to the touch.',
          'Ensure the pot can drain freely without sitting in standing water.',
          'If soil has not been fertilized in 6+ weeks, add a gentle top-dress of vermicompost or compost tea.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Environmental inspection of moisture, light, and roots is essential.'
      },
      brown_leaves: {
        symptomTitle: 'Brown or Crispy Leaves',
        possibleCauses: [
          'Low humidity or dry hot winds scorching delicate leaf margins',
          'Underwatering: prolonged dry spells causing cell collapse',
          'Sunburn: moving a shade-grown seedling abruptly into scorching midday sun',
          'Fertilizer burn from concentrated chemical salts'
        ],
        investigationSteps: [
          'Feel the brown tissue: is it crunchy and dry, or soft and mushy?',
          'Check recent weather changes, high heatwaves, or strong dry winds.'
        ],
        immediateSafeActions: [
          'Move the plant slightly back from reflective hot walls or midday scorch during extreme hours.',
          'Snip completely dead, dry leaves at the base to redirect energy into fresh growth.',
          'Flush the pot with clean water if you recently added concentrated fertilizer.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Brown edges frequently trace back to moisture fluctuation.'
      },
      wilting: {
        symptomTitle: 'Wilting or Drooping Stems',
        possibleCauses: [
          'Underwatering (soil dry, pot feels feather-light)',
          'Overwatering leading to root damage (soil stays damp but stems droop because drowned roots cannot pump water)',
          'Temporary heat stress on a sunny afternoon (often recovers by evening)'
        ],
        investigationSteps: [
          'Lift the pot or test soil depth with your finger.',
          'Check if the plant perks back up 30 minutes after sunset.'
        ],
        immediateSafeActions: [
          'If bone dry: give a deep, slow drink until water drips from the bottom.',
          'If wet and soggy: stop watering immediately, move to indirect airy light, and let soil breathe.',
          'Avoid repotting or disturbing roots while the plant is in shock.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Both too much and too little water cause wilting.'
      },
      spots: {
        symptomTitle: 'Leaf Spots (Dark, Yellow Halo, or White Spots)',
        possibleCauses: [
          'Fungal or bacterial leaf spot from water resting on foliage overnight',
          'Mineral residue from hard tap water spray',
          'Pest feeding points'
        ],
        investigationSteps: [
          'Examine whether spots are spreading across neighboring leaves.',
          'Check if water was splashed onto leaves during evening watering.'
        ],
        immediateSafeActions: [
          'Always water at the base of the plant onto soil, keeping leaves dry.',
          'Carefully prune off heavily spotted isolated leaves with clean scissors and dispose of them (do not compost diseased leaves).',
          'Improve air circulation between closely clustered pots.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Most leaf spots resolve with good airflow and soil-only watering.'
      },
      insects: {
        symptomTitle: 'Visible Insects or Pests',
        possibleCauses: [
          'Aphids (tiny green, black, or brown clusters on new tips)',
          'Mealybugs (white cottony clusters in leaf axils)',
          'Whiteflies (tiny white moth-like insects that flutter when plant is disturbed)',
          'Spider mites (fine webs under leaves)'
        ],
        investigationSteps: [
          'Turn leaves upside down and inspect the tender growing tips.',
          'Check stem joints and crevices where pests love to hide.'
        ],
        immediateSafeActions: [
          'Give the leaves a gentle physical rinse with a water spray to wash off clusters.',
          'Wipe affected stems with a cotton ball dipped in diluted neem oil or mild liquid soap solution (1 tsp mild soap per 1 liter water).',
          'Separate the infested pot from other plants for a few days to avoid spreading.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Gentle non-chemical physical removal is always the best first step.'
      },
      not_growing: {
        symptomTitle: 'Slow Growth or Stunted Plant',
        possibleCauses: [
          'Insufficient sunlight for the plant species',
          'Root-bound in a container that has become too small',
          'Nutrient depletion in old potting soil',
          'Cool weather or seasonal dormancy'
        ],
        investigationSteps: [
          'Count the actual hours of direct sunlight the plant receives each day.',
          'Look at bottom drainage holes: are roots circling tightly out of the bottom?'
        ],
        immediateSafeActions: [
          'Relocate to the sunniest available spot if it receives under 4 hours.',
          'Gently top-dress soil with 2 tablespoons of organic compost or worm castings.',
          'If roots are densely packed, plan a gentle pot upgrade to a 2-inch larger container.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Seasonal temperatures often dictate growth speed.'
      },
      not_flowering: {
        symptomTitle: 'Lush Foliage but No Flowers or Fruit',
        possibleCauses: [
          'Too much nitrogen fertilizer (makes leaves huge and green while delaying flowers)',
          'Not enough direct sunlight (fruiting and flowering require high solar energy)',
          'Plant is still in its juvenile vegetative growth phase'
        ],
        investigationSteps: [
          'Check the age of the plant against typical flowering timelines.',
          'Check sunlight hours: tomatoes and chillies need at least 5 to 6 hours to set flowers.'
        ],
        immediateSafeActions: [
          'Shift to full sun exposure.',
          'Hold back high-nitrogen liquid fertilizers; switch to potassium/phosphorus-rich organic matter like wood ash, bone meal, or composted banana peels.',
          'Gently shake flowering stems once blossoms appear to aid self-pollination.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Light intensity is the most common reason for lack of blooms.'
      },
      curling: {
        symptomTitle: 'Curling or Cupping Leaves',
        possibleCauses: [
          'Heat stress or intense transpiration loss',
          'Sap-sucking pests (aphids, thrips, or mites) hiding on leaf undersides',
          'Underwatering or irregular watering spikes',
          'Herbicide drift or viral infection (rare)'
        ],
        investigationSteps: [
          'Check whether leaves curl upwards (cupping from heat/light) or downwards (pests/overwatering)',
          'Inspect leaf undersides with a magnifying lens or bright torch for tiny pests'
        ],
        immediateSafeActions: [
          'Provide temporary afternoon shade if temperatures exceed 35°C',
          'Inspect undersides and wipe with neem solution if insects are spotted',
          'Check soil moisture 1 inch down and water deeply if dry'
        ],
        disclaimer: 'Curling is a defensive response by the plant to conserve moisture. Check pests and light exposure.'
      },
      drooping: {
        symptomTitle: 'Drooping or Limp Stems',
        possibleCauses: [
          'Underwatering / desiccation',
          'Overwatering / root suffocation causing inability to draw water',
          'Transplant shock or root disturbance',
          'Midday heat temporary wilt'
        ],
        investigationSteps: [
          'Probe the root ball: is the soil dry and pulling from pot edge, or heavy and saturated?',
          'Observe if plant perks up in cooler evening shade'
        ],
        immediateSafeActions: [
          'If soil is bone-dry, bottom-water or gently soak until drainage flows',
          'If soil is soggy, hold off watering and improve airflow around base',
          'Keep out of direct harsh noon sun until turgor pressure recovers'
        ],
        disclaimer: 'Drooping can result from both extreme dry soil and waterlogged roots. Always touch the soil first.'
      },
      leaf_drop: {
        symptomTitle: 'Sudden Leaf Drop / Defoliation',
        possibleCauses: [
          'Sudden environmental shock (drastic light, temperature, or location shift)',
          'Severe drought followed by heavy flooding',
          'Overwatering causing root loss',
          'Drafts from AC or dry hot winds'
        ],
        investigationSteps: [
          'Did you recently relocate the pot or experience an abrupt weather shift?',
          'Are dropped leaves green, yellow, or shriveled?'
        ],
        immediateSafeActions: [
          'Keep the pot in a stable, temperate spot with filtered light',
          'Maintain steady, consistent soil moisture without waterlogging',
          'Allow 7–14 days for new nodes to emerge; avoid heavy fertilizing'
        ],
        disclaimer: 'Leaf drop is frequently shock-induced. Give the plant a stable microclimate to recover.'
      },
      stunted_growth: {
        symptomTitle: 'Stunted or Arrested Growth',
        possibleCauses: [
          'Root-bound container with no room to expand',
          'Soil compaction or nutrient exhaustion',
          'Insufficient light below plant threshold',
          'Cold soil temperatures slowing root metabolism'
        ],
        investigationSteps: [
          'Check container drainage holes for congested roots',
          'Review daily direct sunlight duration against plant requirements'
        ],
        immediateSafeActions: [
          'Top-dress container with 1–2 inches of rich compost or vermicompost',
          'Relocate container to maximize sunlight exposure',
          'Consider repotting to a 20-30% larger container if roots are bound'
        ],
        disclaimer: 'Growth speed depends heavily on ambient season, container volume, and soil aeration.'
      },
      root_concerns: {
        symptomTitle: 'Root System & Base Concerns',
        possibleCauses: [
          'Poor drainage leading to root hypoxia / rot',
          'Root binding / girdling around pot periphery',
          'Soil compaction suffocating root respiration',
          'Fungal pathogens in stagnant media'
        ],
        investigationSteps: [
          'Check base drainage holes for foul odors or dark, mushy root tips',
          'Check whether water pools on the soil surface for minutes before draining'
        ],
        immediateSafeActions: [
          'Ensure drainage holes are completely unobstructed',
          'Allow root zone to aerate by pausing surface watering until topsoil is dry',
          'Add perlite or coarse river sand in future potting mixes for drainage'
        ],
        disclaimer: 'Root health dictates overall plant vitality. Inspect soil texture and drainage flow.'
      },
      pests: {
        symptomTitle: 'Pests & Parasitic Organisms',
        possibleCauses: [
          'Sap-feeding aphids, whiteflies, thrips, or mealybugs',
          'Spider mites thriving in hot, dry microclimates',
          'Caterpillars or leaf miners chewing foliage'
        ],
        investigationSteps: [
          'Inspect leaf undersides, shoot tips, and leaf axils with bright lighting',
          'Check for sticky residue (honeydew) or fine webbing between stems'
        ],
        immediateSafeActions: [
          'Isolate affected plant immediately to safeguard nearby greenery',
          'Physically wash off pests with a gentle water spray',
          'Apply organic neem oil spray (5ml/L with mild soap emulsifier) in late evening'
        ],
        disclaimer: 'Non-chemical physical removal and botanical neem sprays are safe and effective first steps.'
      },
      abnormal_flowering_fruiting: {
        symptomTitle: 'Flower Drop or Abnormal Fruiting',
        possibleCauses: [
          'Extreme temperatures (>35°C or <12°C) causing blossom drop',
          'Incomplete pollination due to lack of pollinators or gentle breeze',
          'Excess nitrogen suppressing bloom set',
          'Irregular watering causing blossom-end issues'
        ],
        investigationSteps: [
          'Check ambient temperatures during bloom window',
          'Observe if flowers open and drop unfertilized'
        ],
        immediateSafeActions: [
          'Maintain consistent soil moisture—avoid cyclical drought and flooding',
          'Gently vibrate or tap flower clusters around 10 AM to assist pollination',
          'Switch to a potassium-rich organic feed (e.g., banana peel bio-enzyme or compost)'
        ],
        disclaimer: 'Flowering and fruit set are sensitive to thermal extremes and moisture fluctuations.'
      },
      other: {
        symptomTitle: 'General Plant Wellness Check',
        possibleCauses: [
          'Environmental adjustment (transplant shock from nursery to your home)',
          'Soil aeration and compaction issues',
          'Microclimate shifts (air conditioning draft, radiant wall heat, rain spell)'
        ],
        investigationSteps: [
          'Review the basic needs of the plant: sun, moisture, and container size.',
          'Check how long the plant has lived in its current spot.'
        ],
        immediateSafeActions: [
          'Keep conditions stable for 5–7 days before making drastic changes.',
          'Verify soil moisture and ensure drainage holes run clear.',
          'Use the "Touch Grass" approach: spend 5 minutes observing your plant in quiet outdoor daylight.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Observational patience often reveals the plant\'s natural resilience.'
      }
    };

    return symptomMap[symptom] || symptomMap.other;
  }
}

export const visionProvider = new LocalVisionProvider();
