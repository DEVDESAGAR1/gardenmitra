import { PLANT_CATALOG } from '../data/plants';
import {
  GardenProfile,
  Plant,
  PlantRecommendation,
  EnvironmentalContext,
  SunlightEstimate,
  SunlightZone,
  PlantSearchFilters
} from '../types';
import { PlantKnowledgeProvider } from './types';

export class LocalPlantKnowledgeProvider implements PlantKnowledgeProvider {
  readonly id = 'local-plant-knowledge-provider';
  readonly name = 'Curated Local Plant Knowledge';

  async getAllPlants(): Promise<Plant[]> {
    return PLANT_CATALOG;
  }

  async getPlantById(id: string): Promise<Plant | null> {
    const found = PLANT_CATALOG.find((p) => p.id === id);
    return found || null;
  }

  async searchPlants(query: string = '', filters?: PlantSearchFilters): Promise<Plant[]> {
    const q = query.trim().toLowerCase();

    return PLANT_CATALOG.filter((plant) => {
      // 1. Text Query Search (common names, scientific name, hindi, regional names, description)
      if (q) {
        const matchesName = plant.name.toLowerCase().includes(q);
        const matchesHindi = plant.hindiName?.toLowerCase().includes(q);
        const matchesScientific = plant.scientificName?.toLowerCase().includes(q);
        const matchesShortDesc = plant.shortDescription.toLowerCase().includes(q);
        const matchesGuidance = plant.containerGuidance?.toLowerCase().includes(q);

        let matchesRegional = false;
        if (plant.regionalNames) {
          for (const names of Object.values(plant.regionalNames)) {
            if (names.some((n) => n.toLowerCase().includes(q))) {
              matchesRegional = true;
              break;
            }
          }
        }

        if (!matchesName && !matchesHindi && !matchesScientific && !matchesShortDesc && !matchesGuidance && !matchesRegional) {
          return false;
        }
      }

      // 2. Filter criteria
      if (filters) {
        if (filters.category && plant.category !== filters.category) {
          return false;
        }
        if (filters.sunlightRequirement && plant.sunlightRequirement !== filters.sunlightRequirement) {
          return false;
        }
        if (filters.difficulty && plant.difficulty !== filters.difficulty) {
          return false;
        }
        if (filters.edibleOnly && !plant.edible) {
          return false;
        }
        if (filters.petSafeOnly && plant.toxicToPets) {
          return false;
        }
        if (filters.indoorOnly && !plant.indoorSuitable) {
          return false;
        }
        if (filters.maintenance && plant.maintenance !== filters.maintenance) {
          return false;
        }
        if (
          filters.maxContainerDepthCm !== undefined &&
          plant.containerRequirements?.minimumDepthCm &&
          plant.containerRequirements.minimumDepthCm > filters.maxContainerDepthCm
        ) {
          return false;
        }
      }

      return true;
    });
  }

  async getRecommendations(
    profile: GardenProfile,
    env?: EnvironmentalContext | null,
    sunlightContext?: {
      sunlightEstimate?: SunlightEstimate | null;
      sunlightZone?: SunlightZone | null;
    }
  ): Promise<PlantRecommendation[]> {
    // Current Indian season detection
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const city = profile.location?.city?.toLowerCase() || '';
    const state = profile.location?.state?.toLowerCase() || '';

    // Determine broad Indian geographical region
    let geoRegion: 'north' | 'south' | 'east' | 'west' | 'central' | 'coastal' | 'all_india' = 'all_india';
    if (city.includes('mumbai') || city.includes('pune') || state.includes('maharashtra') || state.includes('gujarat') || state.includes('goa')) {
      geoRegion = city.includes('mumbai') || state.includes('goa') ? 'coastal' : 'west';
    } else if (city.includes('delhi') || city.includes('jaipur') || state.includes('punjab') || state.includes('haryana') || state.includes('uttar pradesh') || state.includes('rajasthan')) {
      geoRegion = 'north';
    } else if (city.includes('chennai') || city.includes('bengaluru') || city.includes('hyderabad') || city.includes('kochi') || state.includes('tamil nadu') || state.includes('karnataka') || state.includes('kerala')) {
      geoRegion = city.includes('chennai') || city.includes('kochi') ? 'coastal' : 'south';
    } else if (city.includes('kolkata') || state.includes('bengal') || state.includes('bihar') || state.includes('odisha')) {
      geoRegion = city.includes('kolkata') ? 'coastal' : 'east';
    } else if (city.includes('bhopal') || city.includes('indore') || state.includes('madhya pradesh')) {
      geoRegion = 'central';
    }

    const recommendations: PlantRecommendation[] = PLANT_CATALOG.map((plant) => {
      let score = 50;
      const reasoning: string[] = [];
      const positiveReasons: string[] = [];
      const potentialConflicts: string[] = [];
      const missingInformation: string[] = [];
      let warningNote: string | undefined = undefined;

      // 1. Environmental factor (gentle, conservative)
      if (env) {
        if (env.snapshot.maxTemperatureC >= 34 && (plant.id === 'spinach' || plant.id === 'coriander')) {
          const heatReason = `High seasonal heat (${env.snapshot.maxTemperatureC}°C): Provide midday shade to prevent bolting.`;
          reasoning.push(heatReason);
          potentialConflicts.push(`High ambient temperature (${env.snapshot.maxTemperatureC}°C) may trigger early bolting.`);
        }
      }

      // 2. Beginner friendly match
      if (profile.experience === 'complete_beginner' || profile.experience === 'beginner') {
        if (plant.difficulty === 'Very Easy') {
          score += 25;
          const msg = 'Extremely forgiving for first-time gardeners with low failure risk.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        } else if (plant.difficulty === 'Easy') {
          score += 15;
          const msg = 'Beginner-friendly with straightforward, predictable care.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        } else if (plant.difficulty === 'Challenging') {
          score -= 10;
          potentialConflicts.push('Requires careful monitoring of soil moisture and feeding, better suited for experienced growers.');
        }
      } else {
        score += 10;
        const msg = 'Reliable staple with excellent yield in home setups.';
        reasoning.push(msg);
        positiveReasons.push(msg);
      }

      // 3. Space & Container match (Hard constraint / Soft preference)
      const isContainerSpace = ['balcony', 'windowsill', 'pots', 'indoor', 'other'].includes(profile.spaceType);
      if (isContainerSpace) {
        if (plant.containerFriendly) {
          score += 20;
          const msg = `Thrives well in pots and containers suited for your ${profile.spaceType}.`;
          reasoning.push(msg);
          positiveReasons.push(msg);
        } else {
          score -= 30;
          const conflict = `Deep taproot or large shrub habit makes standard containers restrictive without deep planters.`;
          potentialConflicts.push(conflict);
          warningNote = conflict;
        }

        // Deep container requirement check
        if (profile.spaceType === 'windowsill' && plant.containerRequirements?.minimumDepthCm && plant.containerRequirements.minimumDepthCm > 22) {
          score -= 15;
          potentialConflicts.push(`Windowsill planters may not offer the required ${plant.containerRequirements.minimumDepthCm}cm minimum root depth.`);
        }

        if (profile.spaceSize === 'very_small' || profile.spaceSize === 'small') {
          if (['mint', 'coriander', 'fenugreek', 'sweet-basil'].includes(plant.id)) {
            const msg = 'Compact root depth fits comfortably in compact windowsill or balcony planters.';
            reasoning.push(msg);
            positiveReasons.push(msg);
            score += 15;
          }
        }
      } else {
        // Terrace or garden
        score += 15;
        const msg = `Ideal for your ${profile.spaceType} where plants have plenty of air and root room.`;
        reasoning.push(msg);
        positiveReasons.push(msg);
      }

      // 4. Sunlight alignment (Hard constraint / Soft preference)
      if (profile.sunlight === 'less_than_2h') {
        if (plant.sunlightRequirement === 'low' || plant.sunlightRequirement === 'partial') {
          score += 15;
          const msg = 'Can manage with limited direct sunlight or bright indirect reflection.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        } else {
          score -= 25;
          warningNote = 'This plant prefers more sunlight (5+ hours) and may grow tall and leggy under 2 hours of direct sun.';
          potentialConflicts.push(warningNote);
        }
      } else if (profile.sunlight === '2_to_4h') {
        if (plant.sunlightRequirement === 'partial') {
          score += 25;
          const msg = 'Matches your 2–4 hours of gentle morning or partial sunlight without scorching.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        } else if (plant.sunlightRequirement === 'full') {
          score += 5;
          warningNote = 'Will grow, but fruiting or flowering may be slower without 5+ hours of direct sun.';
          potentialConflicts.push(warningNote);
        }
      } else if (profile.sunlight === '4_to_6h' || profile.sunlight === 'more_than_6h') {
        if (plant.sunlightRequirement === 'full') {
          score += 25;
          const msg = 'Soaks up your strong direct sunlight to produce vigorous stems and abundant harvest.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        } else {
          score += 15;
          const msg = 'Grows vigorously with good light; water regularly during peak midday heat.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        }
      } else {
        // Unknown sunlight reduces certainty
        score += 10;
        reasoning.push('Flexible sunlight tolerance makes it a safe bet while you observe your space.');
        missingInformation.push('Daily sunlight hours not yet confirmed; monitor daily direct sunlight.');
      }

      // Sunlight Zone & Estimate Specific Alignment
      if (sunlightContext?.sunlightZone) {
        const zone = sunlightContext.sunlightZone;
        if (zone.type === 'shade' && plant.sunlightRequirement === 'full') {
          score -= 20;
          warningNote = `${plant.name} may struggle here because "${zone.name}" appears to receive limited direct light. Consider placing it in a brighter zone.`;
          potentialConflicts.push(warningNote);
        } else if (zone.type === 'sunny' && plant.sunlightRequirement === 'full') {
          score += 15;
          const msg = `High sun match: Fits directly into "${zone.name}" with ample solar energy.`;
          reasoning.push(msg);
          positiveReasons.push(msg);
        } else if (zone.type === 'partial_shade' && plant.sunlightRequirement === 'partial') {
          score += 15;
          const msg = `Filtered light match: Ideal candidate for "${zone.name}".`;
          reasoning.push(msg);
          positiveReasons.push(msg);
        }
      } else if (sunlightContext?.sunlightEstimate) {
        const est = sunlightContext.sunlightEstimate;
        if (est.confidence === 'high' || est.confidence === 'moderate') {
          const msg = `Aligned with observed ${est.estimatedHours.replace(/_/g, ' ')} daily sunlight (${est.confidence} confidence).`;
          reasoning.push(msg);
          positiveReasons.push(msg);
        }
      }

      // 5. Goal alignment
      if (profile.goal === 'herbs') {
        if (plant.category === 'herbs') {
          score += 30;
          const msg = 'Directly matches your primary goal to harvest fresh aromatic culinary herbs.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        }
      } else if (profile.goal === 'vegetables') {
        if (plant.category === 'vegetables') {
          score += 30;
          const msg = 'Directly matches your goal to produce fresh, edible homegrown vegetables.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        }
      } else if (profile.goal === 'kitchen_garden') {
        if (plant.category === 'herbs' || plant.category === 'vegetables') {
          score += 25;
          const msg = 'Essential daily kitchen staple for homemade cooking and seasoning.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        }
      } else if (profile.goal === 'flowers') {
        if (plant.category === 'flowers') {
          score += 35;
          const msg = 'Brings bright blooms, pleasant scent, and attracts beneficial garden pollinators.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        }
      } else if (profile.goal === 'easy_plants') {
        if (plant.difficulty === 'Very Easy') {
          score += 25;
          const msg = 'Ranked among the fastest and lowest-maintenance starter plants.';
          reasoning.push(msg);
          positiveReasons.push(msg);
        }
      } else if (profile.goal === 'unknown') {
        score += 10;
        reasoning.push('A versatile crowd favorite recommended for general beginner exploration.');
      }

      // 6. Geographic & Seasonal Guidance (Deterministic Indian Regional Rules)
      if (profile.location?.city) {
        reasoning.push(`Well-tested and reliable for residential setups in ${profile.location.city}.`);
      }

      if (plant.seasonalRules && plant.seasonalRules.length > 0) {
        // Look for matching regional rule or all_india rule
        const matchedRule = plant.seasonalRules.find(
          (r) => (r.region === geoRegion || r.region === 'all_india' || !r.region) && r.months && r.months.includes(currentMonth)
        );

        if (matchedRule) {
          score += 10;
          const seasonNames = matchedRule.seasons.join(', ');
          positiveReasons.push(`Active sowing season: Current month is ideal for planting ${plant.name} in your region (${seasonNames}).`);
        } else {
          // Check if it's year-round
          const yearRound = plant.seasonalRules.some((r) => r.seasons.includes('year_round'));
          if (yearRound) {
            positiveReasons.push(`Adaptable season: Tolerates year-round planting in mild microclimates.`);
          } else {
            potentialConflicts.push(`Outside optimal sowing window for open terrace conditions; shelter early sprouts.`);
          }
        }
      }

      // 7. Safety, Toxicity and Provenance Checks
      if (plant.toxicToPets) {
        potentialConflicts.push('Pet notice: Known to cause gastric discomfort if chewed by cats or dogs.');
      }
      if (plant.edible) {
        positiveReasons.push('Culinary yield: Fresh, safe edible produce for household consumption.');
      }
      if (plant.dataQuality?.status === 'provisional') {
        missingInformation.push('Field verified care intervals pending full agronomic peer review.');
      }

      // 8. Determine Confidence Level & Next Action
      let confidenceLevel: 'high' | 'moderate' | 'tentative' = 'high';
      if (missingInformation.length >= 2 || profile.sunlight === 'unknown') {
        confidenceLevel = 'tentative';
      } else if (missingInformation.length === 1 || !plant.containerRequirements) {
        confidenceLevel = 'moderate';
      }

      // Practical Next Action
      let nextAction = `Check container drainage and prepare a well-aerated potting mix.`;
      if (plant.careInstructions && plant.careInstructions.length > 0) {
        const firstCare = plant.careInstructions[0];
        const categoryPrefix = firstCare.category ? `${firstCare.category.toUpperCase()}: ` : '';
        nextAction = `${categoryPrefix}${firstCare.instruction}`;
      } else if (plant.containerRequirements?.recommendedDepthCm) {
        nextAction = `Choose a container at least ${plant.containerRequirements.recommendedDepthCm}cm deep with drainage holes.`;
      }

      return {
        plant,
        matchScore: Math.min(100, Math.max(10, score)),
        reasoning,
        warningNote,
        positiveReasons,
        potentialConflicts,
        missingInformation,
        confidenceLevel,
        nextAction
      };
    });

    // Sort by highest match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const plantKnowledgeProvider = new LocalPlantKnowledgeProvider();
