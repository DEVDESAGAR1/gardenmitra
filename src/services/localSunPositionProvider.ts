import { LocationInfo } from '../types';

export interface SolarPosition {
  elevationDegrees: number; // -90 to +90 (above horizon > 0)
  azimuthDegrees: number;   // 0 = North, 90 = East, 180 = South, 270 = West
  isDaylight: boolean;
  approxSunriseTime: string; // e.g. "06:05 AM"
  approxSunsetTime: string;  // e.g. "06:20 PM"
  daylightHours: number;
}

export interface SunPositionProvider {
  calculatePosition(location: LocationInfo, date: Date): SolarPosition;
}

/**
 * Known coordinate approximations for cities (avoiding external geocoding network calls)
 */
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
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
  jaipur: { lat: 26.9124, lon: 75.7873 }
};

/**
 * Local Sun Position Provider (Milestone 5)
 * Computes deterministic astronomical solar position on-device without external APIs.
 */
export class LocalSunPositionProvider implements SunPositionProvider {
  calculatePosition(location: LocationInfo, date: Date = new Date()): SolarPosition {
    const cityName = (location.city || '').toLowerCase().trim();
    // Prioritize high-accuracy coordinates from browser geolocation or manual picker
    const coords = (location.latitude !== undefined && location.longitude !== undefined)
      ? { lat: location.latitude, lon: location.longitude }
      : (CITY_COORDINATES[cityName] || { lat: 13.0, lon: 77.6 }); // sensible subtropical default

    const latRad = (coords.lat * Math.PI) / 180;

    // Day of the year
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Solar declination approximation (Cooper's equation)
    const declinationDeg = 23.45 * Math.sin((((284 + dayOfYear) * 360) / 365) * (Math.PI / 180));
    const declinationRad = (declinationDeg * Math.PI) / 180;

    // Local solar time calculation
    const hours = date.getHours() + date.getMinutes() / 60;
    const hourAngleDeg = (hours - 12) * 15;
    const hourAngleRad = (hourAngleDeg * Math.PI) / 180;

    // Solar elevation (altitude)
    const sinElevation =
      Math.sin(latRad) * Math.sin(declinationRad) +
      Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
    const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElevation)));
    const elevationDeg = (elevationRad * 180) / Math.PI;

    // Solar azimuth approximation
    const cosAzimuth =
      (Math.sin(declinationRad) - Math.sin(latRad) * sinElevation) /
      (Math.cos(latRad) * Math.cos(elevationRad));
    let azimuthDeg = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;
    if (hourAngleDeg > 0) {
      azimuthDeg = 360 - azimuthDeg;
    }

    // Sunrise & Sunset approximation
    const cosHourAngleSunrise = -Math.tan(latRad) * Math.tan(declinationRad);
    const safeCos = Math.max(-1, Math.min(1, cosHourAngleSunrise));
    const sunriseHalfDayHours = (Math.acos(safeCos) * 180) / (Math.PI * 15);
    const daylightHours = Math.round(sunriseHalfDayHours * 2 * 10) / 10;

    const sunriseHour = 12 - sunriseHalfDayHours;
    const sunsetHour = 12 + sunriseHalfDayHours;

    const formatHour = (h: number) => {
      const fullH = Math.floor(h);
      const fullM = Math.floor((h - fullH) * 60);
      const isPm = fullH >= 12;
      const displayH = fullH % 12 === 0 ? 12 : fullH % 12;
      return `${displayH.toString().padStart(2, '0')}:${fullM.toString().padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;
    };

    return {
      elevationDegrees: Math.round(elevationDeg * 10) / 10,
      azimuthDegrees: Math.round(azimuthDeg * 10) / 10,
      isDaylight: elevationDeg > 0,
      approxSunriseTime: formatHour(sunriseHour),
      approxSunsetTime: formatHour(sunsetHour),
      daylightHours
    };
  }
}

export const localSunPositionProvider = new LocalSunPositionProvider();
