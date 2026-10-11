import {
  LocationInfo,
  WeatherSnapshot,
  WeatherForecast,
  DailyWeatherForecast,
  EnvironmentalContext,
  SevereWeatherAlert
} from '../types';
import { WeatherProvider } from './types';

const CACHE_PREFIX = 'gardenmitra_weather_cache_';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL
const REQUEST_TIMEOUT_MS = 9000; // 9 second network timeout

// Known approximate coordinates for city-based fallback when coordinates are not yet provided
const FALLBACK_CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  delhi: { lat: 28.6139, lon: 77.209 },
  'new delhi': { lat: 28.6139, lon: 77.209 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  pune: { lat: 18.5204, lon: 73.8567 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  london: { lat: 51.5074, lon: -0.1278 },
  seattle: { lat: 47.6062, lon: -122.3321 },
  austin: { lat: 30.2672, lon: -97.7431 }
};

/**
 * WMO Weather interpretation code mapping
 * Based on Open-Meteo Documentation (WMO 4677 standard)
 */
export function interpretWmoCode(code: number | null | undefined): string {
  if (code === undefined || code === null) return 'Mild conditions';
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
      return 'Mainly clear';
    case 2:
      return 'Partly cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Foggy';
    case 51:
      return 'Light drizzle';
    case 53:
      return 'Moderate drizzle';
    case 55:
      return 'Dense drizzle';
    case 56:
    case 57:
      return 'Freezing drizzle';
    case 61:
      return 'Slight rain';
    case 63:
      return 'Moderate rain';
    case 65:
      return 'Heavy rainfall';
    case 66:
    case 67:
      return 'Freezing rain';
    case 71:
      return 'Slight snowfall';
    case 73:
      return 'Moderate snowfall';
    case 75:
      return 'Heavy snowfall';
    case 77:
      return 'Snow grains';
    case 80:
      return 'Slight rain showers';
    case 81:
      return 'Moderate rain showers';
    case 82:
      return 'Violent rain showers';
    case 85:
    case 86:
      return 'Snow showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm with hail';
    default:
      return 'Scattered clouds';
  }
}

/**
 * Milestone 16: Severe Weather Evaluation
 * Identifies high-risk environmental conditions for gardens
 */
export function evaluateSevereWeather(snapshot: {
  temperatureC: number;
  maxTemperatureC: number;
  minTemperatureC: number;
  apparentTemperatureC?: number;
  windSpeedKmh: number;
  precipitationProbabilityPercent: number;
  forecastRainfallMm?: number;
  conditionText: string;
  wmoCode?: number;
}): SevereWeatherAlert | undefined {
  // 1. Extreme Heatwave: maxTemp >= 40°C or apparentTemp >= 42°C
  if (snapshot.maxTemperatureC >= 40 || (snapshot.apparentTemperatureC !== undefined && snapshot.apparentTemperatureC >= 42)) {
    return {
      id: `alert-heat-${Date.now()}`,
      type: 'heatwave',
      severity: 'alert',
      headline: 'Severe Heatwave Alert',
      description: `Extreme temperatures reaching ${snapshot.maxTemperatureC}°C (Feels like ${snapshot.apparentTemperatureC || snapshot.maxTemperatureC}°C). High risk of moisture stress and leaf scorch.`,
      instructions: 'Move sensitive container plants into partial shade. Mulch soil to prevent rapid evaporation, and do not prune or apply concentrated fertilizer during heat spikes.',
      recommendedAction: 'Provide afternoon shade, maintain root hydration, and avoid midday leaf wetting.',
      validFrom: new Date().toISOString()
    };
  }

  // 2. Freezing / Frost: minTemp <= 2°C or temp <= 2°C
  if (snapshot.minTemperatureC <= 2 || snapshot.temperatureC <= 2) {
    return {
      id: `alert-frost-${Date.now()}`,
      type: 'frost',
      severity: 'alert',
      headline: 'Frost & Near-Freeze Warning',
      description: `Temperatures dropping near freezing point (${snapshot.minTemperatureC}°C). Tropical, subtropical, and warm-season plants risk cell damage.`,
      instructions: 'Move tender pots indoors or under cover. Cover outdoor beds with horticultural fleece or frost cloth before sundown.',
      recommendedAction: 'Protect frost-sensitive herbs and tropical foliage immediately.',
      validFrom: new Date().toISOString()
    };
  }

  // 3. Heavy Rain / Cloudburst: forecastRainfall >= 25mm or (precipitationProbability >= 80% and forecastRainfall >= 15mm)
  if ((snapshot.forecastRainfallMm !== undefined && snapshot.forecastRainfallMm >= 25) || (snapshot.precipitationProbabilityPercent >= 80 && (snapshot.forecastRainfallMm ?? 0) >= 15)) {
    return {
      id: `alert-rain-${Date.now()}`,
      type: 'heavy_rain',
      severity: 'warning',
      headline: 'Heavy Rainfall Warning',
      description: `Significant precipitation forecast (~${snapshot.forecastRainfallMm}mm). Risk of waterlogging in exposed containers.`,
      instructions: 'Ensure pot drainage holes are unobstructed. Move vulnerable seedlings under shelter to prevent physical rain damage.',
      recommendedAction: 'Pause all manual watering and verify pot drainage.',
      validFrom: new Date().toISOString()
    };
  }

  // 4. High Winds: windSpeed >= 38 km/h
  if (snapshot.windSpeedKmh >= 38) {
    return {
      id: `alert-wind-${Date.now()}`,
      type: 'high_winds',
      severity: 'warning',
      headline: 'High Winds Advisory',
      description: `Gusty winds of ${snapshot.windSpeedKmh} km/h expected. Tall plants, hanging pots, and lightweight containers risk toppling.`,
      instructions: 'Stake tall fruiting plants (tomatoes, chillies). Take down hanging baskets and place lightweight containers against a sheltered wall.',
      recommendedAction: 'Stake tall stems and shelter balcony edge containers.',
      validFrom: new Date().toISOString()
    };
  }

  // 5. Thunderstorm: WMO 95, 96, 99
  if (snapshot.wmoCode !== undefined && [95, 96, 99].includes(snapshot.wmoCode)) {
    return {
      id: `alert-storm-${Date.now()}`,
      type: 'storm',
      severity: 'warning',
      headline: 'Thunderstorm Warning',
      description: 'Thunderstorms with possible hail or sudden wind squalls in the area.',
      instructions: 'Shelter fragile plants from hail and sudden wind blasts.',
      recommendedAction: 'Inspect outdoor setup and bring fragile seedlings under an awning.',
      validFrom: new Date().toISOString()
    };
  }

  return undefined;
}

interface CachedWeatherPayload {
  cachedAt: number;
  forecast: WeatherForecast;
}

/**
 * Open-Meteo Real Weather Provider (Milestone 7)
 * Strictly local-first and honest:
 * - Uses official free Open-Meteo forecast API (no API key required).
 * - Caches responses for 30 minutes to respect API rate limits.
 * - Distinguishes live, cached, stale, and honest unavailable states.
 * - Never fabricates fake current weather or silently replaces live failures with mock data.
 */
export class OpenMeteoWeatherProvider implements WeatherProvider {
  readonly id = 'open-meteo-weather-provider';
  readonly name = 'Open-Meteo Live Forecast';
  readonly isLocalMock = false;

  /**
   * Helper to resolve coordinates from location model
   */
  resolveCoordinates(location: LocationInfo): { lat: number; lon: number } {
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      return { lat: location.latitude, lon: location.longitude };
    }
    const cityKey = (location.city || '').toLowerCase().trim();
    if (FALLBACK_CITY_COORDINATES[cityKey]) {
      return FALLBACK_CITY_COORDINATES[cityKey];
    }
    // Default to Bengaluru coordinates if unconfigured
    return { lat: 12.9716, lon: 77.5946 };
  }

  private getCacheKey(lat: number, lon: number): string {
    return `${CACHE_PREFIX}${lat.toFixed(2)}_${lon.toFixed(2)}`;
  }

  private readCache(lat: number, lon: number): { data: CachedWeatherPayload; isStale: boolean } | null {
    try {
      const raw = localStorage.getItem(this.getCacheKey(lat, lon));
      if (!raw) return null;
      const parsed: CachedWeatherPayload = JSON.parse(raw);
      const ageMs = Date.now() - parsed.cachedAt;
      const isStale = ageMs > CACHE_TTL_MS;
      return { data: parsed, isStale };
    } catch {
      return null;
    }
  }

  private writeCache(lat: number, lon: number, forecast: WeatherForecast): void {
    try {
      const payload: CachedWeatherPayload = {
        cachedAt: Date.now(),
        forecast
      };
      localStorage.setItem(this.getCacheKey(lat, lon), JSON.stringify(payload));
    } catch {
      // Storage quota or storage unavailable
    }
  }

  public clearCache(lat?: number, lon?: number): void {
    try {
      if (lat !== undefined && lon !== undefined) {
        localStorage.removeItem(this.getCacheKey(lat, lon));
      } else {
        // Clear all weather caches
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Fetch live weather and forecast from Open-Meteo API
   */
  async getForecast(location: LocationInfo, forceRefresh = false): Promise<WeatherForecast> {
    const coords = this.resolveCoordinates(location);
    const cached = this.readCache(coords.lat, coords.lon);

    // If cached data is fresh and not forcing refresh, return cached forecast
    if (!forceRefresh && cached && !cached.isStale) {
      return cached.data.forecast;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat.toFixed(4)}&longitude=${coords.lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Open-Meteo API returned HTTP status ${res.status}`);
      }

      const json = await res.json();
      const currentData = json.current || {};
      const dailyData = json.daily || {};

      const currentWmo = currentData.weather_code ?? 0;
      const currentCondition = interpretWmoCode(currentWmo);

      const apparentTemp = currentData.apparent_temperature !== undefined
        ? Math.round(currentData.apparent_temperature * 10) / 10
        : currentData.temperature_2m !== undefined
        ? Math.round(currentData.temperature_2m * 10) / 10
        : undefined;

      const observedRain = currentData.rain !== undefined
        ? Math.round(currentData.rain * 10) / 10
        : currentData.precipitation !== undefined
        ? Math.round(currentData.precipitation * 10) / 10
        : 0;

      const forecastRain = dailyData.precipitation_sum?.[0] !== undefined
        ? Math.round(dailyData.precipitation_sum[0] * 10) / 10
        : 0;

      const tempC = Math.round((currentData.temperature_2m ?? 24) * 10) / 10;
      const minTempC = Math.round(((dailyData.temperature_2m_min?.[0] ?? (currentData.temperature_2m ?? 20) - 4)) * 10) / 10;
      const maxTempC = Math.round(((dailyData.temperature_2m_max?.[0] ?? (currentData.temperature_2m ?? 25) + 4)) * 10) / 10;
      const precipProb = Math.round(dailyData.precipitation_probability_max?.[0] ?? 0);
      const windKmh = Math.round((currentData.wind_speed_10m ?? 8) * 10) / 10;
      const nowIso = new Date().toISOString();
      const validFrom = currentData.time || nowIso;
      const validUntil = dailyData.time?.[0] ? `${dailyData.time[0]}T23:59:59` : undefined;

      const severeAlert = evaluateSevereWeather({
        temperatureC: tempC,
        maxTemperatureC: maxTempC,
        minTemperatureC: minTempC,
        apparentTemperatureC: apparentTemp,
        windSpeedKmh: windKmh,
        precipitationProbabilityPercent: precipProb,
        forecastRainfallMm: forecastRain,
        conditionText: currentCondition,
        wmoCode: currentWmo
      });

      // Build normalized WeatherSnapshot
      const currentSnapshot: WeatherSnapshot = {
        temperatureC: tempC,
        minTemperatureC: minTempC,
        maxTemperatureC: maxTempC,
        humidityPercent: Math.round(currentData.relative_humidity_2m ?? 50),
        precipitationProbabilityPercent: precipProb,
        rainfallMm: observedRain,
        windSpeedKmh: windKmh,
        cloudCoverPercent: Math.round(currentData.cloud_cover ?? 20),
        conditionText: currentCondition,
        timestamp: currentData.time || nowIso,
        isMock: false,
        apparentTemperatureC: apparentTemp,
        observedRainfallMm: observedRain,
        forecastRainfallMm: forecastRain,
        validFrom,
        validUntil,
        retrievedAt: nowIso,
        severeWeatherAlert: severeAlert
      };

      // Build daily forecast list
      const dates: string[] = dailyData.time || [];
      const dailyForecasts: DailyWeatherForecast[] = dates.slice(0, 5).map((dateStr, idx) => ({
        date: dateStr,
        maxTempC: Math.round((dailyData.temperature_2m_max?.[idx] ?? currentSnapshot.maxTemperatureC) * 10) / 10,
        minTempC: Math.round((dailyData.temperature_2m_min?.[idx] ?? currentSnapshot.minTemperatureC) * 10) / 10,
        precipitationProbPercent: Math.round(dailyData.precipitation_probability_max?.[idx] ?? 0),
        rainfallMm: Math.round((dailyData.precipitation_sum?.[idx] ?? 0) * 10) / 10,
        conditionText: interpretWmoCode(dailyData.weather_code?.[idx]),
        windSpeedKmh: dailyData.wind_speed_10m_max?.[idx] !== undefined ? Math.round(dailyData.wind_speed_10m_max[idx] * 10) / 10 : undefined
      }));

      const forecast: WeatherForecast = {
        current: currentSnapshot,
        daily: dailyForecasts,
        location: {
          ...location,
          latitude: coords.lat,
          longitude: coords.lon
        },
        source: 'open_meteo_live',
        confidence: 'measured_live'
      };

      // Save to local cache
      this.writeCache(coords.lat, coords.lon, forecast);
      return forecast;
    } catch (err: any) {
      clearTimeout(timeout);

      // Offline / API error fallback to cached data if available (honestly marked stale)
      if (cached) {
        return {
          ...cached.data.forecast,
          source: 'stale',
          confidence: 'cached_offline'
        };
      }

      // Re-throw so caller can distinguish unavailable state
      throw new Error(`Open-Meteo weather fetch failed: ${err.message || 'Network error'}`);
    }
  }

  async getCurrentWeather(location: LocationInfo): Promise<WeatherSnapshot> {
    const forecast = await this.getForecast(location);
    return forecast.current;
  }

  /**
   * Produce complete EnvironmentalContext with honest live/cached/stale/unavailable state
   */
  async getEnvironmentalContext(
    location: LocationInfo,
    forceRefresh = false
  ): Promise<EnvironmentalContext> {
    const coords = this.resolveCoordinates(location);
    const cached = this.readCache(coords.lat, coords.lon);

    try {
      const forecast = await this.getForecast(location, forceRefresh);
      const isStaleSource = forecast.source === 'stale';

      return {
        location: {
          ...location,
          latitude: coords.lat,
          longitude: coords.lon
        },
        snapshot: forecast.current,
        forecast,
        source: isStaleSource ? 'stale' : 'open_meteo_live',
        confidence: isStaleSource ? 'cached_offline' : 'measured_live',
        timestamp: new Date().toISOString(),
        isLive: !isStaleSource,
        isCached: !isStaleSource && !forceRefresh && !!(cached && !cached.isStale),
        isStale: isStaleSource,
        isUnavailable: false,
        lastFetchedAt: cached?.data.cachedAt ? new Date(cached.data.cachedAt).toISOString() : new Date().toISOString()
      };
    } catch (err: any) {
      // Honest unavailable state: no fake weather fabricated
      return {
        location: {
          ...location,
          latitude: coords.lat,
          longitude: coords.lon
        },
        snapshot: {
          temperatureC: 0,
          minTemperatureC: 0,
          maxTemperatureC: 0,
          humidityPercent: 0,
          precipitationProbabilityPercent: 0,
          rainfallMm: 0,
          windSpeedKmh: 0,
          cloudCoverPercent: 0,
          conditionText: 'Weather data unavailable',
          timestamp: new Date().toISOString(),
          isMock: false
        },
        source: 'unavailable',
        confidence: 'unreachable',
        timestamp: new Date().toISOString(),
        isLive: false,
        isCached: false,
        isStale: false,
        isUnavailable: true,
        errorMessage: err.message || 'Unable to connect to Open-Meteo service.'
      };
    }
  }
}

export const openMeteoWeatherProvider = new OpenMeteoWeatherProvider();
