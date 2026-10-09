import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalVisionProvider } from '../services/localVisionProvider';
import { LocalOllamaVisionProvider } from '../services/localOllamaVisionProvider';
import { BEGINNER_PLANTS } from '../data/plants';
import { GardenSpace, GardenPhoto, GardenPhotoAnalysisResult } from '../types';

describe('Milestone 4: Local Vision AI & VisionProvider', () => {
  let localSafeProvider: LocalVisionProvider;
  let ollamaProvider: LocalOllamaVisionProvider;

  const mockSpace: GardenSpace = {
    id: 'space-terrace-99',
    name: 'Rooftop Terrace',
    type: 'terrace',
    size: 'large',
    sunlight: 'more_than_6h',
    goal: 'vegetables',
    photos: [],
    plants: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const samplePhoto: GardenPhoto = {
    id: 'photo-test-1',
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    fileName: 'test-terrace.png',
    uploadedAt: new Date().toISOString()
  };

  beforeEach(() => {
    localSafeProvider = new LocalVisionProvider();
    ollamaProvider = new LocalOllamaVisionProvider();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Verifies VisionProvider contracts and properties', () => {
    expect(localSafeProvider.id).toBe('local-vision-provider');
    expect(localSafeProvider.isLocalMock).toBe(true);
    expect(typeof localSafeProvider.analyzeGardenPhoto).toBe('function');
    expect(typeof localSafeProvider.analyzePlantHealth).toBe('function');

    expect(ollamaProvider.id).toBe('local-ollama-vision');
    expect(ollamaProvider.isLocalMock).toBe(false);
    expect(typeof ollamaProvider.checkAvailability).toBe('function');
    expect(typeof ollamaProvider.analyzeGardenPhoto).toBe('function');
    expect(typeof ollamaProvider.analyzePlantPhoto).toBe('function');
  });

  it('2. Returns honest unavailable state when local Ollama is offline (No fake AI)', async () => {
    // Mock fetch to simulate Ollama offline / connection refused
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Failed to fetch (Connection refused)'));

    const availability = await ollamaProvider.checkAvailability();
    expect(availability.status).toBe('unavailable');
    expect(availability.message).toContain('Local vision is not currently available');

    const result = await ollamaProvider.analyzeGardenPhoto(samplePhoto, null, mockSpace);
    expect(result.status).toBe('unavailable');
    expect(result.disclaimer).toContain('AI garden analysis will be available');
    expect(result.observations.generalVisualObservations[0]).toContain('Local vision AI is not connected');
    // Crucial honesty: No fabricated confidence score or fake measurements!
    expect((result as any).confidence).toBeUndefined();
  });

  it('3. Successfully parses structured JSON from simulated local Gemma/Ollama response', async () => {
    // Mock availability tags check
    const mockTagsResponse = {
      ok: true,
      status: 200,
      json: async () => ({ models: [{ name: 'gemma3:latest' }] })
    };

    // Mock vision inference response
    const mockGenerateResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        response: JSON.stringify({
          likelySpaceType: 'Appears to be an open rooftop terrace',
          visibleGrowingAreas: 'Flat paved surface with strong direct daylight',
          visibleContainers: 'Several terracotta pots visible near the edge',
          existingGreenery: 'Multiple lush green plants observed',
          obstaclesOrFurniture: 'Low parapet wall visible',
          walkwayAccess: 'Wide open central walkway',
          verticalPotential: 'Parapet railing offers vertical planter opportunities',
          generalVisualObservations: [
            'I can see multiple potted plants arranged along the wall.',
            'Light appears bright and unobstructed.'
          ]
        })
      })
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (typeof url === 'string' && url.includes('/api/tags')) {
        return mockTagsResponse as any;
      }
      return mockGenerateResponse as any;
    });

    const result = await ollamaProvider.analyzeGardenPhoto(samplePhoto, null, mockSpace);
    expect(result.status).toBe('success');
    expect(result.spaceId).toBe(mockSpace.id);
    expect(result.observations.likelySpaceType).toContain('rooftop terrace');
    expect(result.observations.visibleContainers).toContain('terracotta pots');
    expect(result.observations.generalVisualObservations).toHaveLength(2);
    expect(result.disclaimer).toBe('AI observations — verify before making changes.');
  });

  it('4. Handles malformed or markdown-wrapped JSON gracefully without crashing', async () => {
    const mockTagsResponse = {
      ok: true,
      json: async () => ({ models: [{ name: 'gemma3:latest' }] })
    };

    // Simulate LLM returning markdown backticks around JSON
    const mockGenerateResponse = {
      ok: true,
      json: async () => ({
        response: `\`\`\`json
{
  "likelySpaceType": "Appears to be a sunny balcony",
  "visibleContainers": "3 railing planters",
  "generalVisualObservations": ["Visible light exposure"]
}
\`\`\``
      })
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (typeof url === 'string' && url.includes('/api/tags')) return mockTagsResponse as any;
      return mockGenerateResponse as any;
    });

    const result = await ollamaProvider.analyzeGardenPhoto(samplePhoto, null, mockSpace);
    expect(result.status).toBe('success');
    expect(result.observations.likelySpaceType).toBe('Appears to be a sunny balcony');
  });

  it('5. Handles model network interruption with clean error status', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (typeof url === 'string' && url.includes('/api/tags')) {
        return { ok: true, json: async () => ({ models: [{ name: 'gemma3:latest' }] }) } as any;
      }
      throw new Error('Network timeout after 25s');
    });

    const result = await ollamaProvider.analyzeGardenPhoto(samplePhoto, null, mockSpace);
    expect(result.status).toBe('error');
    expect(result.message).toContain('Network timeout');
    expect(result.observations.generalVisualObservations[0]).toContain('Vision analysis failed');
  });

  it('6. Analyzes plant health photo with honest disclaimer and safe actions', async () => {
    const tomato = BEGINNER_PLANTS.find((p) => p.id === 'cherry-tomato')!;

    const mockTagsResponse = {
      ok: true,
      json: async () => ({ models: [{ name: 'gemma3:latest' }] })
    };

    const mockDoctorResponse = {
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          observations: {
            leafCondition: 'Some lower leaves appear pale yellow with slight droop.',
            discoloration: 'Interveinal pale greening',
            spotsOrMarkings: 'None visible',
            visibleInsectsOrPests: 'No visible insect clusters'
          },
          possibleCauses: [
            'Overwatering leading to restricted root oxygen',
            'Natural shedding of oldest bottom leaves'
          ],
          safeNextSteps: [
            'Check pot soil 1 inch down. Hold water if damp.',
            'Ensure drainage holes are not blocked.'
          ]
        })
      })
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (typeof url === 'string' && url.includes('/api/tags')) return mockTagsResponse as any;
      return mockDoctorResponse as any;
    });

    const plantResult = await ollamaProvider.analyzePlantPhoto(samplePhoto.dataUrl, {
      plant: tomato,
      symptom: 'yellow_leaves',
      space: mockSpace
    });

    expect(plantResult.status).toBe('success');
    expect(plantResult.observations.leafCondition).toContain('pale yellow');
    expect(plantResult.possibleCauses).toContain('Overwatering leading to restricted root oxygen');
    expect(plantResult.safeNextSteps).toContain('Check pot soil 1 inch down. Hold water if damp.');
    expect(plantResult.disclaimer).toContain('This photo alone isn\'t enough to determine the cause');
  });

  it('7. LocalSafeVisionProvider provides deterministic fallback without remote network', async () => {
    const safeResult = (await localSafeProvider.analyzeGardenPhoto(
      samplePhoto,
      null,
      mockSpace
    )) as GardenPhotoAnalysisResult;
    expect(safeResult.status).toBe('mock_local');
    expect(safeResult.spaceId).toBe(mockSpace.id);
    expect(safeResult.observations.likelySpaceType).toBe(mockSpace.type);

    const plantGuidance = await localSafeProvider.analyzePlantHealth(samplePhoto.dataUrl, 'yellow_leaves');
    expect(plantGuidance.symptomTitle).toContain('Yellow Leaves');
    expect(plantGuidance.possibleCauses.length).toBeGreaterThan(1);
    expect(plantGuidance.disclaimer).toContain('This photo alone isn\'t enough');
  });
});
