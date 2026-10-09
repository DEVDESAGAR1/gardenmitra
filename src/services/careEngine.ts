import {
  GardenPlant,
  GardenSpace,
  EnvironmentalContext,
  CareEvent,
  CareDecision,
  CareReminder,
  CareReminderType,
  GardenTask
} from '../types';

/**
 * Deterministic Smart Care & Watering Decision Engine (Milestone 3)
 * Grounded in practical gardening: "Never water on a rigid calendar schedule.
 * Test the soil with your finger."
 */
export class CareEngine {
  /**
   * Evaluates current care recommendation for a plant in a specific space.
   * Deterministic, conservative, explainable rules.
   */
  evaluateCareDecision(
    gardenPlant: GardenPlant,
    space: GardenSpace,
    env: EnvironmentalContext | null,
    currentDate: Date = new Date()
  ): CareDecision {
    const { plant, lastWateredAt, careHistory = [] } = gardenPlant;
    const now = currentDate.getTime();

    // 1. Check most recent care event
    const recentEvents = [...careHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastEvent = recentEvents[0];

    // If soil was checked very recently (within past 12 hours)
    if (lastEvent && lastEvent.type === 'soil_checked') {
      const hoursSinceCheck = (now - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCheck < 12) {
        if (lastEvent.soilCondition === 'dry') {
          return {
            action: 'water',
            headline: 'Soil is dry — water gently',
            reason: `Your finger test indicated the soil was dry. Give ${plant.name} a gentle, slow drink at the base until water just drains from the bottom.`,
            urgency: 'high',
            recommendedNextStep: 'Water directly onto the potting mix, keeping foliage dry.'
          };
        } else if (lastEvent.soilCondition === 'moist') {
          return {
            action: 'wait',
            headline: 'Soil still moist — wait',
            reason: `Your recent check confirmed the top inch of soil still has moisture. Overwatering suffocates roots. Let the soil breathe.`,
            urgency: 'low',
            recommendedNextStep: 'Check again tomorrow or if leaves show signs of drooping.'
          };
        }
      }
    }

    // 2. Check if watered today (within past 18 hours)
    if (lastWateredAt) {
      const hoursSinceWater = (now - new Date(lastWateredAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceWater < 18) {
        return {
          action: 'wait',
          headline: 'Watered recently',
          reason: `Your ${plant.name} was watered recently (${Math.round(hoursSinceWater)} hours ago). Roots need oxygen between waterings.`,
          urgency: 'low',
          recommendedNextStep: 'Enjoy watching new growth! No watering needed today.'
        };
      }
    }

    // 3. Environmental Factor: Impending Rain on Outdoor Containers
    const isOutdoor = ['balcony', 'terrace', 'backyard', 'garden', 'pots'].includes(space.type);
    if (env && isOutdoor) {
      const rainExpected =
        env.snapshot.precipitationProbabilityPercent >= 50 ||
        env.snapshot.rainfallMm > 2 ||
        env.snapshot.conditionText.toLowerCase().includes('rain');

      if (rainExpected) {
        return {
          action: 'check_soil',
          headline: 'Rain expected — check before watering',
          reason: `Rain is expected in ${env.location.city || 'your area'}. You probably don't need to water your outdoor ${space.name} plants now. Check the soil before watering.`,
          urgency: 'normal',
          recommendedNextStep: 'Push your finger 1 inch into the pot. If damp, let nature do the watering.'
        };
      }
    }

    // 4. Environmental Factor: Extreme Heat / Dry Winds
    if (env) {
      if (env.snapshot.temperatureC >= 32 || env.snapshot.maxTemperatureC >= 34) {
        return {
          action: 'check_soil',
          headline: 'Warm weather moisture check',
          reason: `Warm conditions (${env.snapshot.temperatureC}°C) evaporate container moisture rapidly. Check the top inch of soil for your ${plant.name}.`,
          urgency: 'high',
          recommendedNextStep: 'Check earlier in the morning before midday sun warms the pot.'
        };
      }

      if (env.snapshot.windSpeedKmh >= 28) {
        return {
          action: 'check_soil',
          headline: 'Breezy day check',
          reason: `Wind speeds of ${env.snapshot.windSpeedKmh} km/h draw moisture out of foliage and soil surface. Check moisture levels.`,
          urgency: 'normal',
          recommendedNextStep: 'Inspect container stability and soil dampness.'
        };
      }
    }

    // 5. Default Baseline Check: Recommend Finger Soil Test
    if (!lastWateredAt) {
      return {
        action: 'check_soil',
        headline: 'First soil moisture check',
        reason: `${plant.name} hasn't been logged for watering yet. Test the soil depth with your finger to establish a baseline.`,
        urgency: 'normal',
        recommendedNextStep: 'Push your index finger 1 inch deep. Water only if dry.'
      };
    }

    const daysSinceWater = Math.floor(
      (now - new Date(lastWateredAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceWater >= 2) {
      return {
        action: 'check_soil',
        headline: 'Routine soil check',
        reason: `Your ${plant.name} in ${space.name} was last watered ${daysSinceWater} day${daysSinceWater > 1 ? 's' : ''} ago. Check the soil before watering again.`,
        urgency: 'normal',
        recommendedNextStep: 'Finger test: if dry at 1 inch depth, water gently.'
      };
    }

    return {
      action: 'inspect',
      headline: 'Quick visual inspection',
      reason: `Soil conditions are likely stable. Spend 60 seconds admiring new leaves and checking undersides for pests.`,
      urgency: 'low',
      recommendedNextStep: 'Touch grass: observe your plant in quiet outdoor daylight.'
    };
  }

  /**
   * Creates a typed CareEvent for watering.
   */
  createWateringEvent(plantId: string, spaceId: string, note?: string): CareEvent {
    return {
      id: 'care-water-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      plantId,
      spaceId,
      type: 'watered',
      timestamp: new Date().toISOString(),
      note: note || 'Watered thoroughly at plant base'
    };
  }

  /**
   * Creates a typed CareEvent for checking soil moisture.
   */
  createSoilCheckEvent(
    plantId: string,
    spaceId: string,
    condition: 'dry' | 'moist',
    note?: string
  ): CareEvent {
    return {
      id: 'care-soil-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      plantId,
      spaceId,
      type: 'soil_checked',
      timestamp: new Date().toISOString(),
      soilCondition: condition,
      note: note || (condition === 'dry' ? 'Finger test: soil felt dry at 1 inch' : 'Finger test: soil felt moist at 1 inch')
    };
  }

  /**
   * Prevents rapid duplicate watering clicks within a short threshold (e.g., 5 minutes)
   */
  canWaterNow(gardenPlant: GardenPlant, thresholdMinutes: number = 5): { allowed: boolean; reason?: string } {
    if (!gardenPlant.lastWateredAt) {
      return { allowed: true };
    }

    const diffMinutes =
      (Date.now() - new Date(gardenPlant.lastWateredAt).getTime()) / (1000 * 60);

    if (diffMinutes < thresholdMinutes) {
      return {
        allowed: false,
        reason: `Watering was already recorded ${Math.round(diffMinutes)} minute(s) ago. Avoid logging duplicates.`
      };
    }

    return { allowed: true };
  }

  /**
   * Generates actionable daily care tasks and reminders for plants in a space.
   */
  generateCareTasks(
    space: GardenSpace,
    env: EnvironmentalContext | null
  ): GardenTask[] {
    const tasks: GardenTask[] = [];

    space.plants.forEach((gp) => {
      const decision = this.evaluateCareDecision(gp, space, env);

      if (decision.action === 'check_soil') {
        tasks.push({
          id: `task-care-soil-${space.id}-${gp.plantId}`,
          title: `Check soil moisture for ${gp.plant.name}`,
          description: decision.reason,
          estimatedMinutes: 2,
          completed: false,
          status: 'pending',
          plantName: gp.plant.name,
          plantId: gp.plantId,
          spaceId: space.id,
          spaceName: space.name,
          category: 'watering',
          actionType: 'check_soil',
          touchGrassPrompt: `Poke your finger 1 inch into the pot soil of your ${gp.plant.name}. If dry, give it a drink.`
        });
      } else if (decision.action === 'water') {
        tasks.push({
          id: `task-care-water-${space.id}-${gp.plantId}`,
          title: `Water ${gp.plant.name}`,
          description: decision.reason,
          estimatedMinutes: 3,
          completed: false,
          status: 'pending',
          plantName: gp.plant.name,
          plantId: gp.plantId,
          spaceId: space.id,
          spaceName: space.name,
          category: 'watering',
          actionType: 'water',
          touchGrassPrompt: `Water ${gp.plant.name} slowly until excess drips out of the drainage holes.`
        });
      } else if (decision.action === 'inspect') {
        tasks.push({
          id: `task-care-inspect-${space.id}-${gp.plantId}`,
          title: `Inspect ${gp.plant.name} foliage`,
          description: `Check leaves of ${gp.plant.name} for balanced sunlight exposure and healthy green growth.`,
          estimatedMinutes: 2,
          completed: false,
          status: 'pending',
          plantName: gp.plant.name,
          plantId: gp.plantId,
          spaceId: space.id,
          spaceName: space.name,
          category: 'inspection',
          actionType: 'inspect',
          touchGrassPrompt: `Spend 60 seconds observing ${gp.plant.name} in natural daylight.`
        });
      }
    });

    return tasks;
  }

  /**
   * Generates local care reminders for a space
   */
  generateReminders(
    space: GardenSpace,
    env: EnvironmentalContext | null
  ): CareReminder[] {
    const reminders: CareReminder[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    space.plants.forEach((gp) => {
      const decision = this.evaluateCareDecision(gp, space, env);
      let reminderType: CareReminderType = 'check_soil';

      if (decision.action === 'water') {
        reminderType = 'watering_check';
      } else if (decision.action === 'inspect') {
        reminderType = 'inspect';
      }

      reminders.push({
        id: `reminder-${space.id}-${gp.plantId}-${todayStr}`,
        plantId: gp.plantId,
        spaceId: space.id,
        type: reminderType,
        scheduledFor: todayStr,
        status: 'pending',
        reason: `${gp.plant.name} in ${space.name}: ${decision.headline}`
      });
    });

    return reminders;
  }
}

export const careEngine = new CareEngine();
