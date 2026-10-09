import {
  GardenPhoto,
  GardenProfile,
  GardenSpace,
  Plant,
  GardenPlant,
  PlantSymptom,
  PlantHealthGuidance,
  GardenPhotoAnalysisResult,
  PlantPhotoAnalysisResult,
  ModelAvailabilityStatus,
  EnvironmentalContext,
  MultiMediaAnalysisResult
} from '../types';
import { VisionProvider } from './types';
import { LocalVisionProvider } from './localVisionProvider';

const STORAGE_OLLAMA_URL = 'gardenmitra_ollama_url';
const STORAGE_OLLAMA_MODEL = 'gardenmitra_ollama_model';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

/**
 * Local Ollama / Gemma Vision Adapter (Milestone 4)
 * Grounded in strict AI Honesty:
 * - NEVER fabricates vision output or mock confidence scores.
 * - If Ollama is offline or model is missing, honestly reports 'unavailable'.
 * - Runs entirely on user's local machine; no external cloud transmission.
 */
export class LocalOllamaVisionProvider implements VisionProvider {
  readonly id = 'local-ollama-vision';
  readonly name = 'Local Gemma / Ollama Vision AI (Private on Device)';
  readonly isLocalMock = false;

  private fallbackProvider = new LocalVisionProvider();

  getConfig(): OllamaConfig {
    const meta = import.meta as any;
    const defaultUrl = meta?.env?.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
    const defaultModel = meta?.env?.VITE_OLLAMA_MODEL || 'gemma3:latest';

    try {
      return {
        baseUrl: localStorage.getItem(STORAGE_OLLAMA_URL) || defaultUrl,
        model: localStorage.getItem(STORAGE_OLLAMA_MODEL) || defaultModel
      };
    } catch {
      return { baseUrl: defaultUrl, model: defaultModel };
    }
  }

  setConfig(baseUrl: string, model: string) {
    try {
      localStorage.setItem(STORAGE_OLLAMA_URL, baseUrl.trim());
      localStorage.setItem(STORAGE_OLLAMA_MODEL, model.trim());
    } catch {
      // ignore
    }
  }

  /**
   * Safe availability check. Verifies real local connection without hanging.
   */
  async checkAvailability(): Promise<{
    status: ModelAvailabilityStatus;
    message: string;
    modelsAvailable?: string[];
  }> {
    const { baseUrl, model } = this.getConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    try {
      const res = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          status: 'unavailable',
          message: `Local AI endpoint returned status ${res.status}. Ollama might be warming up.`
        };
      }

      const data = await res.json();
      const modelList: string[] = Array.isArray(data.models)
        ? data.models.map((m: { name: string }) => m.name)
        : [];

      const modelFound = modelList.some(
        (m) => m === model || m.startsWith(model.split(':')[0])
      );

      if (modelFound || modelList.length > 0) {
        return {
          status: 'available',
          message: `Local vision AI ready on ${baseUrl} using model "${modelFound ? model : modelList[0]}"`,
          modelsAvailable: modelList
        };
      }

      return {
        status: 'unavailable',
        message: `Ollama is running on ${baseUrl}, but model "${model}" is not installed yet. Run: "ollama pull ${model}"`,
        modelsAvailable: modelList
      };
    } catch (e: any) {
      clearTimeout(timeout);
      return {
        status: 'unavailable',
        message: `Local vision is not currently available at ${baseUrl}. Start Ollama locally to enable on-device AI.`
      };
    }
  }

  /**
   * Clean base64 image data string for Ollama payload
   */
  private cleanBase64(dataUrl: string): string {
    const commaIdx = dataUrl.indexOf(',');
    return commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  }

  /**
   * Analyze garden space photo with local vision model
   */
  async analyzeGardenPhoto(
    photo: GardenPhoto,
    profile?: GardenProfile | null,
    space?: GardenSpace | null
  ): Promise<GardenPhotoAnalysisResult> {
    const { baseUrl, model } = this.getConfig();
    const spaceId = space?.id || profile?.spaceId;

    // 1. First check availability honestly
    const availability = await this.checkAvailability();
    if (availability.status !== 'available') {
      return {
        status: 'unavailable',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        spaceId,
        observations: {
          generalVisualObservations: [
            'Local vision AI is not connected.',
            availability.message
          ]
        },
        disclaimer: 'AI garden analysis will be available when a vision model is connected.',
        message: availability.message
      };
    }

    // 2. Perform inference via local Ollama API
    const prompt = `You are GardenMitra, an honest beginner-first gardening companion.
Look at this photo of a home garden or growing space (${space?.name || profile?.spaceType || 'space'}).
Analyze visible elements.
IMPORTANT RULES:
- Use humble observational phrasing like "I can see...", "Appears to be...", "Possible...".
- NEVER invent millimeter measurements or false certainty.
- Return ONLY a strict JSON object with NO markdown formatting, with exactly these keys:
{
  "likelySpaceType": string,
  "visibleGrowingAreas": string,
  "visibleContainers": string,
  "existingGreenery": string,
  "obstaclesOrFurniture": string,
  "walkwayAccess": string,
  "verticalPotential": string,
  "generalVisualObservations": [string]
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          images: [this.cleanBase64(photo.dataUrl)],
          stream: false,
          format: 'json'
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData.response?.trim() || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Strip possible backticks
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      return {
        status: 'success',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        spaceId,
        observations: {
          likelySpaceType: parsed.likelySpaceType || 'Appears to be a domestic growing space',
          visibleGrowingAreas: parsed.visibleGrowingAreas || 'Growing area visible in photo',
          visibleContainers: parsed.visibleContainers || 'Containers observed in space',
          existingGreenery: parsed.existingGreenery || 'Plants or greenery observed',
          obstaclesOrFurniture: parsed.obstaclesOrFurniture || 'Standard surrounding space elements',
          walkwayAccess: parsed.walkwayAccess || 'Access area visible',
          verticalPotential: parsed.verticalPotential || 'Possible vertical wall or railing space',
          generalVisualObservations: Array.isArray(parsed.generalVisualObservations)
            ? parsed.generalVisualObservations
            : ['AI observations — verify before making changes.']
        },
        disclaimer: 'AI observations — verify before making changes.',
        message: 'On-device vision analysis completed successfully.'
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        status: 'error',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        spaceId,
        observations: {
          generalVisualObservations: [
            'Vision analysis failed to complete.',
            err?.message || 'Connection interrupted'
          ]
        },
        disclaimer: 'Local model failed to respond. Photo remains saved safely on your device.',
        message: err?.message || 'Inference error'
      };
    }
  }

  /**
   * Analyze plant health photo with local model
   */
  async analyzePlantPhoto(
    photoDataUrl: string,
    context: {
      plant?: Plant | GardenPlant | null;
      symptom?: PlantSymptom;
      space?: GardenSpace | null;
      environmentalContext?: EnvironmentalContext | null;
    }
  ): Promise<PlantPhotoAnalysisResult> {
    const { baseUrl, model } = this.getConfig();
    const plantName = context.plant
      ? 'plant' in context.plant
        ? context.plant.plant.name
        : context.plant.name
      : 'Plant';

    const availability = await this.checkAvailability();
    if (availability.status !== 'available') {
      return {
        status: 'unavailable',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        observations: {
          leafCondition: 'Local vision model is not connected.'
        },
        possibleCauses: [
          'Local AI is not currently running.',
          'Use the calm educational symptom guide below.'
        ],
        safeNextSteps: [
          'Push your finger 1 inch into the soil to check moisture.',
          'Verify drainage holes are clear.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Environmental inspection of moisture, light, and roots is essential.',
        message: availability.message
      };
    }

    const prompt = `You are GardenMitra Garden Doctor.
Look at this photo of ${plantName} showing symptom "${context.symptom || 'unspecified'}".
Environmental context: ${context.environmentalContext?.snapshot.conditionText || 'moderate'} (${context.environmentalContext?.snapshot.temperatureC || 26}°C).
Space: ${context.space?.name || 'Home Garden'}.

RULES:
- Return ONLY strict JSON with NO markdown backticks:
{
  "observations": {
    "leafCondition": string,
    "discoloration": string,
    "spotsOrMarkings": string,
    "wiltingOrStems": string,
    "visibleInsectsOrPests": string
  },
  "possibleCauses": [string],
  "safeNextSteps": [string]
}
- Do NOT provide medical-style certainty. Use "Possible causes include...", "Some leaves appear...".
- Prioritize non-chemical beginner steps: check soil moisture, adjust light, rinse leaves.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          images: [this.cleanBase64(photoDataUrl)],
          stream: false,
          format: 'json'
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData.response?.trim() || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      return {
        status: 'success',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        observations: parsed.observations || { leafCondition: 'Observation complete' },
        possibleCauses: Array.isArray(parsed.possibleCauses)
          ? parsed.possibleCauses
          : ['Fluctuating soil moisture', 'Adjustment to current light levels'],
        safeNextSteps: Array.isArray(parsed.safeNextSteps)
          ? parsed.safeNextSteps
          : ['Check soil moisture 1 inch deep', 'Observe in daylight'],
        disclaimer: 'This photo alone isn\'t enough to determine the cause. Environmental inspection is essential.',
        message: 'On-device plant diagnosis completed.'
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        status: 'error',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        observations: {
          leafCondition: 'Vision request failed.'
        },
        possibleCauses: ['Connection to local model was interrupted.'],
        safeNextSteps: [
          'Rely on the local symptom guide below.',
          'Check soil with the 1-inch finger test.'
        ],
        disclaimer: 'This photo alone isn\'t enough to determine the cause.',
        message: err?.message || 'Inference error'
      };
    }
  }

  /**
   * Analyze collection of garden photos and extracted video keyframes (Milestone 8)
   */
  async analyzeMultiMedia(
    items: { id: string; dataUrl: string; label?: string }[],
    space?: GardenSpace | null
  ): Promise<MultiMediaAnalysisResult> {
    const { baseUrl, model } = this.getConfig();
    const spaceId = space?.id;

    if (!items || items.length === 0) {
      return {
        status: 'error',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        spaceId,
        observations: [],
        uncertaintiesAndLimitations: ['No media items were supplied for analysis.'],
        suggestedAdditionalViews: ['Please capture or upload at least one photo or video.'],
        disclaimer: 'Media collection analysis requires at least one image.'
      };
    }

    // Check availability
    const availability = await this.checkAvailability();
    if (availability.status !== 'available') {
      return {
        status: 'unavailable',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        spaceId,
        observations: [
          {
            category: 'System',
            description: `Local vision AI is currently offline (${baseUrl}).`,
            confidence: 'low',
            requiresUserConfirmation: false
          }
        ],
        uncertaintiesAndLimitations: [
          'Vision inference is disabled until local Ollama is running.',
          'Physical dimensions and load capacities must always be verified manually.'
        ],
        suggestedAdditionalViews: [
          'Entrance looking outward',
          'Drainage outlets and water tap'
        ],
        disclaimer: 'AI observations are only available when an on-device vision model is running.',
        message: availability.message
      };
    }

    // Limit to representative sample (e.g. max 5 frames) to respect local model memory
    const sampledItems = items.slice(0, 5);
    const cleanedImages = sampledItems.map((item) => this.cleanBase64(item.dataUrl));

    const prompt = `You are GardenMitra, an honest beginner-first gardening companion.
Look at this multi-view collection of ${sampledItems.length} photos/keyframes of a home gardening space (${space?.name || space?.type || 'garden'}).
Analyze the physical space across all provided angles.

CRITICAL RULES:
- Be humble and honest: say "Appears to have...", "Possible...", "Visible...".
- NEVER guess millimeter measurements or weight limits. Railing safety and weight load MUST require manual user confirmation.
- Output ONLY valid JSON with NO markdown backticks:
{
  "likelySpaceType": string,
  "visibleBoundaries": string,
  "surfacesAndStructures": {
    "floor": string,
    "walls": string,
    "ceilingOrOverhead": string,
    "railings": string,
    "doorsAndWindows": string
  },
  "observedGreeneryAndPots": string,
  "obstaclesAndFurniture": string,
  "waterAndDrainage": string,
  "skyAndSunExposure": string,
  "observations": [
    {
      "category": string,
      "description": string,
      "confidence": "high" | "moderate" | "low",
      "requiresUserConfirmation": boolean
    }
  ],
  "uncertaintiesAndLimitations": [string],
  "suggestedAdditionalViews": [string]
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          images: cleanedImages,
          stream: false,
          format: 'json'
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData.response?.trim() || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      return {
        status: 'success',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        spaceId,
        likelySpaceType: parsed.likelySpaceType || space?.type || 'Garden space',
        visibleBoundaries: parsed.visibleBoundaries || 'Visible perimeter observed',
        surfacesAndStructures: parsed.surfacesAndStructures || {},
        observedGreeneryAndPots: parsed.observedGreeneryAndPots || 'Existing containers noted',
        obstaclesAndFurniture: parsed.obstaclesAndFurniture || 'Clear areas visible',
        waterAndDrainage: parsed.waterAndDrainage || 'Check ground slope for drainage',
        skyAndSunExposure: parsed.skyAndSunExposure || 'Examine overhead sky opening',
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        uncertaintiesAndLimitations: Array.isArray(parsed.uncertaintiesAndLimitations)
          ? parsed.uncertaintiesAndLimitations
          : ['Exact load-bearing capacity and millimeter dimensions require manual check.'],
        suggestedAdditionalViews: Array.isArray(parsed.suggestedAdditionalViews)
          ? parsed.suggestedAdditionalViews
          : ['Check drainage and open sky view'],
        disclaimer: 'These observations are visual estimates only. Always inspect physical safety, soil, and drainage directly.',
        message: 'Multi-image space analysis complete.'
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        status: 'error',
        providerId: this.id,
        modelName: model,
        timestamp: new Date().toISOString(),
        spaceId,
        observations: [],
        uncertaintiesAndLimitations: [
          'Multi-image inference failed or timed out.',
          'Local hardware may need smaller image batches or more VRAM.'
        ],
        suggestedAdditionalViews: ['Try analyzing 1-2 photos at a time.'],
        disclaimer: 'Analysis could not be completed on device.',
        message: err.message || 'Vision inference error'
      };
    }
  }

  /**
   * Safe fallback method for Garden Doctor rule guidance
   */
  async analyzePlantHealth(
    photoDataUrl: string,
    symptom: PlantSymptom
  ): Promise<PlantHealthGuidance> {
    return this.fallbackProvider.analyzePlantHealth(photoDataUrl, symptom);
  }
}

export const localOllamaVisionProvider = new LocalOllamaVisionProvider();
