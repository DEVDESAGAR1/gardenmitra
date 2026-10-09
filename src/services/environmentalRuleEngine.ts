import { EnvironmentalAdvice, EnvironmentalContext, GardenSpace, GardenTask, WeatherSnapshot } from '../types';

export class EnvironmentalRuleEngine {
  /**
   * Evaluates weather snapshot and generates conservative, deterministic gardening advice
   */
  evaluateWeather(snapshot: WeatherSnapshot): EnvironmentalAdvice {
    // 1. High Rain / Precipitation rule
    if (snapshot.precipitationProbabilityPercent >= 50 || snapshot.rainfallMm >= 2) {
      return {
        actionType: 'rain',
        headline: 'Rain Likely in the Area',
        advice: 'Rain is expected. Check outdoor containers before watering tonight; pause routine watering if pots are open to the sky.',
        suggestedTask: {
          title: 'Rain Check: Pause watering for open-sky pots',
          description: 'Rain is in the forecast. Inspect whether your containers sit under an awning or direct sky. Avoid watering pots that will receive natural rain.',
          estimatedMinutes: 2,
          category: 'watering'
        }
      };
    }

    // 2. High Heat rule
    if (snapshot.maxTemperatureC >= 33 || snapshot.temperatureC >= 32) {
      return {
        actionType: 'heat',
        headline: 'Warm Conditions Expected',
        advice: 'Warm conditions are expected. Check container plants earlier in the day to prevent midday moisture stress.',
        suggestedTask: {
          title: 'Heat Check: Inspect container moisture early morning',
          description: 'Temperatures are running high. Check soil moisture before midday so plants do not wilt in peak afternoon heat.',
          estimatedMinutes: 2,
          category: 'watering'
        }
      };
    }

    // 3. Strong Wind rule
    if (snapshot.windSpeedKmh >= 22) {
      return {
        actionType: 'wind',
        headline: 'Breezy & Strong Winds Expected',
        advice: 'Strong winds are expected. Check lightweight pots and support tall plants (such as tomatoes and chillies).',
        suggestedTask: {
          title: 'Wind Check: Secure lightweight pots and supports',
          description: 'Check that balcony pots are securely placed and tall stems are lightly tied to bamboo stakes to prevent snapping.',
          estimatedMinutes: 2,
          category: 'maintenance'
        }
      };
    }

    // 4. Normal / Mild conditions rule
    return {
      actionType: 'normal',
      headline: 'Mild & Steady Weather',
      advice: 'Conditions are mild and steady. No major weather-related action needed today. Follow your standard finger moisture routine.',
      suggestedTask: undefined
    };
  }

  /**
   * Generates optional additive weather tasks for specific spaces
   * Does NOT replace existing routine tasks
   */
  generateAdditiveWeatherTasks(
    spaces: GardenSpace[],
    envContext: EnvironmentalContext | null
  ): GardenTask[] {
    if (!envContext) return [];

    const advice = this.evaluateWeather(envContext.snapshot);
    if (!advice.suggestedTask) return [];

    const tasks: GardenTask[] = [];

    // Filter spaces exposed to weather: indoor rooms & windowsills are not exposed to outdoor rain
    const exposedSpaces = spaces.filter((s) => {
      if (s.type === 'indoor' || s.type === 'windowsill') return false;
      if (advice.actionType === 'rain' && s.isSheltered) return false;
      return ['balcony', 'terrace', 'backyard', 'garden', 'pots', 'other'].includes(s.type);
    });

    exposedSpaces.forEach((space) => {
      // Create additive task for each relevant outdoor space
      tasks.push({
        id: `weather-task-${advice.actionType}-${space.id}`,
        spaceId: space.id,
        spaceName: space.name,
        title: `${advice.suggestedTask!.title} (${space.name})`,
        description: advice.suggestedTask!.description,
        estimatedMinutes: advice.suggestedTask!.estimatedMinutes,
        completed: false,
        category: advice.suggestedTask!.category,
        isWeatherDerived: true,
        touchGrassPrompt: 'Notice the breeze and air temperature directly in your space.'
      });
    });

    return tasks;
  }
}

export const environmentalRuleEngine = new EnvironmentalRuleEngine();
