import { LocationInfo, WeatherForecast, WeatherSnapshot } from '../types';
import { WeatherProvider } from './types';

export class LocalMockWeatherProvider implements WeatherProvider {
  readonly id = 'local-mock-weather-provider';
  readonly name = 'Demo Local Environmental Provider';
  readonly isLocalMock = true;

  async getCurrentWeather(location: LocationInfo): Promise<WeatherSnapshot> {
    const city = (location?.city || '').toLowerCase();

    // Deterministic educational presets based on geographic nature
    if (city.includes('mumbai') || city.includes('chennai') || city.includes('goa')) {
      return {
        temperatureC: 30,
        minTemperatureC: 25,
        maxTemperatureC: 33,
        humidityPercent: 78,
        precipitationProbabilityPercent: 20,
        rainfallMm: 0,
        windSpeedKmh: 14,
        cloudCoverPercent: 25,
        conditionText: 'Warm & Humid Coastal Breeze',
        timestamp: new Date().toISOString(),
        isMock: true
      };
    }

    if (city.includes('london') || city.includes('seattle')) {
      return {
        temperatureC: 16,
        minTemperatureC: 11,
        maxTemperatureC: 18,
        humidityPercent: 82,
        precipitationProbabilityPercent: 65,
        rainfallMm: 4.2,
        windSpeedKmh: 18,
        cloudCoverPercent: 75,
        conditionText: 'Overcast with Light Showers',
        timestamp: new Date().toISOString(),
        isMock: true
      };
    }

    if (city.includes('delhi') || city.includes('austin') || city.includes('jaipur')) {
      return {
        temperatureC: 34,
        minTemperatureC: 24,
        maxTemperatureC: 37,
        humidityPercent: 42,
        precipitationProbabilityPercent: 5,
        rainfallMm: 0,
        windSpeedKmh: 12,
        cloudCoverPercent: 10,
        conditionText: 'Sunny & Hot Day',
        timestamp: new Date().toISOString(),
        isMock: true
      };
    }

    // Default mild temperate conditions
    return {
      temperatureC: 24,
      minTemperatureC: 18,
      maxTemperatureC: 27,
      humidityPercent: 55,
      precipitationProbabilityPercent: 15,
      rainfallMm: 0,
      windSpeedKmh: 10,
      cloudCoverPercent: 20,
      conditionText: 'Mild & Pleasant Sunshine',
      timestamp: new Date().toISOString(),
      isMock: true
    };
  }

  async getForecast(location: LocationInfo): Promise<WeatherForecast> {
    const current = await this.getCurrentWeather(location);
    const today = new Date();

    const daily = [1, 2, 3].map((offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return {
        date: d.toISOString().split('T')[0],
        maxTempC: current.maxTemperatureC + (offset === 2 ? 1 : -1),
        minTempC: current.minTemperatureC,
        precipitationProbPercent: Math.max(5, current.precipitationProbabilityPercent + (offset === 1 ? 15 : -10)),
        rainfallMm: offset === 1 && current.precipitationProbabilityPercent > 40 ? 3.5 : 0,
        conditionText: current.conditionText
      };
    });

    return {
      current,
      daily,
      location,
      source: 'demo_local_mock',
      confidence: 'simulated_educational'
    };
  }
}

export const mockWeatherProvider = new LocalMockWeatherProvider();
