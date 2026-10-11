import {
  EnvironmentalMeasurementType,
  EnvironmentalUnit,
  EnvironmentalObservation,
  ObservationDataQuality,
  ObservationSource
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  quality: ObservationDataQuality;
}

export const PHYSICAL_LIMITS: Record<
  EnvironmentalMeasurementType,
  { min: number; max: number; allowedUnits: EnvironmentalUnit[] }
> = {
  air_temperature: { min: -40, max: 65, allowedUnits: ['°C'] },
  relative_humidity: { min: 0, max: 100, allowedUnits: ['%'] },
  soil_moisture: { min: 0, max: 100, allowedUnits: ['%'] },
  ambient_light: { min: 0, max: 150000, allowedUnits: ['lux', 'ppfd'] },
  soil_temperature: { min: -20, max: 55, allowedUnits: ['°C'] },
  rainfall: { min: 0, max: 500, allowedUnits: ['mm'] }
};

export const VALID_SOURCES: ObservationSource[] = [
  'manual',
  'connected_sensor',
  'imported',
  'simulated'
];

/**
 * Validates an environmental observation against physical laws,
 * finite number rules, unit consistency, and timestamp sanity.
 */
export function validateEnvironmentalObservation(
  obs: Partial<EnvironmentalObservation>
): ValidationResult {
  const errors: string[] = [];

  // 1. Space ID check
  if (!obs.spaceId || typeof obs.spaceId !== 'string' || obs.spaceId.trim() === '') {
    errors.push('Missing or invalid spaceId');
  }

  // 2. Type check
  if (!obs.type || !PHYSICAL_LIMITS[obs.type]) {
    errors.push(`Unsupported measurement type: ${String(obs.type)}`);
    return { isValid: false, errors, quality: 'invalid' };
  }

  const limits = PHYSICAL_LIMITS[obs.type];

  // 3. Numeric finite value check
  if (obs.value === undefined || obs.value === null || typeof obs.value !== 'number' || !Number.isFinite(obs.value)) {
    errors.push(`Value must be a finite number. Received: ${String(obs.value)}`);
  } else {
    // Range check
    if (obs.value < limits.min || obs.value > limits.max) {
      errors.push(
        `Value ${obs.value} is outside physically possible range [${limits.min}, ${limits.max}] for ${obs.type}`
      );
    }
  }

  // 4. Unit check
  if (!obs.unit || !limits.allowedUnits.includes(obs.unit)) {
    errors.push(
      `Invalid unit "${String(obs.unit)}" for ${obs.type}. Permitted: ${limits.allowedUnits.join(', ')}`
    );
  }

  // Special constraint: ppfd max is 3000
  if (obs.type === 'ambient_light' && obs.unit === 'ppfd' && typeof obs.value === 'number') {
    if (obs.value < 0 || obs.value > 3000) {
      errors.push(`PPFD value ${obs.value} is outside valid range [0, 3000]`);
    }
  }

  // 5. Timestamp validation
  if (!obs.timestamp || typeof obs.timestamp !== 'string') {
    errors.push('Missing observation timestamp');
  } else {
    const parsedDate = new Date(obs.timestamp);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Invalid timestamp format: "${obs.timestamp}"`);
    } else {
      // Future timestamp limit (allow max 5 min clock skew)
      const nowMs = Date.now() + 5 * 60 * 1000;
      if (parsedDate.getTime() > nowMs) {
        errors.push(`Timestamp is in the future: "${obs.timestamp}"`);
      }
    }
  }

  // 6. Source validation
  if (!obs.source || !VALID_SOURCES.includes(obs.source)) {
    errors.push(`Invalid observation source: "${String(obs.source)}"`);
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    errors,
    quality: isValid ? 'valid' : 'invalid'
  };
}

/**
 * Normalizes lux to approximate PPFD (μmol/m²/s) for sunlight.
 * Standard sunlight conversion factor: ~0.0185 μmol/m²/s per lux.
 * Explicitly marks conversion as an approximation.
 */
export function convertLuxToApproximatePpfd(lux: number): { ppfd: number; isApproximation: boolean } {
  if (lux < 0) return { ppfd: 0, isApproximation: true };
  const ppfd = Math.round(lux * 0.0185 * 10) / 10;
  return { ppfd, isApproximation: true };
}
