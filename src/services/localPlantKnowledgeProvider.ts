import { BEGINNER_PLANTS } from '../data/plants';
import {
  GardenProfile,
  Plant,
  PlantRecommendation,
  EnvironmentalContext,
  SunlightEstimate,
  SunlightZone
} from '../types';
import { PlantKnowledgeProvider } from './types';

export class LocalPlantKnowledgeProvider implements PlantKnowledgeProvider {
  readonly id = 'local-plant-knowledge-provider';
  readonly name = 'Curated Local Plant Knowledge';

  async getAllPlants(): Promise<Plant[]> {
    return BEGINNER_PLANTS;
  }

  async getPlantById(id: string): Promise<Plant | null> {
    const found = BEGINNER_PLANTS.find((p) => p.id === id);
    return found || null;
  }

  async getRecommendations(
    profile: GardenProfile,
    env?: EnvironmentalContext | null,
    sunlightContext?: {
      sunlightEstimate?: SunlightEstimate | null;
      sunlightZone?: SunlightZone | null;
    }
  ): Promise<PlantRecommendation[]> {
    const recommendations: PlantRecommendation[] = BEGINNER_PLANTS.map((plant) => {
      let score = 50;
      const reasoning: string[] = [];
      let warningNote: string | undefined = undefined;

      // Milestone 2: Environmental factor (gentle, conservative)
      if (env) {
        if (env.snapshot.maxTemperatureC >= 34 && (plant.id === 'spinach' || plant.id === 'coriander')) {
          reasoning.push(`High seasonal heat (${env.snapshot.maxTemperatureC}°C): Provide midday shade to prevent bolting.`);
        }
      }

      // 1. Beginner friendly match
      if (profile.experience === 'complete_beginner' || profile.experience === 'beginner') {
        if (plant.difficulty === 'Very Easy') {
          score += 25;
          reasoning.push('Extremely forgiving for first-time gardeners with low failure risk.');
        } else if (plant.difficulty === 'Easy') {
          score += 15;
          reasoning.push('Beginner-friendly with straightforward, predictable care.');
        }
      } else {
        score += 10;
        reasoning.push('Reliable staple with excellent yield in home setups.');
      }

      // 2. Space & Container match
      const isContainerSpace = ['balcony', 'windowsill', 'pots', 'indoor', 'other'].includes(profile.spaceType);
      if (isContainerSpace) {
        if (plant.containerFriendly) {
          score += 20;
          reasoning.push(`Thrives well in pots and containers suited for your ${profile.spaceType}.`);
        }
        if (profile.spaceSize === 'very_small' || profile.spaceSize === 'small') {
          if (plant.id === 'mint' || plant.id === 'coriander' || plant.id === 'fenugreek' || plant.id === 'sweet-basil') {
            score += 15;
            reasoning.push('Compact root depth fits comfortably in compact windowsill or balcony planters.');
          }
        }
      } else {
        // Terrace or garden
        score += 15;
        reasoning.push(`Ideal for your ${profile.spaceType} where plants have plenty of air and root room.`);
      }

      // 3. Sunlight alignment
      if (profile.sunlight === 'less_than_2h') {
        if (plant.sunlightRequirement === 'low' || plant.sunlightRequirement === 'partial') {
          score += 15;
          reasoning.push('Can manage with limited direct sunlight or bright indirect reflection.');
        } else {
          score -= 25;
          warningNote = 'This plant prefers more sunlight (5+ hours) and may grow tall and leggy under 2 hours of direct sun.';
        }
      } else if (profile.sunlight === '2_to_4h') {
        if (plant.sunlightRequirement === 'partial') {
          score += 25;
          reasoning.push('Matches your 2–4 hours of gentle morning or partial sunlight without scorching.');
        } else if (plant.sunlightRequirement === 'full') {
          score += 5;
          warningNote = 'Will grow, but fruiting or flowering may be slower without 5+ hours of direct sun.';
        }
      } else if (profile.sunlight === '4_to_6h' || profile.sunlight === 'more_than_6h') {
        if (plant.sunlightRequirement === 'full') {
          score += 25;
          reasoning.push('Soaks up your strong direct sunlight to produce vigorous stems and abundant harvest.');
        } else {
          score += 15;
          reasoning.push('Grows vigorously with good light; water regularly during peak midday heat.');
        }
      } else {
        // Unknown sunlight
        score += 10;
        reasoning.push('Flexible sunlight tolerance makes it a safe bet while you observe your space.');
      }

      // Milestone 5: Sunlight Zone & Estimate Specific Alignment
      if (sunlightContext?.sunlightZone) {
        const zone = sunlightContext.sunlightZone;
        if (zone.type === 'shade' && plant.sunlightRequirement === 'full') {
          score -= 20;
          warningNote = `${plant.name} may struggle here because "${zone.name}" appears to receive limited direct light. Consider placing it in a brighter zone.`;
        } else if (zone.type === 'sunny' && plant.sunlightRequirement === 'full') {
          score += 15;
          reasoning.push(`High sun match: Fits directly into "${zone.name}" with ample solar energy.`);
        } else if (zone.type === 'partial_shade' && plant.sunlightRequirement === 'partial') {
          score += 15;
          reasoning.push(`Filtered light match: Ideal candidate for "${zone.name}".`);
        }
      } else if (sunlightContext?.sunlightEstimate) {
        const est = sunlightContext.sunlightEstimate;
        if (est.confidence === 'high' || est.confidence === 'moderate') {
          reasoning.push(`Aligned with observed ${est.estimatedHours.replace(/_/g, ' ')} daily sunlight (${est.confidence} confidence).`);
        }
      }

      // 4. Goal alignment
      if (profile.goal === 'herbs') {
        if (plant.category === 'herbs') {
          score += 30;
          reasoning.push('Directly matches your primary goal to harvest fresh aromatic culinary herbs.');
        }
      } else if (profile.goal === 'vegetables') {
        if (plant.category === 'vegetables') {
          score += 30;
          reasoning.push('Directly matches your goal to produce fresh, edible homegrown vegetables.');
        }
      } else if (profile.goal === 'kitchen_garden') {
        if (plant.category === 'herbs' || plant.category === 'vegetables') {
          score += 25;
          reasoning.push('Essential daily kitchen staple for homemade cooking and seasoning.');
        }
      } else if (profile.goal === 'flowers') {
        if (plant.category === 'flowers') {
          score += 35;
          reasoning.push('Brings bright blooms, pleasant scent, and attracts beneficial garden pollinators.');
        }
      } else if (profile.goal === 'easy_plants') {
        if (plant.difficulty === 'Very Easy') {
          score += 25;
          reasoning.push('Ranked among the fastest and lowest-maintenance starter plants.');
        }
      } else if (profile.goal === 'unknown') {
        score += 10;
        reasoning.push('A versatile crowd favorite recommended for general beginner exploration.');
      }

      // 5. Geographic context
      if (profile.location?.city) {
        reasoning.push(`Well-tested and reliable for residential setups in ${profile.location.city}.`);
      }

      return {
        plant,
        matchScore: Math.min(100, Math.max(10, score)),
        reasoning,
        warningNote
      };
    });

    // Sort by highest match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const plantKnowledgeProvider = new LocalPlantKnowledgeProvider();
