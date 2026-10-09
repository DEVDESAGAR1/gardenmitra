export type SpaceType = 
  | 'balcony' 
  | 'terrace' 
  | 'backyard' 
  | 'garden' 
  | 'windowsill' 
  | 'indoor' 
  | 'pots' 
  | 'other';

export type SpaceSize = 'very_small' | 'small' | 'medium' | 'large';

export type SunlightAmount = 
  | 'less_than_2h' 
  | '2_to_4h' 
  | '4_to_6h' 
  | 'more_than_6h' 
  | 'unknown';

export type ExperienceLevel = 
  | 'complete_beginner' 
  | 'beginner' 
  | 'some_experience' 
  | 'experienced';

export type GardeningGoal = 
  | 'vegetables' 
  | 'herbs' 
  | 'flowers' 
  | 'fruits' 
  | 'kitchen_garden' 
  | 'easy_plants' 
  | 'unknown';

export interface LocationInfo {
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  source?: 'browser_geolocation' | 'manual';
  capturedAt?: string;
  displayName?: string;
}

export interface SpaceDimensions {
  width?: string;
  length?: string;
  unit?: 'ft' | 'm';
}

/**
 * Single Space within a Garden (Milestone 1)
 */
export interface GardenSpace {
  id: string;
  name: string;
  type: SpaceType;
  size: SpaceSize;
  dimensions?: SpaceDimensions;
  sunlight: SunlightAmount;
  goal: GardeningGoal;
  photos: GardenPhoto[];
  plants: GardenPlant[];
  tasks: GardenTask[];
  createdAt: string;
  updatedAt: string;
  sunlightProfile?: SunlightProfile;
  sunlightZones?: SunlightZone[];
  layout?: SpaceLayout;
  mediaAssets?: GardenMediaAsset[];
  captureSessions?: GardenCaptureSession[];
  isSheltered?: boolean;
}

/**
 * Multi-Space Garden Root Model (Milestone 1)
 */
export interface Garden {
  id: string;
  name: string;
  location: LocationInfo;
  experience: ExperienceLevel;
  spaces: GardenSpace[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Backward compatibility profile interface
 * Mirrors the single-space view for components and providers
 */
export interface GardenProfile {
  id: string;
  location: LocationInfo;
  spaceType: SpaceType;
  spaceSize: SpaceSize;
  dimensions?: SpaceDimensions;
  sunlight: SunlightAmount;
  experience: ExperienceLevel;
  goal: GardeningGoal;
  createdAt: string;
  updatedAt: string;
  spaceId?: string;
  spaceName?: string;
}

export interface GardenPhoto {
  id: string;
  dataUrl: string;
  fileName: string;
  uploadedAt: string;
  photoTimestamp?: string;
  note?: string;
}

export type PlantCategory = 'herbs' | 'vegetables' | 'flowers' | 'fruits';
export type PlantDifficulty = 'Very Easy' | 'Easy' | 'Moderate';

export interface Plant {
  id: string;
  name: string;
  hindiName?: string;
  scientificName?: string;
  category: PlantCategory;
  difficulty: PlantDifficulty;
  sunlightText: string;
  sunlightRequirement: 'low' | 'partial' | 'full'; // low: <2h, partial: 2-5h, full: 5h+
  wateringText: string;
  spaceText: string;
  containerFriendly: boolean;
  beginnerFriendly: boolean;
  approximateGrowthTime: string;
  shortDescription: string;
  basicRequirements: string[];
  recommendedFor: string[];
  containerGuidance: string;
  growingTimeline: string;
  basicCare: string[];
  thingsToWatchFor: string[];
  idealSeason?: string;
}

export interface PlantRecommendation {
  plant: Plant;
  matchScore: number; // 0 - 100
  reasoning: string[];
  warningNote?: string;
}

export type CareEventType = 
  | 'watered' 
  | 'soil_checked' 
  | 'fertilized' 
  | 'pruned' 
  | 'inspected' 
  | 'rotated' 
  | 'harvested' 
  | 'note';

export interface CareEvent {
  id: string;
  plantId: string;
  spaceId: string;
  type: CareEventType;
  timestamp: string;
  note?: string;
  soilCondition?: 'dry' | 'moist';
}

export interface GardenPlant {
  plantId: string;
  plant: Plant;
  addedAt: string;
  status: 'planning' | 'planted' | 'growing' | 'harvested';
  notes?: string;
  spaceId?: string;
  plantedAt?: string;
  lastWateredAt?: string;
  wateringCount?: number;
  lastCheckedAt?: string;
  careHistory?: CareEvent[];
}

export type CareReminderType = 
  | 'check_soil' 
  | 'watering_check' 
  | 'inspect' 
  | 'fertilize' 
  | 'prune' 
  | 'general_care';

export interface CareReminder {
  id: string;
  plantId: string;
  spaceId: string;
  type: CareReminderType;
  scheduledFor: string;
  status: 'pending' | 'completed' | 'skipped';
  reason: string;
}

export type CareActionRecommendation = 'check_soil' | 'water' | 'wait' | 'inspect' | 'no_action';

export interface CareDecision {
  action: CareActionRecommendation;
  headline: string;
  reason: string;
  urgency: 'low' | 'normal' | 'high';
  recommendedNextStep?: string;
}

export type ShoppingCategory = 'container' | 'plant' | 'medium' | 'nutrients' | 'tools';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  whatIsThisFor: string;
  whyNeeded: string;
  estimatedQuantity: string;
  checked: boolean;
  plantNames: string[];
  spaceId?: string;
  spaceName?: string;
}

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface GardenTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  completed: boolean;
  status?: TaskStatus;
  plantName?: string;
  plantId?: string;
  category: 'inspection' | 'watering' | 'sunlight' | 'maintenance' | 'prep';
  touchGrassPrompt?: string;
  spaceId?: string;
  spaceName?: string;
  isWeatherDerived?: boolean;
  actionType?: 'water' | 'check_soil' | 'inspect' | 'general';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedQuestions?: string[];
  isRuleBased?: boolean;
}

export type PlantSymptom = 
  | 'yellow_leaves'
  | 'brown_leaves'
  | 'wilting'
  | 'spots'
  | 'insects'
  | 'not_growing'
  | 'not_flowering'
  | 'other';

export interface PlantHealthGuidance {
  symptomTitle: string;
  possibleCauses: string[];
  investigationSteps: string[];
  immediateSafeActions: string[];
  disclaimer: string;
}

export interface VisionAnalysisResult {
  status: 'mock_local' | 'success' | 'unavailable' | 'error';
  message: string;
  spaceAssessment: string;
  recommendedNextStep: string;
  photoUrl: string;
}

export type ModelAvailabilityStatus = 'checking' | 'available' | 'unavailable' | 'error';

export interface GardenPhotoObservations {
  likelySpaceType?: string;
  visibleGrowingAreas?: string;
  visibleContainers?: string;
  existingGreenery?: string;
  obstaclesOrFurniture?: string;
  walkwayAccess?: string;
  verticalPotential?: string;
  generalVisualObservations: string[];
}

export interface GardenPhotoAnalysisResult {
  status: 'success' | 'unavailable' | 'mock_local' | 'error';
  providerId: string;
  modelName?: string;
  timestamp: string;
  spaceId?: string;
  observations: GardenPhotoObservations;
  confidence?: number;
  disclaimer: string;
  message?: string;
}

export interface PlantPhotoObservations {
  leafCondition?: string;
  discoloration?: string;
  spotsOrMarkings?: string;
  wiltingOrStems?: string;
  visibleInsectsOrPests?: string;
  visibleDamage?: string;
}

export interface PlantPhotoAnalysisResult {
  status: 'success' | 'unavailable' | 'mock_local' | 'error';
  providerId: string;
  modelName?: string;
  timestamp: string;
  plantId?: string;
  spaceId?: string;
  observations: PlantPhotoObservations;
  possibleCauses: string[];
  safeNextSteps: string[];
  disclaimer: string;
  confidence?: number;
  message?: string;
}

export interface StoredAIObservation {
  id: string;
  photoId: string;
  timestamp: string;
  spaceId?: string;
  plantId?: string;
  model: string;
  type: 'garden_space' | 'plant_health';
  observations: Record<string, any>;
  confidence?: number;
  status: 'success' | 'unavailable' | 'error';
}

/**
 * Environmental Intelligence Foundation Models (Milestone 2)
 */
export interface WeatherSnapshot {
  temperatureC: number;
  minTemperatureC: number;
  maxTemperatureC: number;
  humidityPercent: number;
  precipitationProbabilityPercent: number;
  rainfallMm: number;
  windSpeedKmh: number;
  cloudCoverPercent: number;
  conditionText: string;
  timestamp: string;
  isMock: boolean;
}

export interface DailyWeatherForecast {
  date: string;
  maxTempC: number;
  minTempC: number;
  precipitationProbPercent: number;
  rainfallMm: number;
  conditionText: string;
}

export interface WeatherForecast {
  current: WeatherSnapshot;
  daily: DailyWeatherForecast[];
  location: LocationInfo;
  source: string;
  confidence: string;
}

export type EnvironmentalSourceType =
  | 'open_meteo_live'
  | 'cached'
  | 'stale'
  | 'demo_mock'
  | 'simulated'
  | 'unavailable';

export interface EnvironmentalContext {
  location: LocationInfo;
  snapshot: WeatherSnapshot;
  forecast?: WeatherForecast;
  source: EnvironmentalSourceType;
  confidence: string;
  timestamp: string;
  isLive?: boolean;
  isCached?: boolean;
  isStale?: boolean;
  isUnavailable?: boolean;
  errorMessage?: string;
  lastFetchedAt?: string;
}

export interface EnvironmentalAdvice {
  headline: string;
  advice: string;
  actionType: 'rain' | 'heat' | 'wind' | 'normal';
  suggestedTask?: {
    title: string;
    description: string;
    estimatedMinutes: number;
    category: 'watering' | 'maintenance' | 'inspection';
  };
}

/**
 * Milestone 5: Sunlight Intelligence Models
 */
export type SunlightSource = 'user_reported' | 'photo_estimate' | 'calculated' | 'combined';
export type SunlightExposureLevel = 'low' | 'partial' | 'moderate' | 'high' | 'unknown';
export type ConfidenceLevel = 'low' | 'moderate' | 'high';

export interface SunlightObservation {
  id: string;
  spaceId: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  condition: 'mostly_sunny' | 'partially_shaded' | 'mostly_shaded';
  timestamp: string;
  notes?: string;
}

export interface SunlightZone {
  id: string;
  spaceId: string;
  name: string;
  type: 'sunny' | 'partial_shade' | 'shade';
  description?: string;
}

export interface SunlightProfile {
  source: SunlightSource;
  estimatedDailyHours: SunlightAmount;
  confidence: ConfidenceLevel;
  morningExposure: SunlightExposureLevel;
  afternoonExposure: SunlightExposureLevel;
  eveningExposure: SunlightExposureLevel;
  seasonalNotes?: string;
  observations: SunlightObservation[];
  lastUpdated: string;
  evidence: string[];
  limitations: string[];
}

export interface SunlightEstimate {
  estimatedHours: SunlightAmount;
  confidence: ConfidenceLevel;
  source: SunlightSource;
  morningExposure: SunlightExposureLevel;
  afternoonExposure: SunlightExposureLevel;
  eveningExposure: SunlightExposureLevel;
  evidence: string[];
  limitations: string[];
  recommendedZones: string[];
}

/**
 * Milestone 6: Space & Layout Optimization Models
 */
export type SpaceZoneType =
  | 'growing_zone'
  | 'walkway'
  | 'doorway_access'
  | 'railing'
  | 'wall'
  | 'water_access'
  | 'shaded_area'
  | 'sunny_area'
  | 'furniture_obstacle';

export interface SpaceZone {
  id: string;
  spaceId: string;
  name: string;
  type: SpaceZoneType;
  sunlightZoneId?: string;
  description?: string;
  isWalkway?: boolean;
}

export type ContainerType =
  | 'pot'
  | 'grow_bag'
  | 'planter_box'
  | 'hanging_planter'
  | 'vertical_planter';

export interface GardenContainer {
  id: string;
  spaceId: string;
  name: string;
  type: ContainerType;
  size: 'small' | 'medium' | 'large';
  dimensions?: { width?: string; depth?: string; height?: string };
  sunlightZoneId?: string;
  zoneId?: string;
  maxPlants?: number;
  plantIds?: string[];
  isAccessibleForWatering?: boolean;
}

export interface PlantPlacement {
  id: string;
  spaceId: string;
  plantId: string;
  plantName: string;
  containerId?: string;
  zoneId?: string;
  sunlightZoneId?: string;
  notes?: string;
}

export interface LayoutIssue {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  type:
    | 'sunlight_incompatibility'
    | 'blocked_walkway'
    | 'blocked_access'
    | 'excessive_density'
    | 'watering_difficulty'
    | 'container_size';
  message: string;
  affectedPlantName?: string;
  affectedContainerName?: string;
  suggestedAction: string;
}

export interface LayoutRecommendation {
  id: string;
  plantId: string;
  plantName: string;
  recommendedZoneId?: string;
  recommendedZoneName?: string;
  recommendedContainerType?: ContainerType;
  headline: string;
  reason: string;
  tip?: string;
}

export interface SpaceLayout {
  width?: string;
  depth?: string;
  unit?: 'ft' | 'm';
  zones: SpaceZone[];
  containers: GardenContainer[];
  plantPlacements: PlantPlacement[];
  issues?: LayoutIssue[];
  recommendations?: LayoutRecommendation[];
  updatedAt: string;
}

/**
 * Milestone 7: Automatic Location & Geolocation Models
 */
export type LocationPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported' | 'error';

export interface GardenLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  capturedAt: string;
  source: 'browser_geolocation' | 'manual';
  displayName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface LocationProvider {
  getPermissionStatus(): Promise<LocationPermissionStatus>;
  requestCurrentLocation(): Promise<GardenLocation>;
}

/**
 * Milestone 8: Garden Capture Intelligence Models
 */
export type GardenMediaType = 'photo' | 'video' | 'video_frame';
export type CaptureSource = 'upload' | 'camera' | 'video_recording';
export type CaptureSessionStatus = 'draft' | 'processing' | 'ready' | 'partial' | 'failed';

export interface GardenMediaAsset {
  id: string;
  spaceId: string;
  sessionId: string;
  type: GardenMediaType;
  source: CaptureSource;
  createdAt: string;
  capturedAt?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  thumbnailUrl?: string; // Small thumbnail preview
  parentMediaId?: string; // For video_frame, the parent video ID
  frameTimestampSeconds?: number;
  direction?: string;
  purpose?: string;
  analysisStatus?: 'pending' | 'analyzed' | 'failed';
}

export interface GardenCaptureSession {
  id: string;
  spaceId: string;
  createdAt: string;
  updatedAt: string;
  status: CaptureSessionStatus;
  mediaIds: string[];
  notes?: string;
}

export interface ExtractedVideoFrame {
  timestampSeconds: number;
  blob: Blob;
  width: number;
  height: number;
  dataUrl?: string;
}

export interface SpaceCaptureChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'overview' | 'structure' | 'ground' | 'sky' | 'detail';
  completed: boolean;
}

export interface MultiMediaObservation {
  category: string;
  description: string;
  confidence: 'high' | 'moderate' | 'low';
  sourceMediaIds?: string[];
  requiresUserConfirmation: boolean;
}

export interface MultiMediaAnalysisResult {
  status: 'success' | 'unavailable' | 'partial' | 'error';
  providerId: string;
  modelName?: string;
  timestamp: string;
  spaceId?: string;
  sessionId?: string;
  likelySpaceType?: string;
  visibleBoundaries?: string;
  surfacesAndStructures?: {
    floor?: string;
    walls?: string;
    ceilingOrOverhead?: string;
    railings?: string;
    doorsAndWindows?: string;
  };
  observedGreeneryAndPots?: string;
  obstaclesAndFurniture?: string;
  waterAndDrainage?: string;
  skyAndSunExposure?: string;
  observations: MultiMediaObservation[];
  uncertaintiesAndLimitations: string[];
  suggestedAdditionalViews: string[];
  disclaimer: string;
  message?: string;
}

