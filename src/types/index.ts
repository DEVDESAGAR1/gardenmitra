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
  coverage?: SpaceCaptureCoverage;
  measurements?: SpaceMeasurement[];
  digitalTwin?: GardenDigitalTwin;
  userObservations?: UserConfirmableObservation[];
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

export type PlantCategory = 
  | 'herbs' 
  | 'vegetables' 
  | 'flowers' 
  | 'fruits' 
  | 'indoor' 
  | 'succulents' 
  | 'native' 
  | 'other';

export type PlantDifficulty = 'Very Easy' | 'Easy' | 'Moderate' | 'Intermediate' | 'Challenging';

/**
 * Milestone 11: Plant Knowledge & Provenance Models
 */
export interface PlantContainerRequirement {
  minimumDepthCm?: number;
  recommendedDepthCm?: number;
  minimumVolumeLitres?: number;
  spacingCm?: number;
}

export interface PlantSoilRequirement {
  texture?: string[];
  drainage?: 'poor' | 'moderate' | 'good' | 'unknown';
  phMin?: number;
  phMax?: number;
}

export interface PlantTemperatureRequirement {
  minC?: number;
  optimalMinC?: number;
  optimalMaxC?: number;
  maxC?: number;
}

export interface PlantGrowthMetrics {
  germinationDaysMin?: number;
  germinationDaysMax?: number;
  maturityDaysMin?: number;
  maturityDaysMax?: number;
  matureHeightCm?: number;
  matureWidthCm?: number;
  perennial?: boolean;
}

export interface PlantSeasonRule {
  region?: 'all_india' | 'north_plains' | 'south_peninsular' | 'coastal' | 'hills' | 'north' | 'south' | 'east' | 'west' | 'central';
  seasons: Array<'summer' | 'monsoon' | 'winter' | 'spring' | 'autumn' | 'year_round'>;
  months?: number[]; // 1 to 12
  guidance: string;
}

export interface PlantCareInstruction {
  title: string;
  category: 'watering' | 'sunlight' | 'soil' | 'pruning' | 'feeding' | 'protection';
  instruction: string;
  frequencyDays?: number;
}

export interface PlantDataQuality {
  status: 'verified' | 'reviewed' | 'provisional';
  sources: Array<{
    name: string;
    url?: string;
    accessedAt?: string;
    licence?: string;
  }>;
  lastReviewedAt?: string;
  missingFields?: string[];
}

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

  // Milestone 11 Knowledge Base Extensions
  regionalNames?: Record<string, string[]>;
  containerRequirements?: PlantContainerRequirement;
  soilRequirements?: PlantSoilRequirement;
  temperatureRequirements?: PlantTemperatureRequirement;
  growthMetrics?: PlantGrowthMetrics;
  seasonalRules?: PlantSeasonRule[];
  careInstructions?: PlantCareInstruction[];
  edible?: boolean;
  toxicToPets?: boolean;
  indoorSuitable?: boolean;
  maintenance?: 'low' | 'medium' | 'high';
  dataQuality?: PlantDataQuality;
}

export interface PlantRecommendation {
  plant: Plant;
  matchScore: number; // 0 - 100
  reasoning: string[];
  warningNote?: string;
  positiveReasons?: string[];
  potentialConflicts?: string[];
  missingInformation?: string[];
  confidenceLevel?: 'high' | 'moderate' | 'tentative';
  nextAction?: string;
}

export interface PlantSearchFilters {
  category?: PlantCategory;
  sunlightRequirement?: 'low' | 'partial' | 'full';
  difficulty?: PlantDifficulty;
  edibleOnly?: boolean;
  petSafeOnly?: boolean;
  indoorOnly?: boolean;
  maintenance?: 'low' | 'medium' | 'high';
  maxContainerDepthCm?: number;
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

/**
 * Milestone 12: Garden Memory & Growth Tracking Models
 */
export type PlantLifecycleStage =
  | 'planned'
  | 'seeded'
  | 'germinated'
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'harvest'
  | 'dormant'
  | 'declining'
  | 'removed'
  | 'unknown';

export type PlantJournalEntryType =
  | 'planted'
  | 'watered'
  | 'fertilized'
  | 'pruned'
  | 'transplanted'
  | 'stage_changed'
  | 'flowering'
  | 'harvested'
  | 'symptom_observed'
  | 'photo_added'
  | 'height_measured'
  | 'user_note'
  | 'care_action'
  | 'diagnosis_recorded'
  | 'follow_up_recorded';

export interface PlantJournalEntry {
  id: string;
  plantInstanceId: string;
  plantId: string;
  spaceId: string;
  type: PlantJournalEntryType;
  occurredAt: string;
  recordedAt: string;
  note?: string;
  mediaIds?: string[];
  source: 'user' | 'care_engine' | 'vision_ai' | 'system';
  confidence?: number;
  stage?: PlantLifecycleStage;
  heightCm?: number;
  diagnosisReportId?: string;
  environmentalSnapshot?: {
    temperatureC?: number;
    weatherCondition?: string;
    isRainy?: boolean;
  };
}

export interface PlantLifecycleEvent {
  id: string;
  stage: PlantLifecycleStage;
  transitionedAt: string;
  note?: string;
  source: 'user' | 'system';
}

export interface PlantHeightMeasurement {
  id: string;
  heightCm: number;
  measuredAt: string;
  source: 'user_measured';
  note?: string;
}

export interface GardenInsight {
  id: string;
  plantInstanceId?: string;
  spaceId?: string;
  title: string;
  description: string;
  category: 'milestone' | 'consistency' | 'check_in' | 'seasonal';
  urgency: 'low' | 'normal' | 'info';
  createdAt: string;
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

  // Milestone 12 Plant Instance & Lifecycle Tracking
  instanceId?: string; // Stable unique plant instance ID
  containerId?: string;
  lifecycleStage?: PlantLifecycleStage;
  lifecycleHistory?: PlantLifecycleEvent[];
  journalEntries?: PlantJournalEntry[];
  heightMeasurements?: PlantHeightMeasurement[];
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
  imageAttachment?: string;
}

export type PlantSymptom = 
  | 'yellow_leaves'
  | 'brown_leaves'
  | 'wilting'
  | 'spots'
  | 'insects'
  | 'not_growing'
  | 'not_flowering'
  | 'curling'
  | 'drooping'
  | 'leaf_drop'
  | 'stunted_growth'
  | 'root_concerns'
  | 'pests'
  | 'abnormal_flowering_fruiting'
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
 * Milestone 16: Severe Weather Alert & Weather Intelligence
 */
export interface SevereWeatherAlert {
  id: string;
  type: 'heatwave' | 'frost' | 'heavy_rain' | 'high_winds' | 'storm';
  severity: 'advisory' | 'warning' | 'alert';
  headline: string;
  description: string;
  instructions: string;
  recommendedAction?: string;
  validFrom?: string;
  expiresAt?: string;
}

/**
 * Environmental Intelligence Foundation Models (Milestone 2 & Milestone 16)
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

  // Milestone 16 Weather Intelligence Extensions
  apparentTemperatureC?: number;
  observedRainfallMm?: number;
  forecastRainfallMm?: number;
  validFrom?: string;
  validUntil?: string;
  retrievedAt?: string;
  severeWeatherAlert?: SevereWeatherAlert;
}

export interface DailyWeatherForecast {
  date: string;
  maxTempC: number;
  minTempC: number;
  precipitationProbPercent: number;
  rainfallMm: number;
  conditionText: string;
  apparentTempMaxC?: number;
  windSpeedKmh?: number;
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

/**
 * Milestone 9: Adaptive Space Scanning & Measurement Models
 */
export type CaptureView =
  | 'entrance'
  | 'front'
  | 'left'
  | 'right'
  | 'rear'
  | 'floor'
  | 'ceiling'
  | 'sky'
  | 'drainage'
  | 'water_source'
  | 'boundary'
  | 'shade'
  | 'existing_plants'
  | 'unknown';

export type CoverageStatus =
  | 'unknown'
  | 'partially_covered'
  | 'covered'
  | 'needs_confirmation';

export interface CaptureCoverageItem {
  view: CaptureView;
  label: string;
  description: string;
  status: CoverageStatus;
  evidenceMediaIds: string[];
  confidence: number;
  reason?: string;
  directionPrompt?: string;
  whyItMatters?: string;
}

export interface SpaceCaptureCoverage {
  spaceId: string;
  updatedAt: string;
  views: CaptureCoverageItem[];
  overallConfidence: number;
  coveredCount: number;
  totalRequiredViews: number;
  missingImportantViews: CaptureView[];
  nextRecommendedView?: CaptureCoverageItem;
}

export type MeasurementSource =
  | 'user_measured'
  | 'reference_calibrated'
  | 'visual_estimate';

export interface SpaceMeasurement {
  id: string;
  spaceId: string;
  name: string;
  value: number;
  unit: 'm' | 'cm' | 'ft' | 'm2' | 'ft2';
  source: MeasurementSource;
  confidence: number;
  createdAt: string;
  evidenceMediaIds?: string[];
  notes?: string;
}

export interface UsableSpaceCalculation {
  spaceId: string;
  totalFloorAreaSqFt: number;
  usablePlantingAreaSqFt: number;
  walkingAreaSqFt: number;
  obstacleAreaSqFt: number;
  containerOccupiedAreaSqFt: number;
  unit: 'sq_ft' | 'sq_m';
  confidence: 'high' | 'moderate' | 'rough_estimate';
  assumptions: string[];
  warnings: string[];
}

export interface UserConfirmableObservation {
  id: string;
  spaceId: string;
  category: 'rain_exposure' | 'walkway' | 'railing_safety' | 'drainage' | 'shade' | 'other';
  question: string;
  value: string;
  confirmedAt: string;
  source: 'user_confirmed';
  notes?: string;
}

/**
 * Milestone 10: Garden Digital Twin & AI Visualizer Models
 */
export type DigitalTwinProposalMode =
  | 'space_efficient'
  | 'beginner_friendly'
  | 'max_edibles'
  | 'low_maintenance';

export interface DigitalTwinProposal {
  id: string;
  mode: DigitalTwinProposalMode;
  title: string;
  description: string;
  layout: SpaceLayout;
  explanations: string[];
  newPlacementsCount: number;
  movedContainersCount: number;
  usablePlantingAreaSqFt: number;
  warnings: LayoutIssue[];
  createdAt: string;
}

export interface GardenDigitalTwin {
  id: string;
  spaceId: string;
  version: number;
  updatedAt: string;
  layout: SpaceLayout;
  measurements: SpaceMeasurement[];
  coverage?: SpaceCaptureCoverage;
  usableSpace?: UsableSpaceCalculation;
  evidenceMediaIds: string[];
  observations: UserConfirmableObservation[];
  assumptions: string[];
  proposals?: DigitalTwinProposal[];
  activeProposal?: DigitalTwinProposal;
}

/**
 * Milestone 13: Physical Garden Intelligence & Sensor Integration Models
 */
export type EnvironmentalMeasurementType =
  | 'air_temperature'
  | 'relative_humidity'
  | 'soil_moisture'
  | 'ambient_light'
  | 'soil_temperature'
  | 'rainfall';

export type EnvironmentalUnit = '°C' | '%' | 'lux' | 'ppfd' | 'mm';

export type ObservationSource =
  | 'manual'
  | 'connected_sensor'
  | 'imported'
  | 'simulated';

export type ObservationDataQuality = 'valid' | 'questionable' | 'invalid';

export type SensorDeviceType =
  | 'soil_sensor'
  | 'weather_station'
  | 'light_meter'
  | 'all_in_one'
  | 'manual';

export type SensorDeviceStatus = 'active' | 'idle' | 'disconnected';

export interface SensorCalibration {
  calibratedAt?: string;
  offset?: number;
  scale?: string;
  notes?: string;
}

export interface SensorDevice {
  id: string;
  name: string;
  type: SensorDeviceType;
  spaceId: string;
  supportedTypes: EnvironmentalMeasurementType[];
  lastSeenAt?: string;
  status: SensorDeviceStatus;
  hardwareDetails?: {
    manufacturer?: string;
    model?: string;
    firmwareVersion?: string;
    protocol?: 'manual' | 'ble' | 'wifi' | 'mqtt' | 'http';
  };
  registeredAt: string;
}

export interface EnvironmentalObservation {
  id: string;
  spaceId: string;
  plantInstanceId?: string;
  type: EnvironmentalMeasurementType;
  value: number;
  unit: EnvironmentalUnit;
  timestamp: string;
  source: ObservationSource;
  sensorId?: string;
  calibration?: SensorCalibration;
  dataQuality: ObservationDataQuality;
  validationErrors?: string[];
  notes?: string;
}

export interface EnvironmentalSummary {
  type: EnvironmentalMeasurementType;
  unit: EnvironmentalUnit;
  min: number;
  max: number;
  avg: number;
  latestValue: number;
  latestTimestamp: string;
  count: number;
  isStale: boolean;
}

export interface PlantEnvironmentalInsight {
  id: string;
  plantInstanceId?: string;
  spaceId: string;
  title: string;
  description: string;
  supportingObservationIds: string[];
  referencedRequirement?: {
    requirement: string;
    source: string;
  };
  evidenceQuality: 'verified_evidence' | 'reviewed_guidance' | 'insufficient_data';
  severity: 'info' | 'warning' | 'alert';
  recommendedNextStep: string;
  createdAt: string;
}

/**
 * Milestone 14: Adaptive Garden Care Planner & Action Engine Models
 */
export type CareActionCategory =
  | 'watering'
  | 'inspection'
  | 'feeding'
  | 'pruning'
  | 'protection'
  | 'milestone_check';

export type CareRecommendationClassification =
  | 'recommended'
  | 'needs_inspection'
  | 'insufficient_data'
  | 'no_action_needed';

export type CareEvidenceQuality = 'high' | 'moderate' | 'insufficient';

export type CarePriority = 'high' | 'normal' | 'low';

export type CareTaskStatus =
  | 'suggested'
  | 'planned'
  | 'due'
  | 'completed'
  | 'snoozed'
  | 'dismissed'
  | 'expired'
  | 'postponed'
  | 'suppressed';

export interface CareRecommendation {
  id: string;
  spaceId: string;
  targetPlantInstanceId?: string;
  plantId?: string;
  category: CareActionCategory;
  actionTitle: string;
  actionInstructions: string;
  reason: string;
  supportingObservationIds?: string[];
  supportingCareEventIds?: string[];
  referencedRequirement?: {
    source: string;
    requirement: string;
  };
  evidenceQuality: CareEvidenceQuality;
  classification: CareRecommendationClassification;
  priority: CarePriority;
  suggestedTimeWindow?: string;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'converted_to_task' | 'dismissed' | 'expired';

  // Milestone 16 Weather Intelligence Extensions
  weatherReason?: string;
  isPostponedOrSuppressed?: boolean;
  reevaluateAt?: string;
  missingEvidence?: string[];
  weatherAlert?: SevereWeatherAlert;
  spaceExposure?: 'exposed' | 'sheltered' | 'indoor';
  evidenceLimitations?: string[];
}

export interface AdaptiveCareTask {
  id: string;
  recommendationId?: string;
  plantInstanceId?: string;
  plantId?: string;
  plantName?: string;
  spaceId: string;
  spaceName?: string;
  title: string;
  description: string;
  category: CareActionCategory;
  priority: CarePriority;
  status: CareTaskStatus;
  estimatedMinutes: number;
  createdAt: string;
  dueWindow?: string;
  completedAt?: string;
  completionNotes?: string;
  snoozedUntil?: string;
  dismissedAt?: string;
  dismissReason?: string;
  supportingObservationIds?: string[];
  touchGrassPrompt?: string;

  // Milestone 16 Weather Intelligence Extensions
  isWeatherAware?: boolean;
  weatherReason?: string;
  isPostponed?: boolean;
  reevaluateAt?: string;
  missingEvidence?: string[];
  weatherAlertHeadline?: string;
  spaceExposure?: 'exposed' | 'sheltered' | 'indoor';
}

/**
 * Milestone 15: Advanced Plant Health Intelligence Models
 */
export type SymptomAffectedPart =
  | 'leaves_lower'
  | 'leaves_upper'
  | 'new_growth'
  | 'stems'
  | 'roots_base'
  | 'flowers_fruit'
  | 'whole_plant';

export type SymptomProgression =
  | 'sudden_1_2_days'
  | 'gradual_past_week'
  | 'chronic_weeks';

export type SymptomDistribution =
  | 'single_leaf'
  | 'few_leaves'
  | 'new_shoots'
  | 'old_leaves'
  | 'entire_plant';

export interface StructuredSymptomReport {
  primarySymptom: PlantSymptom;
  affectedPart?: SymptomAffectedPart;
  progression?: SymptomProgression;
  distribution?: SymptomDistribution;
  userNotes?: string;
  photoUrl?: string;
  recentChanges?: string[]; // e.g. 'repotting', 'location_shift', 'fertilizer', 'heatwave'
}

export type DiagnosisEvidenceStrength = 'likely' | 'possible' | 'insufficient_evidence';

export type EvidenceItemSource =
  | 'verified_botanical'
  | 'user_observation'
  | 'sensor_measurement'
  | 'image_analysis'
  | 'general_precaution';

export interface DiagnosisEvidenceItem {
  description: string;
  source: EvidenceItemSource;
  attribution?: string;
  timestamp?: string;
  isStale?: boolean;
}

export interface RankedDiagnosisCause {
  id: string;
  title: string;
  explanation: string;
  strength: DiagnosisEvidenceStrength;
  supportingEvidence: DiagnosisEvidenceItem[];
  conflictingEvidence: DiagnosisEvidenceItem[];
  missingInformation: string[];
  safeTreatmentSteps: string[];
  urgentEscalationTriggers?: string[];
  suggestedCareAction?: {
    category: CareActionCategory;
    title: string;
    description: string;
    priority: CarePriority;
  };
}

export interface ContextualDiagnosisReport {
  id: string;
  spaceId: string;
  plantInstanceId?: string;
  plantId?: string;
  plantName: string;
  timestamp: string;
  symptoms: StructuredSymptomReport;
  summary: string;
  rankedCauses: RankedDiagnosisCause[];
  overallEvidenceStrength: DiagnosisEvidenceStrength;
  generalPrecautions: string[];
  followUpQuestions: string[];
  isOfflineDeterministic: boolean;
  aiVisionIncluded?: boolean;
  disclaimer: string;
}

export interface DiagnosisRecord {
  id: string;
  report: ContextualDiagnosisReport;
  createdAt: string;
  userFeedback?: 'helpful' | 'needs_more_info' | 'incorrect';
  createdTaskId?: string;
  followUpStatus?: 'resolved' | 'improved' | 'no_change' | 'declined';
  followUpNotes?: string;
}

/**
 * Milestone 17: Garden Performance, Growth Insights & Explainable Analytics Models
 */
export type PerformanceTimeWindow = 'last_7_days' | 'last_30_days' | 'all_time';

export type PerformanceInsightCategory =
  | 'inventory'
  | 'lifecycle'
  | 'growth'
  | 'care'
  | 'health'
  | 'environmental'
  | 'milestone';

export type PerformanceActionType =
  | 'record_height'
  | 'capture_photo'
  | 'inspect_plant'
  | 'review_task'
  | 'complete_follow_up'
  | 'check_soil';

export interface ExplainablePerformanceInsight {
  id: string;
  stableKey: string;
  category: PerformanceInsightCategory;
  priority: 'high' | 'normal' | 'info';
  title: string;
  explanation: string;
  supportingRecordIds: string[];
  plantId?: string;
  plantInstanceId?: string;
  plantName?: string;
  spaceId?: string;
  spaceName?: string;
  recordsExamined: number;
  dataLimitations: string[];
  recommendedNextAction?: string;
  actionType?: PerformanceActionType;
  latestEvidenceTimestamp?: string;
  timeWindow?: PerformanceTimeWindow;
}

export interface PlantInventorySummary {
  totalPlants: number;
  activeCount: number;
  plannedCount: number;
  harvestedCount: number;
  removedCount: number;
  byCategory: Record<PlantCategory, number>;
  bySpace: Array<{ spaceId: string; spaceName: string; count: number }>;
}

export interface LifecycleMilestoneEvent {
  plantInstanceId: string;
  plantName: string;
  stage: PlantLifecycleStage;
  date: string;
  source: 'user' | 'system' | 'care_engine';
  isConfirmed: boolean;
}

export interface LifecycleMilestonesSummary {
  stageCounts: Record<PlantLifecycleStage, number>;
  milestoneTimeline: LifecycleMilestoneEvent[];
  confirmedMilestonesCount: number;
  inferredMilestonesCount: number;
}

export interface PlantGrowthRateItem {
  plantInstanceId: string;
  plantName: string;
  initialHeightCm?: number;
  latestHeightCm?: number;
  deltaCm?: number;
  daysElapsed?: number;
  growthRateCmPerDay?: number;
  measurementCount: number;
  status: 'sufficient_data' | 'insufficient_data';
  measurements: Array<{ id: string; heightCm: number; measuredAt: string }>;
  dataLimitations: string[];
}

export interface GrowthAnalyticsSummary {
  totalObservations: number;
  totalHeightMeasurements: number;
  plantsWithMeasurements: number;
  plantsWithSufficientData: number;
  plantGrowthRates: PlantGrowthRateItem[];
}

export interface CareActivitySummary {
  totalCompletedTasks: number;
  totalPendingTasks: number;
  totalEligibleTasks: number;
  completionRatePercent: number | null;
  denominatorExplanation: string;
  tasksByCategory: Record<CareActionCategory, number>;
  journalCareEventsCount: number;
}

export interface HealthRecoverySummary {
  totalDiagnoses: number;
  totalFollowUps: number;
  outcomes: {
    resolved: number;
    improved: number;
    no_change: number;
    declined: number;
    pending: number;
  };
  recurringSymptoms: Array<{ symptom: PlantSymptom; count: number }>;
  plantsWarrantingInspection: Array<{
    plantInstanceId: string;
    plantName: string;
    spaceId: string;
    reason: string;
  }>;
}

export interface GardenPerformanceReport {
  generatedAt: string;
  timeWindow: PerformanceTimeWindow;
  spaceFilterId?: string;
  inventory: PlantInventorySummary;
  lifecycle: LifecycleMilestonesSummary;
  growth: GrowthAnalyticsSummary;
  care: CareActivitySummary;
  health: HealthRecoverySummary;
  insights: ExplainablePerformanceInsight[];
  hasHistoricalWeather: boolean;
  historicalWeatherNote: string;
}

/**
 * Task-Aware Vision & Plant Identification (Phases 2-5)
 */
export interface PlantIdentificationResult {
  status: 'success' | 'unavailable' | 'error' | 'not_a_plant';
  providerId: string;
  modelName?: string;
  timestamp: string;
  likelyPlant?: {
    commonName: string;
    scientificName?: string;
    confidenceLevel: 'likely' | 'possible' | 'uncertain';
    visibleFeatures: string[];
    careSummary?: string;
  };
  alternativePossibilities?: Array<{
    commonName: string;
    distinguishingNote: string;
  }>;
  isUncertain: boolean;
  guidance: string;
  matchedCatalogPlantId?: string;
  message?: string;
}

export interface ImageRelevanceValidationResult {
  isRelevant: boolean;
  status: 'valid' | 'irrelevant' | 'poor_quality' | 'uncertain' | 'unavailable';
  workflow: 'plant_identification' | 'garden_doctor' | 'space_scanning' | 'chatbot';
  detectedSubject?: string;
  reason?: string;
  suggestedAction?: string;
  providerId: string;
  modelName?: string;
}
