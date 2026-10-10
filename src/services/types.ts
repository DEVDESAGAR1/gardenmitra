import {
  GardenProfile,
  GardenSpace,
  GardenPhoto,
  GardenPlant,
  Plant,
  PlantRecommendation,
  ShoppingItem,
  GardenTask,
  ChatMessage,
  PlantSymptom,
  PlantHealthGuidance,
  VisionAnalysisResult,
  GardenPhotoAnalysisResult,
  PlantPhotoAnalysisResult,
  ModelAvailabilityStatus,
  CareEvent,
  LocationInfo,
  WeatherSnapshot,
  WeatherForecast,
  EnvironmentalContext,
  MultiMediaAnalysisResult,
  PlantSearchFilters
} from '../types';

/**
 * Context passed to AI / Assistant providers
 * Extended for Multi-Space, Environmental, and Smart Care History
 */
export interface AssistantContext {
  profile: GardenProfile | null;
  selectedSpace?: GardenSpace | null;
  allSpaces?: GardenSpace[];
  selectedPlants: Plant[];
  gardenPlants?: GardenPlant[];
  careEvents?: CareEvent[];
  photoUploaded: boolean;
  tasksCount: number;
  completedTasksCount: number;
  environmentalContext?: EnvironmentalContext | null;
}

/**
 * Vision Provider Interface (Milestone 4)
 * Supports analyzing garden spaces and plant health images with local Gemma / Ollama.
 * Backward compatible with Milestone 0/1/2 safe fallback.
 */
export interface VisionProvider {
  readonly id: string;
  readonly name: string;
  readonly isLocalMock: boolean;

  checkAvailability?(): Promise<{
    status: ModelAvailabilityStatus;
    message: string;
    modelsAvailable?: string[];
  }>;

  analyzeGardenPhoto(
    photo: GardenPhoto,
    profile?: GardenProfile | null,
    space?: GardenSpace | null
  ): Promise<GardenPhotoAnalysisResult | VisionAnalysisResult>;

  analyzePlantPhoto?(
    photoDataUrl: string,
    context: {
      plant?: Plant | GardenPlant | null;
      symptom?: PlantSymptom;
      space?: GardenSpace | null;
      environmentalContext?: EnvironmentalContext | null;
    }
  ): Promise<PlantPhotoAnalysisResult>;

  analyzePlantHealth(
    photoDataUrl: string,
    symptom: PlantSymptom
  ): Promise<PlantHealthGuidance>;

  analyzeMultiMedia?(
    items: { id: string; dataUrl: string; label?: string }[],
    space?: GardenSpace | null
  ): Promise<MultiMediaAnalysisResult>;
}

/**
 * Garden Assistant Provider Interface
 * Context-aware conversational assistant.
 * Ready for future Gemma / Ollama / local LLM integration.
 */
export interface GardenAssistantProvider {
  readonly id: string;
  readonly name: string;
  readonly isLocalMock: boolean;

  respond(
    userMessage: string,
    history: ChatMessage[],
    context: AssistantContext
  ): Promise<ChatMessage>;
}

/**
 * Plant Knowledge Provider Interface
 * Recommends and queries beginner-friendly plants.
 */
export interface PlantKnowledgeProvider {
  readonly id: string;
  readonly name: string;

  getAllPlants(): Promise<Plant[]>;
  getPlantById(id: string): Promise<Plant | null>;
  searchPlants(query: string, filters?: PlantSearchFilters): Promise<Plant[]>;
  getRecommendations(
    profile: GardenProfile,
    env?: EnvironmentalContext | null,
    sunlightContext?: {
      sunlightEstimate?: import('../types').SunlightEstimate | null;
      sunlightZone?: import('../types').SunlightZone | null;
    }
  ): Promise<PlantRecommendation[]>;
}

/**
 * Shopping List Provider Interface
 * Generates actionable starter shopping lists.
 * Ready for future SerpApi / Local Nursery integrations.
 */
export interface ShoppingProvider {
  readonly id: string;
  readonly name: string;

  generateShoppingList(
    plants: Plant[],
    profile: GardenProfile | null,
    spaceId?: string,
    spaceName?: string
  ): Promise<ShoppingItem[]>;
}

/**
 * Task Generator Interface
 * Generates bite-sized daily garden tasks based on plants, profile, space, and philosophy.
 */
export interface TaskGenerator {
  generateDailyTasks(
    plants: Plant[],
    profile: GardenProfile | null,
    spaceId?: string,
    spaceName?: string,
    environmentalContext?: EnvironmentalContext | null
  ): GardenTask[];
}

/**
 * Weather Provider Interface (Milestone 2)
 * Clean abstraction for local development mock and future real weather integration.
 */
export interface WeatherProvider {
  readonly id: string;
  readonly name: string;
  readonly isLocalMock: boolean;

  getCurrentWeather(location: LocationInfo): Promise<WeatherSnapshot>;
  getForecast(location: LocationInfo): Promise<WeatherForecast>;
}
