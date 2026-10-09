import {
  SunlightAmount,
  SunlightProfile,
  SunlightObservation,
  SunlightEstimate,
  SunlightExposureLevel,
  ConfidenceLevel,
  SunlightSource,
  GardenPhoto,
  LocationInfo,
  SpaceType
} from '../types';
import { localSunPositionProvider } from './localSunPositionProvider';

/**
 * Deterministic Sunlight Estimation Engine (Milestone 5)
 * Strictly adheres to AI Honesty:
 * - A single photograph is NOT proof of exact daily sunlight.
 * - Never fabricates exact lux values or decimal hour precision.
 * - Explains evidence, confidence, and limitations transparently.
 */
export class SunlightEstimationEngine {
  /**
   * Initializes a SunlightProfile using the user's setup answer
   */
  createInitialProfile(
    userReported: SunlightAmount = '2_to_4h',
    spaceType: SpaceType = 'balcony'
  ): SunlightProfile {
    const isOutdoor = ['balcony', 'terrace', 'backyard', 'garden', 'pots'].includes(spaceType);
    const initialExposure: SunlightExposureLevel =
      userReported === 'more_than_6h'
        ? 'high'
        : userReported === '4_to_6h'
        ? 'moderate'
        : userReported === '2_to_4h'
        ? 'partial'
        : userReported === 'less_than_2h'
        ? 'low'
        : 'unknown';

    return {
      source: 'user_reported',
      estimatedDailyHours: userReported,
      confidence: userReported === 'unknown' ? 'low' : 'moderate',
      morningExposure: initialExposure,
      afternoonExposure: initialExposure,
      eveningExposure: 'unknown',
      seasonalNotes: isOutdoor
        ? 'Seasonal solar elevation shifts sunlight depth across walls and railings throughout the year.'
        : 'Indoor windowsill light changes significantly depending on window orientation.',
      observations: [],
      lastUpdated: new Date().toISOString(),
      evidence: ['Initial exposure reported during garden setup.'],
      limitations: [
        'GardenMitra needs observations across morning, afternoon, or evening to confirm actual exposure.'
      ]
    };
  }

  /**
   * Evaluates comprehensive sunlight estimate combining user input, observations, photo timestamps, and local solar data.
   */
  estimateSunlight(params: {
    userReported: SunlightAmount;
    observations: SunlightObservation[];
    photos?: GardenPhoto[];
    location?: LocationInfo;
    spaceType?: SpaceType;
  }): SunlightEstimate {
    const { userReported, observations = [], photos = [], location } = params;

    const evidence: string[] = [];
    const limitations: string[] = [];

    // 1. Process User Reported Baseline
    evidence.push(`Initial user setup answer: ${userReported.replace(/_/g, ' ')}`);

    // 2. Process Solar Position Information (if location available)
    if (location?.city) {
      const solar = localSunPositionProvider.calculatePosition(location, new Date());
      evidence.push(
        `Local solar daylight for ${location.city}: ~${solar.daylightHours}h total daylight (Sunrise: ${solar.approxSunriseTime}, Sunset: ${solar.approxSunsetTime}).`
      );
    }

    // 3. Process Photo Timestamp Evidence (No fake certainty!)
    if (photos.length > 0) {
      let timestampFound = false;
      photos.forEach((p, idx) => {
        if (p.photoTimestamp) {
          timestampFound = true;
          const photoDate = new Date(p.photoTimestamp);
          const timeStr = photoDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          evidence.push(`Photo #${idx + 1} timestamp confirmed: captured at ${timeStr}.`);
        }
      });

      if (!timestampFound) {
        limitations.push('Photo time unknown — not counted toward daily exposure calculation.');
      } else {
        limitations.push('Single photographs indicate lighting at that moment, not full-day duration.');
      }
    }

    // 4. Process Sunlight Observations
    const morningObs = observations.filter((o) => o.timeOfDay === 'morning');
    const afternoonObs = observations.filter((o) => o.timeOfDay === 'afternoon');
    const eveningObs = observations.filter((o) => o.timeOfDay === 'evening');

    const getExposureFromCondition = (
      obsList: SunlightObservation[]
    ): SunlightExposureLevel => {
      if (obsList.length === 0) return 'unknown';
      const latest = obsList[obsList.length - 1];
      if (latest.condition === 'mostly_sunny') return 'high';
      if (latest.condition === 'partially_shaded') return 'partial';
      return 'low';
    };

    const morningExp = getExposureFromCondition(morningObs);
    const afternoonExp = getExposureFromCondition(afternoonObs);
    const eveningExp = getExposureFromCondition(eveningObs);

    if (morningObs.length > 0) {
      evidence.push(`Morning observation: ${morningObs[morningObs.length - 1].condition.replace(/_/g, ' ')}.`);
    }
    if (afternoonObs.length > 0) {
      evidence.push(`Afternoon observation: ${afternoonObs[afternoonObs.length - 1].condition.replace(/_/g, ' ')}.`);
    }
    if (eveningObs.length > 0) {
      evidence.push(`Evening observation: ${eveningObs[eveningObs.length - 1].condition.replace(/_/g, ' ')}.`);
    }

    // 5. Determine Confidence Level
    let confidence: ConfidenceLevel = 'low';
    let source: SunlightSource = 'user_reported';

    if (observations.length === 0) {
      confidence = userReported === 'unknown' ? 'low' : 'moderate';
      source = 'user_reported';
      limitations.push(
        'GardenMitra needs observations across morning, afternoon, or evening to confirm actual exposure.'
      );
    } else if (observations.length === 1) {
      confidence = 'low';
      source = 'combined';
      limitations.push(
        'GardenMitra needs more observations across different times of day for a stronger estimate.'
      );
    } else if (observations.length === 2) {
      confidence = 'moderate';
      source = 'combined';
    } else {
      confidence = 'high';
      source = 'combined';
    }

    // 6. Compute Estimated Daily Hours Range
    let estimatedHours: SunlightAmount = userReported;

    if (observations.length > 0) {
      const highCount = [morningExp, afternoonExp, eveningExp].filter((e) => e === 'high').length;
      const partialCount = [morningExp, afternoonExp, eveningExp].filter((e) => e === 'partial').length;
      const lowCount = [morningExp, afternoonExp, eveningExp].filter((e) => e === 'low').length;

      if (highCount >= 2) {
        estimatedHours = 'more_than_6h';
      } else if (highCount === 1 && partialCount >= 1) {
        estimatedHours = '4_to_6h';
      } else if (partialCount >= 2 || (highCount === 1 && lowCount >= 1)) {
        estimatedHours = '2_to_4h';
      } else if (lowCount >= 2) {
        estimatedHours = 'less_than_2h';
      }
    }

    // 7. Determine Recommended Zones
    const recommendedZones: string[] = [];
    if (morningExp === 'high' || afternoonExp === 'high' || estimatedHours === 'more_than_6h') {
      recommendedZones.push('Sunny Zone (Direct Sun)');
    }
    if (morningExp === 'partial' || afternoonExp === 'partial' || estimatedHours === '4_to_6h' || estimatedHours === '2_to_4h') {
      recommendedZones.push('Partial Shade Zone (Filtered Light)');
    }
    if (morningExp === 'low' || afternoonExp === 'low' || estimatedHours === 'less_than_2h') {
      recommendedZones.push('Shaded Zone (Ambient Light)');
    }
    if (recommendedZones.length === 0) {
      recommendedZones.push('General Growing Area');
    }

    return {
      estimatedHours,
      confidence,
      source,
      morningExposure: morningExp,
      afternoonExposure: afternoonExp,
      eveningExposure: eveningExp,
      evidence,
      limitations,
      recommendedZones
    };
  }

  /**
   * Adds a sunlight observation to the profile and recalculates estimate
   */
  recordObservation(
    currentProfile: SunlightProfile,
    observation: {
      spaceId: string;
      timeOfDay: 'morning' | 'afternoon' | 'evening';
      condition: 'mostly_sunny' | 'partially_shaded' | 'mostly_shaded';
      notes?: string;
    },
    location?: LocationInfo
  ): SunlightProfile {
    const newObs: SunlightObservation = {
      id: 'obs-sun-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      spaceId: observation.spaceId,
      timeOfDay: observation.timeOfDay,
      condition: observation.condition,
      timestamp: new Date().toISOString(),
      notes: observation.notes
    };

    const updatedObservations = [...currentProfile.observations, newObs];
    const estimate = this.estimateSunlight({
      userReported: currentProfile.estimatedDailyHours,
      observations: updatedObservations,
      location
    });

    return {
      source: estimate.source,
      estimatedDailyHours: estimate.estimatedHours,
      confidence: estimate.confidence,
      morningExposure: estimate.morningExposure,
      afternoonExposure: estimate.afternoonExposure,
      eveningExposure: estimate.eveningExposure,
      seasonalNotes: currentProfile.seasonalNotes,
      observations: updatedObservations,
      lastUpdated: new Date().toISOString(),
      evidence: estimate.evidence,
      limitations: estimate.limitations
    };
  }
}

export const sunlightEstimationEngine = new SunlightEstimationEngine();
