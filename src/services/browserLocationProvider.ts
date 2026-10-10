import { GardenLocation, LocationPermissionStatus, LocationProvider } from '../types';

/**
 * City coordinate approximation table for fallback / manual resolution
 */
export const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lon: number; state: string; country: string }> = {
  bengaluru: { lat: 12.9716, lon: 77.5946, state: 'Karnataka', country: 'India' },
  bangalore: { lat: 12.9716, lon: 77.5946, state: 'Karnataka', country: 'India' },
  delhi: { lat: 28.6139, lon: 77.209, state: 'Delhi', country: 'India' },
  'new delhi': { lat: 28.6139, lon: 77.209, state: 'Delhi', country: 'India' },
  mumbai: { lat: 19.076, lon: 72.8777, state: 'Maharashtra', country: 'India' },
  pune: { lat: 18.5204, lon: 73.8567, state: 'Maharashtra', country: 'India' },
  hyderabad: { lat: 17.385, lon: 78.4867, state: 'Telangana', country: 'India' },
  chennai: { lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu', country: 'India' },
  kolkata: { lat: 22.5726, lon: 88.3639, state: 'West Bengal', country: 'India' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, state: 'Gujarat', country: 'India' },
  jaipur: { lat: 26.9124, lon: 75.7873, state: 'Rajasthan', country: 'India' },
  lucknow: { lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh', country: 'India' },
  kochi: { lat: 9.9312, lon: 76.2673, state: 'Kerala', country: 'India' },
  london: { lat: 51.5074, lon: -0.1278, state: 'England', country: 'United Kingdom' },
  seattle: { lat: 47.6062, lon: -122.3321, state: 'Washington', country: 'United States' }
};

/**
 * Browser Location Provider (Milestone 7)
 * Strictly user-initiated browser geolocation with fallback to manual selection.
 * Never continuously tracks location; never requests permissions on page load.
 */
export class BrowserLocationProvider implements LocationProvider {
  /**
   * Checks current permission status without prompting the user.
   */
  async getPermissionStatus(): Promise<LocationPermissionStatus> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return 'unsupported';
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (result.state === 'granted') return 'granted';
        if (result.state === 'denied') return 'denied';
        return 'prompt';
      }
    } catch {
      // Some browsers do not support permissions.query for geolocation
    }

    return 'prompt';
  }

  /**
   * Explicitly requests device coordinates via navigator.geolocation.getCurrentPosition.
   * Only called after explicit user action.
   */
  async requestCurrentLocation(timeoutMs: number = 10000): Promise<GardenLocation> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser or environment.');
    }

    return new Promise<GardenLocation>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Attempt nearest city match if close to known locations
          const matchedCity = this.findNearestCity(latitude, longitude);

          const location: GardenLocation = {
            latitude: Math.round(latitude * 10000) / 10000,
            longitude: Math.round(longitude * 10000) / 10000,
            accuracyMeters: Math.round(accuracy || 0),
            capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
            source: 'browser_geolocation',
            city: matchedCity?.city || 'My Location',
            state: matchedCity?.state || '',
            country: matchedCity?.country || 'India',
            displayName: matchedCity
              ? `${matchedCity.city}, ${matchedCity.state || matchedCity.country}`
              : `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
          };

          resolve(location);
        },
        (error) => {
          if (error.code === 1 || error.code === error.PERMISSION_DENIED) {
            const err = new Error('Location permission was denied. You can select your location manually.');
            (err as any).code = 'denied';
            reject(err);
          } else if (error.code === 3 || error.code === error.TIMEOUT) {
            const err = new Error('Location request timed out. Please check your network or try again.');
            (err as any).code = 'timeout';
            reject(err);
          } else {
            const err = new Error('Could not retrieve device location. You can choose your city manually.');
            (err as any).code = 'error';
            reject(err);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: timeoutMs,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Helper to resolve coordinates for manually selected cities
   */
  resolveManualLocation(cityName: string, state?: string, country?: string): GardenLocation {
    const key = cityName.toLowerCase().trim();
    const known = KNOWN_CITY_COORDINATES[key];

    if (known) {
      return {
        latitude: known.lat,
        longitude: known.lon,
        source: 'manual',
        capturedAt: new Date().toISOString(),
        city: cityName.trim(),
        state: state || known.state,
        country: country || known.country,
        displayName: `${cityName.trim()}, ${state || known.state || country || known.country}`
      };
    }

    // Default coordinates (Bengaluru / Central subtropical fallback)
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      source: 'manual',
      capturedAt: new Date().toISOString(),
      city: cityName.trim(),
      state: state || '',
      country: country || 'India',
      displayName: cityName.trim()
    };
  }

  /**
   * Find nearest city from known coordinates (approximate distance threshold)
   */
  private findNearestCity(lat: number, lon: number): { city: string; state: string; country: string } | null {
    let closestCity: string | null = null;
    let minDistance = Infinity;

    for (const [name, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
      const dLat = lat - coords.lat;
      const dLon = lon - coords.lon;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < minDistance && dist < 0.85) { // ~90km threshold
        minDistance = dist;
        closestCity = name;
      }
    }

    if (closestCity && KNOWN_CITY_COORDINATES[closestCity]) {
      const info = KNOWN_CITY_COORDINATES[closestCity];
      const capitalized = closestCity.charAt(0).toUpperCase() + closestCity.slice(1);
      return {
        city: capitalized,
        state: info.state,
        country: info.country
      };
    }

    return null;
  }
}

export const browserLocationProvider = new BrowserLocationProvider();
