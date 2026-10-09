import { describe, it, expect } from 'vitest';
import { mockWeatherProvider } from '../services/localMockWeatherProvider';
import { environmentalRuleEngine } from '../services/environmentalRuleEngine';
import { taskGenerator } from '../services/localTaskGenerator';
import { BEGINNER_PLANTS } from '../data/plants';
import {
  EnvironmentalContext,
  GardenProfile,
  WeatherSnapshot
} from '../types';

describe('Milestone 2: Environmental Intelligence Foundation', () => {
  const mint = BEGINNER_PLANTS.find((p) => p.id === 'mint')!;

  const baseProfile: GardenProfile = {
    id: 'test-env-profile',
    spaceId: 'space-balcony-test',
    spaceName: 'Sunny Balcony',
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    spaceType: 'balcony',
    spaceSize: 'small',
    sunlight: '2_to_4h',
    experience: 'complete_beginner',
    goal: 'kitchen_garden',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('provides honest mock weather snapshot without claiming live weather connection', async () => {
    const weather = await mockWeatherProvider.getCurrentWeather(baseProfile.location);

    expect(weather.temperatureC).toBeGreaterThan(0);
    expect(weather.humidityPercent).toBeGreaterThan(0);
    expect(weather.conditionText.length).toBeGreaterThan(0);
    // MUST be flagged as mock
    expect(weather.isMock).toBe(true);

    const forecast = await mockWeatherProvider.getForecast(baseProfile.location);
    expect(forecast.source).toBe('demo_local_mock');
    expect(forecast.confidence).toBe('simulated_educational');
    expect(forecast.daily.length).toBe(3);
  });

  it('triggers rain rule when rain or high precipitation probability is expected', () => {
    const rainySnapshot: WeatherSnapshot = {
      temperatureC: 22,
      minTemperatureC: 19,
      maxTemperatureC: 24,
      humidityPercent: 88,
      precipitationProbabilityPercent: 75,
      rainfallMm: 5.5,
      windSpeedKmh: 15,
      cloudCoverPercent: 90,
      conditionText: 'Thunderstorms and heavy rain',
      timestamp: new Date().toISOString(),
      isMock: true
    };

    const advice = environmentalRuleEngine.evaluateWeather(rainySnapshot);

    expect(advice.actionType).toBe('rain');
    expect(advice.headline).toContain('Rain');
    expect(advice.advice.toLowerCase()).toContain('outdoor containers');
    expect(advice.suggestedTask).toBeDefined();
    expect(advice.suggestedTask?.category).toBe('watering');
  });

  it('triggers high-temperature rule when hot conditions are expected', () => {
    const hotSnapshot: WeatherSnapshot = {
      temperatureC: 36,
      minTemperatureC: 27,
      maxTemperatureC: 39,
      humidityPercent: 35,
      precipitationProbabilityPercent: 0,
      rainfallMm: 0,
      windSpeedKmh: 10,
      cloudCoverPercent: 5,
      conditionText: 'Blazing Sun & Heatwave',
      timestamp: new Date().toISOString(),
      isMock: true
    };

    const advice = environmentalRuleEngine.evaluateWeather(hotSnapshot);

    expect(advice.actionType).toBe('heat');
    expect(advice.headline).toContain('Warm');
    expect(advice.advice.toLowerCase()).toContain('earlier in the day');
    expect(advice.suggestedTask).toBeDefined();
  });

  it('triggers strong wind rule when wind speeds exceed conservative thresholds', () => {
    const windySnapshot: WeatherSnapshot = {
      temperatureC: 21,
      minTemperatureC: 16,
      maxTemperatureC: 23,
      humidityPercent: 60,
      precipitationProbabilityPercent: 10,
      rainfallMm: 0,
      windSpeedKmh: 28,
      cloudCoverPercent: 40,
      conditionText: 'Gusty Balcony Winds',
      timestamp: new Date().toISOString(),
      isMock: true
    };

    const advice = environmentalRuleEngine.evaluateWeather(windySnapshot);

    expect(advice.actionType).toBe('wind');
    expect(advice.headline).toContain('Wind');
    expect(advice.advice.toLowerCase()).toContain('support tall plants');
    expect(advice.suggestedTask).toBeDefined();
  });

  it('triggers normal-condition rule when weather is mild and steady', () => {
    const mildSnapshot: WeatherSnapshot = {
      temperatureC: 24,
      minTemperatureC: 18,
      maxTemperatureC: 26,
      humidityPercent: 55,
      precipitationProbabilityPercent: 10,
      rainfallMm: 0,
      windSpeedKmh: 10,
      cloudCoverPercent: 20,
      conditionText: 'Pleasant & Mild',
      timestamp: new Date().toISOString(),
      isMock: true
    };

    const advice = environmentalRuleEngine.evaluateWeather(mildSnapshot);

    expect(advice.actionType).toBe('normal');
    expect(advice.headline).toContain('Mild');
    expect(advice.suggestedTask).toBeUndefined();
  });

  it('generates additive weather tasks without destroying or replacing existing routine tasks', () => {
    const rainySnapshot: WeatherSnapshot = {
      temperatureC: 20,
      minTemperatureC: 17,
      maxTemperatureC: 22,
      humidityPercent: 85,
      precipitationProbabilityPercent: 80,
      rainfallMm: 6,
      windSpeedKmh: 12,
      cloudCoverPercent: 85,
      conditionText: 'Rain expected',
      timestamp: new Date().toISOString(),
      isMock: true
    };

    const envContext: EnvironmentalContext = {
      location: baseProfile.location,
      snapshot: rainySnapshot,
      source: 'demo_mock',
      confidence: 'simulated_educational',
      timestamp: new Date().toISOString()
    };

    // Standard tasks without weather
    const standardTasks = taskGenerator.generateDailyTasks([mint], baseProfile);

    // Weather-aware tasks with rain
    const weatherTasks = taskGenerator.generateDailyTasks(
      [mint],
      baseProfile,
      'space-balcony-test',
      'Sunny Balcony',
      envContext
    );

    // 1. Must include all standard tasks (e.g. finger moisture check)
    expect(weatherTasks.some((t) => t.id.includes('task-check-moisture'))).toBe(true);

    // 2. Must append the additive weather task
    const additiveWeatherTask = weatherTasks.find((t) => t.isWeatherDerived);
    expect(additiveWeatherTask).toBeDefined();
    expect(additiveWeatherTask?.id).toContain('weather-task-rain');
    expect(additiveWeatherTask?.title).toContain('Rain Check');

    // 3. Count of tasks with weather should be strictly greater than standard tasks
    expect(weatherTasks.length).toBeGreaterThan(standardTasks.length);
  });
});
