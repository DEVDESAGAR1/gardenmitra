import { describe, it, expect } from 'vitest';
import { sunlightEstimationEngine } from '../services/sunlightEstimationEngine';
import { localSunPositionProvider } from '../services/localSunPositionProvider';
import { plantKnowledgeProvider } from '../services/localPlantKnowledgeProvider';
import { GardenPhoto, GardenProfile, SunlightZone } from '../types';

describe('Milestone 5: Sunlight Intelligence', () => {
  it('creates an initial sunlight profile preserving user-reported baseline', () => {
    const profile = sunlightEstimationEngine.createInitialProfile('2_to_4h', 'balcony');

    expect(profile.source).toBe('user_reported');
    expect(profile.estimatedDailyHours).toBe('2_to_4h');
    expect(profile.morningExposure).toBe('partial');
    expect(profile.observations).toEqual([]);
    expect(profile.confidence).toBe('moderate');
    expect(profile.evidence).toContain('Initial exposure reported during garden setup.');
    expect(profile.limitations.length).toBeGreaterThan(0);
  });

  it('handles unknown user sunlight without fabricating high certainty', () => {
    const profile = sunlightEstimationEngine.createInitialProfile('unknown', 'balcony');

    expect(profile.source).toBe('user_reported');
    expect(profile.estimatedDailyHours).toBe('unknown');
    expect(profile.confidence).toBe('low');
    expect(profile.morningExposure).toBe('unknown');
  });

  it('handles photo timestamp evidence honestly when available', () => {
    const timestampedPhoto: GardenPhoto = {
      id: 'photo-1',
      dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      fileName: 'morning-balcony.jpg',
      uploadedAt: '2026-10-08T09:15:00.000Z',
      photoTimestamp: '2026-10-08T08:30:00.000Z'
    };

    const estimate = sunlightEstimationEngine.estimateSunlight({
      userReported: '2_to_4h',
      observations: [],
      photos: [timestampedPhoto]
    });

    // Evidence should acknowledge verified photo timestamp
    const timestampEvidence = estimate.evidence.some((e) => e.includes('timestamp confirmed'));
    expect(timestampEvidence).toBe(true);

    // Limitations must explicitly state that a single photo is not proof of full-day sunlight
    const singlePhotoWarning = estimate.limitations.some((l) =>
      l.includes('Single photographs indicate lighting at that moment')
    );
    expect(singlePhotoWarning).toBe(true);
  });

  it('handles photos with unknown timestamp honestly without inventing metadata', () => {
    const untimestampedPhoto: GardenPhoto = {
      id: 'photo-2',
      dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      fileName: 'space-unknown.jpg',
      uploadedAt: '2026-10-08T12:00:00.000Z'
      // photoTimestamp undefined!
    };

    const estimate = sunlightEstimationEngine.estimateSunlight({
      userReported: '2_to_4h',
      observations: [],
      photos: [untimestampedPhoto]
    });

    const unknownTimestampWarning = estimate.limitations.some((l) =>
      l.includes('Photo time unknown')
    );
    expect(unknownTimestampWarning).toBe(true);
  });

  it('records sunlight observations and combines them conservatively', () => {
    let profile = sunlightEstimationEngine.createInitialProfile('2_to_4h', 'balcony');

    // 1. Record morning observation (mostly sunny)
    profile = sunlightEstimationEngine.recordObservation(profile, {
      spaceId: 'space-1',
      timeOfDay: 'morning',
      condition: 'mostly_sunny'
    });

    expect(profile.observations.length).toBe(1);
    expect(profile.morningExposure).toBe('high');
    expect(profile.confidence).toBe('low'); // Only 1 observation -> still needs more
    expect(profile.limitations.some((l) => l.includes('needs more observations'))).toBe(true);

    // 2. Record afternoon observation (mostly sunny)
    profile = sunlightEstimationEngine.recordObservation(profile, {
      spaceId: 'space-1',
      timeOfDay: 'afternoon',
      condition: 'mostly_sunny'
    });

    expect(profile.observations.length).toBe(2);
    expect(profile.confidence).toBe('moderate');
    expect(profile.estimatedDailyHours).toBe('more_than_6h');
    expect(profile.source).toBe('combined');

    // 3. Record evening observation (partially shaded)
    profile = sunlightEstimationEngine.recordObservation(profile, {
      spaceId: 'space-1',
      timeOfDay: 'evening',
      condition: 'partially_shaded'
    });

    expect(profile.observations.length).toBe(3);
    expect(profile.confidence).toBe('high');
    expect(profile.source).toBe('combined');
  });

  it('determines appropriate recommended sunlight zones based on observations', () => {
    const estimate = sunlightEstimationEngine.estimateSunlight({
      userReported: '4_to_6h',
      observations: [
        {
          id: 'o1',
          spaceId: 's1',
          timeOfDay: 'morning',
          condition: 'mostly_sunny',
          timestamp: new Date().toISOString()
        },
        {
          id: 'o2',
          spaceId: 's1',
          timeOfDay: 'afternoon',
          condition: 'partially_shaded',
          timestamp: new Date().toISOString()
        }
      ]
    });

    expect(estimate.recommendedZones.some((z) => z.includes('Sunny Zone'))).toBe(true);
    expect(estimate.recommendedZones.some((z) => z.includes('Partial Shade'))).toBe(true);
  });

  it('adjusts plant recommendations when placed in a shaded sunlight zone', async () => {
    const profile: GardenProfile = {
      id: 'profile-1',
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      spaceType: 'balcony',
      spaceSize: 'small',
      sunlight: '4_to_6h',
      experience: 'complete_beginner',
      goal: 'vegetables',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const shadedZone: SunlightZone = {
      id: 'sz-shade',
      spaceId: 'space-1',
      name: 'Shaded Wall',
      type: 'shade',
      description: 'Under roof overhang'
    };

    const recs = await plantKnowledgeProvider.getRecommendations(profile, null, {
      sunlightZone: shadedZone
    });

    const tomatoRec = recs.find((r) => r.plant.id === 'cherry-tomato');
    expect(tomatoRec).toBeDefined();
    // Tomato requires full sun; should have a clear warning about the shaded zone
    expect(tomatoRec?.warningNote).toBeDefined();
    expect(tomatoRec?.warningNote).toContain('Shaded Wall');
    expect(tomatoRec?.warningNote).toContain('limited direct light');
  });

  it('does NOT fabricate decimal hour precision or lux readings', () => {
    const estimate = sunlightEstimationEngine.estimateSunlight({
      userReported: '2_to_4h',
      observations: []
    });

    // estimatedHours must be categorical SunlightAmount, never floating point
    expect(['less_than_2h', '2_to_4h', '4_to_6h', 'more_than_6h', 'unknown']).toContain(
      estimate.estimatedHours
    );

    // Ensure no lux claims in evidence or limitations
    const fullText = JSON.stringify(estimate);
    expect(fullText.toLowerCase()).not.toContain('lux');
    expect(fullText.toLowerCase()).not.toContain('5.7 hours');
  });

  it('calculates on-device astronomical sun position without external network calls', () => {
    const solar = localSunPositionProvider.calculatePosition(
      { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      new Date('2026-10-08T12:00:00.000Z')
    );

    expect(solar.daylightHours).toBeGreaterThan(10);
    expect(solar.daylightHours).toBeLessThan(14);
    expect(solar.approxSunriseTime).toBeDefined();
    expect(solar.approxSunsetTime).toBeDefined();
    expect(typeof solar.elevationDegrees).toBe('number');
    expect(typeof solar.azimuthDegrees).toBe('number');
  });
});
