import { describe, it, expect } from 'vitest';
import { visionProvider } from '../services/localVisionProvider';
import { GardenProfile } from '../types';

describe('Vision & Garden Doctor Local Provider', () => {
  const profile: GardenProfile = {
    id: 'test-profile',
    location: { city: 'London', state: 'England', country: 'UK' },
    spaceType: 'windowsill',
    spaceSize: 'very_small',
    sunlight: '2_to_4h',
    experience: 'complete_beginner',
    goal: 'herbs',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('honestly returns mock_local and states AI analysis requires a connected vision model', async () => {
    const analysis = await visionProvider.analyzeGardenPhoto(
      {
        id: 'photo-1',
        dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        fileName: 'balcony.jpg',
        uploadedAt: new Date().toISOString()
      },
      profile
    );

    expect(analysis.status).toBe('mock_local');
    expect(analysis.message).toContain('Photo saved. AI garden analysis will be available when a vision model is connected.');
    // Must NOT invent fake CV confidence scores
    expect((analysis as any).confidence).toBeUndefined();
    expect((analysis as any).detectedObjects).toBeUndefined();
  });

  it('provides safe, educational troubleshooting and explicit non-diagnosis disclaimers for symptoms', async () => {
    const yellowGuidance = await visionProvider.analyzePlantHealth('', 'yellow_leaves');
    expect(yellowGuidance.symptomTitle).toContain('Yellow Leaves');
    expect(yellowGuidance.possibleCauses.length).toBeGreaterThan(0);
    expect(yellowGuidance.disclaimer).toContain('This photo alone isn\'t enough');

    const insectGuidance = await visionProvider.analyzePlantHealth('', 'insects');
    expect(insectGuidance.symptomTitle).toContain('Insects');
    expect(insectGuidance.immediateSafeActions.some((a) => a.toLowerCase().includes('rinse') || a.toLowerCase().includes('soap') || a.toLowerCase().includes('neem'))).toBe(true);
  });
});
