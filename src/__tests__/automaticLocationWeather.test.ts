import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserLocationProvider } from '../services/browserLocationProvider';
import { OpenMeteoWeatherProvider, interpretWmoCode } from '../services/openMeteoWeatherProvider';
import { LocalSunPositionProvider } from '../services/localSunPositionProvider';
import { EnvironmentalRuleEngine } from '../services/environmentalRuleEngine';
import { LocalMockWeatherProvider } from '../services/localMockWeatherProvider';
import {
  EnvironmentalContext,
  GardenSpace,
  LocationInfo,
  WeatherSnapshot
} from '../types';

describe('Milestone 7: Automatic Location & Real Environmental Intelligence', () => {
  let locationProvider: BrowserLocationProvider;
  let weatherProvider: OpenMeteoWeatherProvider;
  let sunPositionProvider: LocalSunPositionProvider;
  let ruleEngine: EnvironmentalRuleEngine;
  let mockWeatherProvider: LocalMockWeatherProvider;

  beforeEach(() => {
    locationProvider = new BrowserLocationProvider();
    weatherProvider = new OpenMeteoWeatherProvider();
    sunPositionProvider = new LocalSunPositionProvider();
    ruleEngine = new EnvironmentalRuleEngine();
    mockWeatherProvider = new LocalMockWeatherProvider();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('2.1 Browser Location Provider', () => {
    it('returns "granted" and coordinates when user permits geolocation', async () => {
      const mockCoords = {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 15
      };

      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: mockCoords,
            timestamp: Date.now()
          });
        })
      };

      vi.stubGlobal('navigator', {
        geolocation: mockGeolocation,
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'granted' })
        }
      });

      const permStatus = await locationProvider.getPermissionStatus();
      expect(permStatus).toBe('granted');

      const loc = await locationProvider.requestCurrentLocation();
      expect(loc.latitude).toBeCloseTo(12.9716);
      expect(loc.longitude).toBeCloseTo(77.5946);
      expect(loc.accuracyMeters).toBe(15);
      expect(loc.source).toBe('browser_geolocation');
      expect(loc.city).toBe('Bengaluru');
    });

    it('handles permission denial gracefully with clear error', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((_success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'User denied Geolocation'
          });
        })
      };

      vi.stubGlobal('navigator', {
        geolocation: mockGeolocation
      });

      await expect(locationProvider.requestCurrentLocation()).rejects.toThrow(
        /Location permission was denied/i
      );
    });

    it('handles unsupported environment gracefully', async () => {
      vi.stubGlobal('navigator', {});

      const status = await locationProvider.getPermissionStatus();
      expect(status).toBe('unsupported');

      await expect(locationProvider.requestCurrentLocation()).rejects.toThrow(
        /not supported/i
      );
    });

    it('handles timeout gracefully', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((_success, error) => {
          error({
            code: 3, // TIMEOUT
            message: 'Location request timed out'
          });
        })
      };

      vi.stubGlobal('navigator', {
        geolocation: mockGeolocation
      });

      await expect(locationProvider.requestCurrentLocation()).rejects.toThrow(
        /timed out/i
      );
    });

    it('resolves manual city fallback correctly', () => {
      const resolved = locationProvider.resolveManualLocation('Mumbai');
      expect(resolved.latitude).toBeCloseTo(19.076);
      expect(resolved.longitude).toBeCloseTo(72.8777);
      expect(resolved.state).toBe('Maharashtra');
      expect(resolved.source).toBe('manual');
    });
  });

  describe('2.2 Open-Meteo Integration', () => {
    it('correctly maps WMO weather codes to descriptive text', () => {
      expect(interpretWmoCode(0)).toBe('Clear sky');
      expect(interpretWmoCode(2)).toBe('Partly cloudy');
      expect(interpretWmoCode(61)).toBe('Slight rain');
      expect(interpretWmoCode(65)).toBe('Heavy rainfall');
      expect(interpretWmoCode(95)).toBe('Thunderstorm');
      expect(interpretWmoCode(null)).toBe('Mild conditions');
    });

    it('parses valid Open-Meteo JSON responses into normalized WeatherSnapshot and Forecast', async () => {
      const mockApiResponse = {
        current: {
          time: '2026-10-09T12:00',
          temperature_2m: 27.4,
          relative_humidity_2m: 68,
          apparent_temperature: 28.5,
          precipitation: 0.2,
          rain: 0.2,
          weather_code: 61,
          cloud_cover: 45,
          wind_speed_10m: 14.5
        },
        daily: {
          time: ['2026-10-09', '2026-10-10'],
          temperature_2m_max: [30.1, 29.5],
          temperature_2m_min: [22.0, 21.8],
          precipitation_sum: [1.2, 0.0],
          precipitation_probability_max: [65, 20],
          weather_code: [61, 1]
        }
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockApiResponse
        })
      );

      const loc: LocationInfo = {
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        latitude: 12.9716,
        longitude: 77.5946
      };

      const forecast = await weatherProvider.getForecast(loc);
      expect(forecast.current.temperatureC).toBe(27.4);
      expect(forecast.current.humidityPercent).toBe(68);
      expect(forecast.current.conditionText).toBe('Slight rain');
      expect(forecast.current.isMock).toBe(false);
      expect(forecast.source).toBe('open_meteo_live');
      expect(forecast.daily.length).toBe(2);
      expect(forecast.daily[0].precipitationProbPercent).toBe(65);
    });

    it('handles missing and malformed weather fields defensively', async () => {
      const incompleteResponse = {
        current: {
          temperature_2m: 22.0
          // missing humidity, rain, weather_code, wind
        },
        daily: {}
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => incompleteResponse
        })
      );

      const loc: LocationInfo = { city: 'Unknown', state: '', country: 'India', latitude: 15.0, longitude: 75.0 };
      const forecast = await weatherProvider.getForecast(loc);

      expect(forecast.current.temperatureC).toBe(22.0);
      expect(forecast.current.humidityPercent).toBe(50); // safe default
      expect(forecast.current.rainfallMm).toBe(0);
      expect(forecast.current.windSpeedKmh).toBe(8);
      expect(forecast.current.conditionText).toBe('Clear sky');
    });

    it('caches successful API responses and respects cache within TTL', async () => {
      const mockApiResponse = {
        current: { temperature_2m: 26.0, weather_code: 0 },
        daily: { time: ['2026-10-09'], temperature_2m_max: [28], temperature_2m_min: [20] }
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });
      vi.stubGlobal('fetch', fetchMock);

      const loc: LocationInfo = { city: 'Bengaluru', state: '', country: 'India', latitude: 12.97, longitude: 77.59 };

      // First call: fetches from network
      await weatherProvider.getForecast(loc);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call: returns cached data without extra network request
      await weatherProvider.getForecast(loc);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Force refresh: triggers network request
      await weatherProvider.getForecast(loc, true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('marks cached data as stale if network fails while cache exists', async () => {
      const loc: LocationInfo = { city: 'Bengaluru', state: '', country: 'India', latitude: 12.97, longitude: 77.59 };

      // Seed cache
      const initialResponse = {
        current: { temperature_2m: 25.0, weather_code: 1 },
        daily: { time: ['2026-10-09'], temperature_2m_max: [27], temperature_2m_min: [19] }
      };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => initialResponse }));
      await weatherProvider.getForecast(loc);

      // Simulate network failure
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

      const staleContext = await weatherProvider.getEnvironmentalContext(loc, true);
      expect(staleContext.isStale).toBe(true);
      expect(staleContext.source).toBe('stale');
      expect(staleContext.confidence).toBe('cached_offline');
      expect(staleContext.snapshot.temperatureC).toBe(25.0);
    });

    it('returns honest unavailable state when live weather fails and no cache exists', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('DNS resolution failed')));
      const loc: LocationInfo = { city: 'NewCity', state: '', country: 'India', latitude: 10.0, longitude: 20.0 };

      const envContext = await weatherProvider.getEnvironmentalContext(loc);
      expect(envContext.isUnavailable).toBe(true);
      expect(envContext.source).toBe('unavailable');
      expect(envContext.snapshot.conditionText).toBe('Weather data unavailable');
      expect(envContext.isLive).toBe(false);
    });
  });

  describe('2.4 & 2.5 Weather & Solar Intelligence Integration', () => {
    it('generates idempotent additive tasks without duplicate creation', () => {
      const mockSnapshot: WeatherSnapshot = {
        temperatureC: 28,
        minTemperatureC: 22,
        maxTemperatureC: 30,
        humidityPercent: 85,
        precipitationProbabilityPercent: 75,
        rainfallMm: 5.5,
        windSpeedKmh: 12,
        cloudCoverPercent: 90,
        conditionText: 'Rain Likely',
        timestamp: new Date().toISOString(),
        isMock: false
      };

      const envContext: EnvironmentalContext = {
        location: { city: 'Bengaluru', state: '', country: 'India' },
        snapshot: mockSnapshot,
        source: 'open_meteo_live',
        confidence: 'measured_live',
        timestamp: new Date().toISOString()
      };

      const spaces: GardenSpace[] = [
        {
          id: 'sp-balcony',
          name: 'Main Balcony',
          type: 'balcony',
          size: 'small',
          sunlight: '2_to_4h',
          goal: 'herbs',
          photos: [],
          plants: [],
          tasks: [],
          createdAt: '',
          updatedAt: ''
        }
      ];

      const tasksRun1 = ruleEngine.generateAdditiveWeatherTasks(spaces, envContext);
      const tasksRun2 = ruleEngine.generateAdditiveWeatherTasks(spaces, envContext);

      expect(tasksRun1.length).toBe(1);
      expect(tasksRun2.length).toBe(1);
      expect(tasksRun1[0].id).toBe(tasksRun2[0].id);
      expect(tasksRun1[0].id).toBe('weather-task-rain-sp-balcony');
    });

    it('does NOT apply outdoor rain tasks to indoor spaces or sheltered balconies', () => {
      const mockSnapshot: WeatherSnapshot = {
        temperatureC: 24,
        minTemperatureC: 18,
        maxTemperatureC: 26,
        humidityPercent: 90,
        precipitationProbabilityPercent: 80,
        rainfallMm: 8.0,
        windSpeedKmh: 10,
        cloudCoverPercent: 100,
        conditionText: 'Heavy Rain',
        timestamp: new Date().toISOString(),
        isMock: false
      };

      const envContext: EnvironmentalContext = {
        location: { city: 'Bengaluru', state: '', country: 'India' },
        snapshot: mockSnapshot,
        source: 'open_meteo_live',
        confidence: 'measured_live',
        timestamp: new Date().toISOString()
      };

      const indoorSpace: GardenSpace = {
        id: 'sp-indoor',
        name: 'Living Room',
        type: 'indoor',
        size: 'small',
        sunlight: 'less_than_2h',
        goal: 'easy_plants',
        photos: [],
        plants: [],
        tasks: [],
        createdAt: '',
        updatedAt: ''
      };

      const shelteredBalcony: GardenSpace = {
        id: 'sp-sheltered',
        name: 'Glass Balcony',
        type: 'balcony',
        isSheltered: true,
        size: 'medium',
        sunlight: '4_to_6h',
        goal: 'kitchen_garden',
        photos: [],
        plants: [],
        tasks: [],
        createdAt: '',
        updatedAt: ''
      };

      const exposedTerrace: GardenSpace = {
        id: 'sp-terrace',
        name: 'Open Terrace',
        type: 'terrace',
        isSheltered: false,
        size: 'large',
        sunlight: 'more_than_6h',
        goal: 'vegetables',
        photos: [],
        plants: [],
        tasks: [],
        createdAt: '',
        updatedAt: ''
      };

      const tasks = ruleEngine.generateAdditiveWeatherTasks(
        [indoorSpace, shelteredBalcony, exposedTerrace],
        envContext
      );

      // Only the exposed terrace should receive the outdoor rain check task!
      expect(tasks.length).toBe(1);
      expect(tasks[0].spaceId).toBe('sp-terrace');
    });

    it('calculates solar position using configured latitude/longitude coordinates directly', () => {
      const locWithCoords: LocationInfo = {
        city: 'Somewhere in Scotland',
        state: '',
        country: 'UK',
        latitude: 56.4907,
        longitude: -4.2026
      };

      const solar = sunPositionProvider.calculatePosition(locWithCoords, new Date(2026, 5, 21, 12, 0));
      // In summer solstice at lat 56.5° N, noon elevation is ~56.9°
      expect(solar.elevationDegrees).toBeGreaterThan(50);
      expect(solar.daylightHours).toBeGreaterThan(16);
    });

    it('preserves existing mock provider for deterministic tests', async () => {
      const loc: LocationInfo = { city: 'Mumbai', state: 'Maharashtra', country: 'India' };
      const current = await mockWeatherProvider.getCurrentWeather(loc);
      expect(current.temperatureC).toBe(30);
      expect(current.isMock).toBe(true);
      expect(mockWeatherProvider.isLocalMock).toBe(true);
    });
  });
});
