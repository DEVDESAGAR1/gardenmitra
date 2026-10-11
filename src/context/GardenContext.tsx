import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from './ToastContext';
import {
  Garden,
  GardenSpace,
  GardenProfile,
  GardenPhoto,
  GardenPlant,
  Plant,
  PlantRecommendation,
  ShoppingItem,
  GardenTask,
  ChatMessage,
  SpaceType,
  SpaceSize,
  SpaceDimensions,
  SunlightAmount,
  GardeningGoal,
  EnvironmentalContext,
  EnvironmentalAdvice,
  CareEvent,
  CareReminder,
  TaskStatus,
  ModelAvailabilityStatus,
  StoredAIObservation,
  SunlightZone,
  SunlightEstimate,
  SpaceZone,
  GardenContainer,
  PlantPlacement,
  LayoutIssue,
  LayoutRecommendation,
  SpaceLayout,
  GardenLocation,
  LocationPermissionStatus,
  GardenMediaType,
  CaptureSource,
  GardenMediaAsset,
  GardenCaptureSession,
  ExtractedVideoFrame,
  MultiMediaAnalysisResult,
  SpaceCaptureCoverage,
  SpaceMeasurement,
  UsableSpaceCalculation,
  UserConfirmableObservation,
  DigitalTwinProposalMode,
  DigitalTwinProposal,
  GardenDigitalTwin,
  PlantLifecycleStage,
  PlantJournalEntry,
  GardenInsight,
  EnvironmentalObservation,
  SensorDevice,
  EnvironmentalSummary,
  PlantEnvironmentalInsight,
  CareRecommendation,
  AdaptiveCareTask,
  StructuredSymptomReport,
  ContextualDiagnosisReport,
  DiagnosisRecord,
  PlantPhotoAnalysisResult
} from '../types';
import { PLANT_CATALOG } from '../data/plants';
import { plantKnowledgeProvider } from '../services/localPlantKnowledgeProvider';
import { shoppingProvider } from '../services/localShoppingProvider';
import { taskGenerator } from '../services/localTaskGenerator';
import { gardenAssistantProvider } from '../services/localAssistantProvider';
import { mockWeatherProvider } from '../services/localMockWeatherProvider';
import { openMeteoWeatherProvider } from '../services/openMeteoWeatherProvider';
import { browserLocationProvider } from '../services/browserLocationProvider';
import { environmentalRuleEngine } from '../services/environmentalRuleEngine';
import { careEngine } from '../services/careEngine';
import { notificationService, NotificationPermissionStatus } from '../services/notificationService';
import { localOllamaVisionProvider } from '../services/localOllamaVisionProvider';
import { sunlightEstimationEngine } from '../services/sunlightEstimationEngine';
import { layoutValidationEngine, layoutRecommendationEngine } from '../services/layoutOptimizationEngine';
import { localMediaStorage } from '../services/localMediaStorage';
import { videoFrameExtractor, VideoExtractionOptions } from '../services/videoFrameExtractor';
import { captureCoverageEngine } from '../services/captureCoverageEngine';
import { usableSpaceEngine } from '../services/usableSpaceEngine';
import { digitalTwinRecommendationEngine } from '../services/digitalTwinRecommendationEngine';
import { aiVisualizerService, VisualConceptOutput } from '../services/aiVisualizerService';
import { normalizeGardenSpace } from '../services/gardenSpaceNormalizer';
import { gardenMemoryEngine } from '../services/gardenMemoryEngine';
import { environmentalService } from '../services/environmentalService';
import { adaptiveCareEngine } from '../services/adaptiveCareEngine';
import { plantHealthDiagnosticEngine } from '../services/plantHealthDiagnosticEngine';

export type NavigationTab = 
  | 'home' 
  | 'setup'
  | 'my_garden' 
  | 'plants' 
  | 'shopping' 
  | 'chat' 
  | 'doctor' 
  | 'today'
  | 'layout'
  | 'twin'
  | 'journal'
  | 'environment'
  | 'planner'
  | 'performance';

export const VALID_NAV_TABS: Record<string, NavigationTab> = {
  home: 'home',
  setup: 'setup',
  my_garden: 'my_garden',
  plants: 'plants',
  shopping: 'shopping',
  chat: 'chat',
  doctor: 'doctor',
  today: 'today',
  layout: 'layout',
  twin: 'twin',
  journal: 'journal',
  environment: 'environment',
  planner: 'planner',
  performance: 'performance'
};

export const getTabFromHash = (hashStr?: string): NavigationTab => {
  const raw = hashStr ?? (typeof window !== 'undefined' && window.location ? window.location.hash : '');
  const clean = raw.trim().replace(/^#\/?/, '').trim().toLowerCase();
  return VALID_NAV_TABS[clean] || 'home';
};

interface GardenContextType {
  // Milestone 1 Multi-Space Models
  garden: Garden | null;
  spaces: GardenSpace[];
  selectedSpaceId: string | null;
  selectedSpace: GardenSpace | null;
  
  // Backward-compatible single-space aliases (mirrors selectedSpace)
  profile: GardenProfile | null;
  photo: GardenPhoto | null;
  selectedGardenPlants: GardenPlant[];
  recommendations: PlantRecommendation[];
  shoppingList: ShoppingItem[];
  allShoppingList: ShoppingItem[];
  tasks: GardenTask[];
  allTasks: GardenTask[];
  
  // Milestone 2 & 7 Environmental Models
  environmentalContext: EnvironmentalContext | null;
  environmentalAdvice: EnvironmentalAdvice | null;
  gardenLocation: GardenLocation | null;
  locationPermissionStatus: LocationPermissionStatus;
  weatherMode: 'live' | 'mock';
  setWeatherMode: (mode: 'live' | 'mock') => void;
  requestCurrentLocation: () => Promise<{ success: boolean; message: string }>;
  setManualLocation: (city: string, state?: string, country?: string) => Promise<void>;
  clearLocation: () => void;
  refreshWeather: (force?: boolean) => Promise<void>;

  // Milestone 8 Garden Capture Intelligence
  activeCaptureSession: GardenCaptureSession | null;
  setActiveCaptureSessionId: (sessionId: string | null) => void;
  createCaptureSession: (spaceId: string, notes?: string) => GardenCaptureSession;
  saveMediaAsset: (params: {
    spaceId: string;
    sessionId?: string;
    fileOrBlob: Blob;
    type: GardenMediaType;
    source: CaptureSource;
    capturedAt?: string;
    direction?: string;
    parentMediaId?: string;
    frameTimestampSeconds?: number;
  }) => Promise<GardenMediaAsset>;
  deleteMediaAsset: (spaceId: string, assetId: string) => Promise<void>;
  extractVideoFrames: (
    spaceId: string,
    videoAssetId: string,
    options?: VideoExtractionOptions
  ) => Promise<ExtractedVideoFrame[]>;
  analyzeSpaceMedia: (
    spaceId: string,
    mediaAssetIds?: string[]
  ) => Promise<MultiMediaAnalysisResult>;

  // Milestone 3 Smart Garden Care Models & Actions
  waterPlant: (plantId: string, note?: string) => { success: boolean; message: string };
  checkSoil: (plantId: string, condition: 'dry' | 'moist', note?: string) => CareEvent | null;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;
  careReminders: CareReminder[];
  enableNotifications: () => Promise<NotificationPermissionStatus>;
  notificationStatus: NotificationPermissionStatus;

  // Milestone 4 Vision AI Models & Actions
  modelAvailability: { status: ModelAvailabilityStatus; message: string; modelsAvailable?: string[] };
  checkModelAvailability: () => Promise<void>;
  ollamaConfig: { baseUrl: string; model: string };
  setOllamaConfig: (baseUrl: string, model: string) => void;
  storedAIObservations: StoredAIObservation[];
  saveAIObservation: (obs: StoredAIObservation) => void;

  // Milestone 5: Sunlight Intelligence
  recordSunlightObservation: (
    spaceId: string,
    observation: {
      timeOfDay: 'morning' | 'afternoon' | 'evening';
      condition: 'mostly_sunny' | 'partially_shaded' | 'mostly_shaded';
      notes?: string;
    }
  ) => void;
  addSunlightZone: (
    spaceId: string,
    zone: { name: string; type: 'sunny' | 'partial_shade' | 'shade'; description?: string }
  ) => SunlightZone;
  selectedSpaceSunlightEstimate: SunlightEstimate | null;

  // Milestone 6: Space & Layout Optimization
  updateSpaceLayout: (spaceId: string, layoutUpdates: Partial<SpaceLayout>) => void;
  addContainer: (spaceId: string, container: Omit<GardenContainer, 'id' | 'spaceId'>) => GardenContainer;
  removeContainer: (spaceId: string, containerId: string) => void;
  placePlant: (spaceId: string, placement: Omit<PlantPlacement, 'id' | 'spaceId'>) => PlantPlacement;
  removePlantPlacement: (spaceId: string, placementId: string) => void;
  addSpaceZone: (spaceId: string, zone: Omit<SpaceZone, 'id' | 'spaceId'>) => SpaceZone;
  removeSpaceZone: (spaceId: string, zoneId: string) => void;
  autoOptimizeLayout: (spaceId: string) => void;
  layoutIssues: LayoutIssue[];
  layoutRecommendations: LayoutRecommendation[];

  // Milestone 9: Adaptive Space Scanning & Measurements
  spaceCoverage: SpaceCaptureCoverage | null;
  spaceMeasurements: SpaceMeasurement[];
  usableSpace: UsableSpaceCalculation | null;
  userObservations: UserConfirmableObservation[];
  evaluateSpaceCoverage: (spaceId: string) => SpaceCaptureCoverage;
  addSpaceMeasurement: (
    spaceId: string,
    measurement: Omit<SpaceMeasurement, 'id' | 'spaceId' | 'createdAt'>
  ) => SpaceMeasurement;
  removeSpaceMeasurement: (spaceId: string, measurementId: string) => void;
  confirmUserObservation: (
    spaceId: string,
    observation: Omit<UserConfirmableObservation, 'id' | 'spaceId' | 'confirmedAt' | 'source'>
  ) => UserConfirmableObservation;

  // Milestone 10: Garden Digital Twin & AI Visualizer
  digitalTwin: GardenDigitalTwin | null;
  generateDigitalTwinProposal: (
    spaceId: string,
    mode: DigitalTwinProposalMode
  ) => DigitalTwinProposal;
  acceptDigitalTwinProposal: (spaceId: string, proposalId: string) => void;
  discardDigitalTwinProposal: (spaceId: string, proposalId: string) => void;
  getVisualConceptOutput: (
    spaceId: string,
    proposal: DigitalTwinProposal
  ) => VisualConceptOutput;

  // Global UI State
  chatMessages: ChatMessage[];
  activeTab: NavigationTab;
  isInitialLoading: boolean;
  showTouchGrassModal: boolean;
  selectedPlantForDetail: Plant | null;
  
  // Space Modal State
  isSpaceModalOpen: boolean;
  spaceModalMode: 'create' | 'edit';
  editingSpace: GardenSpace | null;

  // Actions
  setActiveTab: (tab: NavigationTab) => void;
  selectSpace: (spaceId: string) => void;
  addSpace: (data: {
    name: string;
    type: SpaceType;
    size: SpaceSize;
    dimensions?: SpaceDimensions;
    sunlight: SunlightAmount;
    goal: GardeningGoal;
    photoDataUrl?: string;
    fileName?: string;
  }) => GardenSpace;
  editSpace: (
    spaceId: string,
    updates: Partial<Omit<GardenSpace, 'id' | 'createdAt'>>
  ) => void;
  deleteSpace: (spaceId: string) => boolean;
  openCreateSpaceModal: () => void;
  openEditSpaceModal: (space: GardenSpace) => void;
  closeSpaceModal: () => void;
  
  // Plant & Photo Actions
  saveProfile: (profile: GardenProfile) => void;
  savePhoto: (dataUrl: string, fileName: string, photoTimestamp?: string) => void;
  removePhoto: () => void;
  addPlantToGarden: (plant: Plant) => void;
  removePlantFromGarden: (plantId: string) => void;
  isPlantInGarden: (plantId: string) => boolean;
  
  // Checklist & Chat Actions
  toggleTask: (taskId: string) => void;
  toggleShoppingItem: (itemId: string) => void;
  sendChatMessage: (content: string) => Promise<void>;
  setShowTouchGrassModal: (show: boolean) => void;
  setSelectedPlantForDetail: (plant: Plant | null) => void;
  resetAll: () => void;

  // Milestone 12: Garden Memory & Growth Tracking
  gardenInsights: GardenInsight[];
  addJournalEntry: (entry: {
    plantInstanceId: string;
    plantId: string;
    spaceId: string;
    type: import('../types').PlantJournalEntryType;
    occurredAt?: string;
    note?: string;
    mediaIds?: string[];
    source?: 'user' | 'care_engine' | 'vision_ai' | 'system';
    confidence?: number;
    stage?: PlantLifecycleStage;
    heightCm?: number;
    environmentalSnapshot?: {
      temperatureC?: number;
      weatherCondition?: string;
      isRainy?: boolean;
    };
  }) => PlantJournalEntry;
  updatePlantLifecycleStage: (
    instanceId: string,
    newStage: PlantLifecycleStage,
    note?: string
  ) => void;
  addPlantHeightMeasurement: (
    instanceId: string,
    heightCm: number,
    note?: string
  ) => void;
  getAllGardenJournalEntries: () => PlantJournalEntry[];

  // Milestone 13: Physical Garden Intelligence & Sensor Integration
  environmentalObservations: EnvironmentalObservation[];
  sensorDevices: SensorDevice[];
  environmentalSummaries: EnvironmentalSummary[];
  plantEnvironmentalInsights: PlantEnvironmentalInsight[];
  addObservation: (candidate: Partial<EnvironmentalObservation>) => { success: boolean; observation?: EnvironmentalObservation; errors?: string[] };
  registerSensorDevice: (device: Partial<SensorDevice>) => { success: boolean; device?: SensorDevice; error?: string };
  getSpaceObservations: (spaceId: string) => EnvironmentalObservation[];

  // Milestone 14: Adaptive Garden Care Planner & Action Engine
  careRecommendations: CareRecommendation[];
  adaptiveCareTasks: AdaptiveCareTask[];
  completeAdaptiveCareTask: (taskId: string, notes?: string) => void;
  snoozeAdaptiveCareTask: (taskId: string, hours?: number) => void;
  dismissAdaptiveCareTask: (taskId: string, reason?: string) => void;
  refreshCarePlanner: () => void;

  // Milestone 15: Advanced Plant Health Intelligence
  diagnosisHistory: DiagnosisRecord[];
  diagnosePlantHealth: (params: {
    plantInstanceId?: string;
    plantId?: string;
    symptoms: StructuredSymptomReport;
    visionResult?: PlantPhotoAnalysisResult | null;
  }) => ContextualDiagnosisReport;
  saveDiagnosisRecord: (report: ContextualDiagnosisReport) => DiagnosisRecord;
  convertDiagnosisToCareTask: (
    diagnosisRecordId: string,
    causeId?: string
  ) => { success: boolean; task?: AdaptiveCareTask; message: string };
  recordDiagnosisFollowUp: (
    recordId: string,
    status: 'resolved' | 'improved' | 'no_change' | 'declined',
    notes?: string
  ) => void;
}

const STORAGE_KEY = 'gardenmitra_state_v1';

const GardenContext = createContext<GardenContextType | undefined>(undefined);

export { normalizeGardenSpace } from '../services/gardenSpaceNormalizer';

export const GardenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => getTabFromHash());

  const setActiveTab = useCallback((tab: NavigationTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined' && window.location) {
      const currentHash = (window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
      if (currentHash !== tab) {
        window.location.hash = `#${tab}`;
      }
    }
  }, []);

  // Browser Back/Forward and direct URL synchronization (FIND-UX-01)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const targetTab = getTabFromHash();
      setActiveTabState(targetTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showTouchGrassModal, setShowTouchGrassModal] = useState(false);
  const [selectedPlantForDetail, setSelectedPlantForDetail] = useState<Plant | null>(null);

  // Space Modal
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [spaceModalMode, setSpaceModalMode] = useState<'create' | 'edit'>('create');
  const [editingSpace, setEditingSpace] = useState<GardenSpace | null>(null);

  // Environmental Context (Milestone 2)
  const [environmentalContext, setEnvironmentalContext] = useState<EnvironmentalContext | null>(null);
  const [environmentalAdvice, setEnvironmentalAdvice] = useState<EnvironmentalAdvice | null>(null);

  // Checked state & task status caches across render cycles
  const [checkedTaskIds, setCheckedTaskIds] = useState<Record<string, boolean>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [checkedShoppingIds, setCheckedShoppingIds] = useState<Record<string, boolean>>({});

  // Milestone 3: Notifications
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermissionStatus>(
    notificationService.getPermissionStatus()
  );

  // Milestone 4: Local Vision AI State
  const [ollamaConfig, setOllamaConfigState] = useState(localOllamaVisionProvider.getConfig());
  const [modelAvailability, setModelAvailability] = useState<{
    status: ModelAvailabilityStatus;
    message: string;
    modelsAvailable?: string[];
  }>({
    status: 'checking',
    message: 'Checking local AI availability...'
  });
  const [storedAIObservations, setStoredAIObservations] = useState<StoredAIObservation[]>([]);

  // Milestone 7: Real Location & Weather Mode
  const [weatherMode, setWeatherMode] = useState<'live' | 'mock'>('live');
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<LocationPermissionStatus>('prompt');

  // Milestone 8: Active Capture Session
  const [activeCaptureSessionId, setActiveCaptureSessionId] = useState<string | null>(null);

  // Milestone 13 & 14: Physical Garden Intelligence & Adaptive Care State
  const [environmentalObservations, setEnvironmentalObservations] = useState<EnvironmentalObservation[]>([]);
  const [sensorDevices, setSensorDevices] = useState<SensorDevice[]>([]);
  const [adaptiveCareTasks, setAdaptiveCareTasks] = useState<AdaptiveCareTask[]>([]);

  // Milestone 15: Plant Health Intelligence State
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisRecord[]>([]);

  // Check initial location permission on mount
  useEffect(() => {
    browserLocationProvider.getPermissionStatus().then((status) => {
      setLocationPermissionStatus(status);
    });
  }, []);

  // 1. Safe, Idempotent Data Migration & Load on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed.garden && Array.isArray(parsed.garden.spaces)) {
          // Normalize spaces so plants have careHistory arrays and M5/M6 models
          const normalizedGarden: Garden = {
            ...parsed.garden,
            spaces: parsed.garden.spaces.map(normalizeGardenSpace)
          };

          setGarden(normalizedGarden);
          const firstSpaceId = parsed.selectedSpaceId || normalizedGarden.spaces[0]?.id || null;
          setSelectedSpaceId(firstSpaceId);
          if (parsed.checkedTaskIds) setCheckedTaskIds(parsed.checkedTaskIds);
          if (parsed.taskStatuses) setTaskStatuses(parsed.taskStatuses);
          if (parsed.checkedShoppingIds) setCheckedShoppingIds(parsed.checkedShoppingIds);
          if (parsed.storedAIObservations && Array.isArray(parsed.storedAIObservations)) {
            setStoredAIObservations(parsed.storedAIObservations);
          }
          if (parsed.chatMessages && parsed.chatMessages.length > 0) {
            setChatMessages(parsed.chatMessages);
          }
          if (parsed.environmentalObservations && Array.isArray(parsed.environmentalObservations)) {
            setEnvironmentalObservations(parsed.environmentalObservations);
          }
          if (parsed.sensorDevices && Array.isArray(parsed.sensorDevices)) {
            setSensorDevices(parsed.sensorDevices);
          }
          if (parsed.adaptiveCareTasks && Array.isArray(parsed.adaptiveCareTasks)) {
            setAdaptiveCareTasks(parsed.adaptiveCareTasks);
          }
          if (parsed.diagnosisHistory && Array.isArray(parsed.diagnosisHistory)) {
            setDiagnosisHistory(parsed.diagnosisHistory);
          }
        } else if (parsed.profile) {
          // OLD FORMAT DETECTED: Migrate losslessly into Garden with 1 Space
          const spaceId = 'space-default-' + (parsed.profile.id || '1');
          const defaultSpaceName = parsed.profile.spaceType
            ? parsed.profile.spaceType.charAt(0).toUpperCase() + parsed.profile.spaceType.slice(1)
            : 'My Space';

          const migratedSpace: GardenSpace = normalizeGardenSpace({
            id: spaceId,
            name: defaultSpaceName,
            type: parsed.profile.spaceType || 'balcony',
            size: parsed.profile.spaceSize || 'small',
            dimensions: parsed.profile.dimensions,
            sunlight: parsed.profile.sunlight || '2_to_4h',
            goal: parsed.profile.goal || 'kitchen_garden',
            photos: parsed.photo ? [parsed.photo] : [],
            plants: (parsed.selectedGardenPlants || []).map((gp: GardenPlant) => ({
              ...gp,
              spaceId,
              careHistory: [],
              wateringCount: 0
            })),
            tasks: (parsed.tasks || []).map((t: GardenTask) => ({
              ...t,
              spaceId,
              spaceName: defaultSpaceName
            })),
            createdAt: parsed.profile.createdAt || new Date().toISOString(),
            updatedAt: parsed.profile.updatedAt || new Date().toISOString()
          });

          const migratedGarden: Garden = {
            id: 'garden-' + (parsed.profile.id || Date.now()),
            name: `${parsed.profile.location?.city || 'My'} Garden`,
            location: parsed.profile.location || { city: '', state: '', country: 'India' },
            experience: parsed.profile.experience || 'complete_beginner',
            spaces: [migratedSpace],
            createdAt: parsed.profile.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          setGarden(migratedGarden);
          setSelectedSpaceId(spaceId);

          // Preserve checked state from old shopping and task lists
          const oldTaskMap: Record<string, boolean> = {};
          if (Array.isArray(parsed.tasks)) {
            parsed.tasks.forEach((t: GardenTask) => {
              if (t.completed) oldTaskMap[t.id] = true;
            });
          }
          setCheckedTaskIds(oldTaskMap);

          const oldShopMap: Record<string, boolean> = {};
          if (Array.isArray(parsed.shoppingList)) {
            parsed.shoppingList.forEach((s: ShoppingItem) => {
              if (s.checked) oldShopMap[s.id] = true;
            });
          }
          setCheckedShoppingIds(oldShopMap);

          if (parsed.chatMessages && parsed.chatMessages.length > 0) {
            setChatMessages(parsed.chatMessages);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load/migrate garden state from localStorage:', e);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // 2. Save to localStorage when state changes (Schema Version 6)
  useEffect(() => {
    if (isInitialLoading) return;
    try {
      const stateToSave = {
        garden,
        selectedSpaceId,
        checkedTaskIds,
        taskStatuses,
        checkedShoppingIds,
        chatMessages,
        storedAIObservations,
        environmentalObservations,
        sensorDevices,
        adaptiveCareTasks,
        diagnosisHistory,
        version: 6
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save garden state to localStorage:', e);
    }
  }, [
    garden,
    selectedSpaceId,
    checkedTaskIds,
    taskStatuses,
    checkedShoppingIds,
    chatMessages,
    environmentalObservations,
    sensorDevices,
    adaptiveCareTasks,
    diagnosisHistory
  ]);

  // Active space calculation
  const spaces = useMemo(() => garden?.spaces || [], [garden]);

  const selectedSpace = useMemo(() => {
    if (!spaces.length) return null;
    return spaces.find((s) => s.id === selectedSpaceId) || spaces[0];
  }, [spaces, selectedSpaceId]);

  // Backward-compatible GardenProfile reflecting selectedSpace
  const profile: GardenProfile | null = useMemo(() => {
    if (!garden || !selectedSpace) return null;
    return {
      id: garden.id,
      spaceId: selectedSpace.id,
      spaceName: selectedSpace.name,
      location: garden.location,
      spaceType: selectedSpace.type,
      spaceSize: selectedSpace.size,
      dimensions: selectedSpace.dimensions,
      sunlight: selectedSpace.sunlight,
      experience: garden.experience,
      goal: selectedSpace.goal,
      createdAt: selectedSpace.createdAt,
      updatedAt: selectedSpace.updatedAt
    };
  }, [garden, selectedSpace]);

  const photo = useMemo(() => {
    return selectedSpace?.photos[0] || null;
  }, [selectedSpace]);

  const selectedGardenPlants = useMemo(() => {
    return selectedSpace?.plants || [];
  }, [selectedSpace]);

  // Milestone 7: Garden Location derived helper
  const gardenLocation: GardenLocation | null = useMemo(() => {
    if (!garden?.location) return null;
    if (typeof garden.location.latitude === 'number' && typeof garden.location.longitude === 'number') {
      return {
        latitude: garden.location.latitude,
        longitude: garden.location.longitude,
        accuracyMeters: garden.location.accuracyMeters,
        capturedAt: garden.location.capturedAt || new Date().toISOString(),
        source: garden.location.source || 'manual',
        displayName: garden.location.displayName || garden.location.city,
        city: garden.location.city,
        state: garden.location.state,
        country: garden.location.country
      };
    }
    return null;
  }, [garden?.location]);

  // Milestone 2 & 7: Environmental Context & Weather Fetch
  const refreshWeather = useCallback(async (force = false) => {
    const loc = garden?.location;
    if (!loc || (!loc.city && typeof loc.latitude !== 'number')) {
      setEnvironmentalContext(null);
      setEnvironmentalAdvice(null);
      return;
    }

    if (weatherMode === 'mock') {
      const forecast = await mockWeatherProvider.getForecast(loc);
      const envCtx: EnvironmentalContext = {
        location: loc,
        snapshot: forecast.current,
        forecast,
        source: 'demo_mock',
        confidence: 'simulated_educational',
        timestamp: new Date().toISOString()
      };
      setEnvironmentalContext(envCtx);
      setEnvironmentalAdvice(environmentalRuleEngine.evaluateWeather(forecast.current));
      return;
    }

    // Live mode (Open-Meteo)
    const envCtx = await openMeteoWeatherProvider.getEnvironmentalContext(loc, force);
    setEnvironmentalContext(envCtx);
    const advice = environmentalRuleEngine.evaluateWeather(envCtx.snapshot);
    setEnvironmentalAdvice(advice);
  }, [garden?.location, weatherMode]);

  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  const requestCurrentLocation = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const loc = await browserLocationProvider.requestCurrentLocation(9000);
      setLocationPermissionStatus('granted');

      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          location: {
            ...prev.location,
            city: loc.city || prev.location.city || 'Detected Location',
            state: loc.state || prev.location.state || '',
            country: loc.country || prev.location.country || '',
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracyMeters: loc.accuracyMeters,
            source: 'browser_geolocation',
            capturedAt: loc.capturedAt,
            displayName: loc.displayName || `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`
          },
          updatedAt: new Date().toISOString()
        };
      });

      return {
        success: true,
        message: `Location detected: ${loc.displayName || `${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°`}`
      };
    } catch (err: any) {
      const status = await browserLocationProvider.getPermissionStatus();
      setLocationPermissionStatus(status);
      return {
        success: false,
        message: err.message || 'Could not retrieve browser geolocation.'
      };
    }
  }, []);

  const setManualLocation = useCallback(async (city: string, state?: string, country?: string) => {
    const loc = browserLocationProvider.resolveManualLocation(city, state, country);
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        location: {
          city: loc.city || city,
          state: loc.state || state || '',
          country: loc.country || country || 'India',
          latitude: loc.latitude,
          longitude: loc.longitude,
          source: 'manual',
          capturedAt: loc.capturedAt,
          displayName: loc.displayName || city
        },
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const clearLocation = useCallback(() => {
    openMeteoWeatherProvider.clearCache();
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        location: {
          city: 'Your City',
          state: '',
          country: 'India'
        },
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  // Space-Aware Recommendations
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>([]);

  useEffect(() => {
    if (!profile) {
      const dummyProfile: GardenProfile = {
        id: 'default',
        location: { city: 'Your City', state: '', country: 'India' },
        spaceType: 'balcony',
        spaceSize: 'small',
        sunlight: '2_to_4h',
        experience: 'complete_beginner',
        goal: 'kitchen_garden',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      plantKnowledgeProvider.getRecommendations(dummyProfile, environmentalContext).then(setRecommendations);
      return;
    }

    plantKnowledgeProvider.getRecommendations(profile, environmentalContext).then(setRecommendations);
  }, [profile, environmentalContext]);

  // Space-Aware Tasks (all and per-space)
  const [allTasks, setAllTasks] = useState<GardenTask[]>([]);

  useEffect(() => {
    if (!garden || !garden.spaces.length) {
      // Fallback tasks when no space
      const fallback = taskGenerator.generateDailyTasks([], null, undefined, undefined, environmentalContext);
      setAllTasks(fallback);
      return;
    }

    const aggregated: GardenTask[] = [];

    garden.spaces.forEach((space) => {
      const spaceProfile: GardenProfile = {
        id: garden.id,
        spaceId: space.id,
        spaceName: space.name,
        location: garden.location,
        spaceType: space.type,
        spaceSize: space.size,
        dimensions: space.dimensions,
        sunlight: space.sunlight,
        experience: garden.experience,
        goal: space.goal,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt
      };
      const rawPlants = space.plants.map((gp) => gp.plant);
      const generated = taskGenerator.generateDailyTasks(
        rawPlants,
        spaceProfile,
        space.id,
        space.name,
        environmentalContext
      );

      generated.forEach((task) => {
        const isDone = taskStatuses[task.id] === 'completed' || !!checkedTaskIds[task.id];
        const status: TaskStatus = taskStatuses[task.id] || (isDone ? 'completed' : 'pending');
        aggregated.push({
          ...task,
          completed: isDone,
          status
        });
      });

      // Milestone 3: Merge smart care tasks for plants in this space
      const careTasks = careEngine.generateCareTasks(space, environmentalContext);
      careTasks.forEach((careTask) => {
        if (!aggregated.some((t) => t.id === careTask.id)) {
          const isDone = taskStatuses[careTask.id] === 'completed' || !!checkedTaskIds[careTask.id];
          const status: TaskStatus = taskStatuses[careTask.id] || (isDone ? 'completed' : 'pending');
          aggregated.push({
            ...careTask,
            completed: isDone,
            status
          });
        }
      });
    });

    // Milestone 7 & 2: Merge additive weather tasks for exposed outdoor spaces
    if (garden && garden.spaces.length && environmentalContext) {
      const weatherTasks = environmentalRuleEngine.generateAdditiveWeatherTasks(
        garden.spaces,
        environmentalContext
      );
      weatherTasks.forEach((wTask) => {
        if (!aggregated.some((t) => t.id === wTask.id)) {
          const isDone = taskStatuses[wTask.id] === 'completed' || !!checkedTaskIds[wTask.id];
          const status: TaskStatus = taskStatuses[wTask.id] || (isDone ? 'completed' : 'pending');
          aggregated.push({
            ...wTask,
            completed: isDone,
            status
          });
        }
      });
    }

    setAllTasks(aggregated);
  }, [garden, environmentalContext, checkedTaskIds, taskStatuses]);

  const tasks = useMemo(() => {
    if (!selectedSpace) return allTasks;
    return allTasks.filter((t) => !t.spaceId || t.spaceId === selectedSpace.id);
  }, [allTasks, selectedSpace]);

  // Space-Aware Shopping (all and per-space)
  const [allShoppingList, setAllShoppingList] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    if (!garden || !garden.spaces.length) {
      setAllShoppingList([]);
      return;
    }

    const promises = garden.spaces.map(async (space) => {
      const spaceProfile: GardenProfile = {
        id: garden.id,
        spaceId: space.id,
        spaceName: space.name,
        location: garden.location,
        spaceType: space.type,
        spaceSize: space.size,
        dimensions: space.dimensions,
        sunlight: space.sunlight,
        experience: garden.experience,
        goal: space.goal,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt
      };
      const rawPlants = space.plants.map((gp) => gp.plant);
      const items = await shoppingProvider.generateShoppingList(
        rawPlants,
        spaceProfile,
        space.id,
        space.name
      );
      return items.map((item) => ({
        ...item,
        checked: !!checkedShoppingIds[item.id]
      }));
    });

    Promise.all(promises).then((results) => {
      setAllShoppingList(results.flat());
    });
  }, [garden, checkedShoppingIds]);

  const shoppingList = useMemo(() => {
    if (!selectedSpace) return allShoppingList;
    return allShoppingList.filter((i) => !i.spaceId || i.spaceId === selectedSpace.id);
  }, [allShoppingList, selectedSpace]);

  // Default welcome message in chat
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          content: 'Namaste & Welcome! 🌱 I am your GardenMitra assistant. I know your garden space, sunlight, and beginner goals. Ask me anything below or tap one of the suggested prompts!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: [
            'What should I grow here?',
            'What should I do today?',
            'What do I need to buy for this space?',
            'How often should I water this?'
          ],
          isRuleBased: true
        }
      ]);
    }
  }, [chatMessages.length]);

  // Space Management Actions
  const selectSpace = useCallback((spaceId: string) => {
    setSelectedSpaceId(spaceId);
  }, []);

  const addSpace = useCallback((data: {
    name: string;
    type: SpaceType;
    size: SpaceSize;
    dimensions?: SpaceDimensions;
    sunlight: SunlightAmount;
    goal: GardeningGoal;
    photoDataUrl?: string;
    fileName?: string;
  }): GardenSpace => {
    const spaceId = 'space-' + Date.now();
    const newSpace: GardenSpace = normalizeGardenSpace({
      id: spaceId,
      name: data.name.trim() || 'My Space',
      type: data.type,
      size: data.size,
      dimensions: data.dimensions,
      sunlight: data.sunlight,
      goal: data.goal,
      photos: data.photoDataUrl ? [{
        id: 'photo-' + Date.now(),
        dataUrl: data.photoDataUrl,
        fileName: data.fileName || 'space.jpg',
        uploadedAt: new Date().toISOString()
      }] : [],
      plants: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setGarden((prev) => {
      if (!prev) {
        return {
          id: 'garden-' + Date.now(),
          name: 'My Garden',
          location: { city: '', state: '', country: 'India' },
          experience: 'complete_beginner',
          spaces: [newSpace],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return {
        ...prev,
        spaces: [...prev.spaces, newSpace],
        updatedAt: new Date().toISOString()
      };
    });

    setSelectedSpaceId(spaceId);
    return newSpace;
  }, []);

  const editSpace = useCallback((
    spaceId: string,
    updates: Partial<Omit<GardenSpace, 'id' | 'createdAt'>>
  ) => {
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        spaces: prev.spaces.map((s) => (s.id === spaceId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const deleteSpace = useCallback((spaceId: string): boolean => {
    if (!garden) return false;
    if (garden.spaces.length <= 1) {
      toast.warning('Your garden must have at least one space. You can edit this space instead of deleting it.');
      return false;
    }

    const spaceToDelete = garden.spaces.find((s) => s.id === spaceId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${spaceToDelete?.name || 'this space'}"? All plants in this space will be removed.`
    );
    if (!confirmed) return false;

    const remainingSpaces = garden.spaces.filter((s) => s.id !== spaceId);
    setGarden({
      ...garden,
      spaces: remainingSpaces,
      updatedAt: new Date().toISOString()
    });

    if (selectedSpaceId === spaceId) {
      setSelectedSpaceId(remainingSpaces[0]?.id || null);
    }
    return true;
  }, [garden, selectedSpaceId]);

  const openCreateSpaceModal = useCallback(() => {
    setSpaceModalMode('create');
    setEditingSpace(null);
    setIsSpaceModalOpen(true);
  }, []);

  const openEditSpaceModal = useCallback((space: GardenSpace) => {
    setSpaceModalMode('edit');
    setEditingSpace(space);
    setIsSpaceModalOpen(true);
  }, []);

  const closeSpaceModal = useCallback(() => {
    setIsSpaceModalOpen(false);
    setEditingSpace(null);
  }, []);

  // Backward-compatible saveProfile (creates or updates garden + space)
  const saveProfile = useCallback((newProfile: GardenProfile) => {
    setGarden((prev) => {
      if (!prev || prev.spaces.length === 0) {
        const spaceId = 'space-' + Date.now();
        const spaceName = newProfile.spaceType
          ? newProfile.spaceType.charAt(0).toUpperCase() + newProfile.spaceType.slice(1)
          : 'My Space';

        const initialSpace: GardenSpace = normalizeGardenSpace({
          id: spaceId,
          name: spaceName,
          type: newProfile.spaceType,
          size: newProfile.spaceSize,
          dimensions: newProfile.dimensions,
          sunlight: newProfile.sunlight,
          goal: newProfile.goal,
          photos: [],
          plants: [],
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        setSelectedSpaceId(spaceId);

        return {
          id: newProfile.id || 'garden-' + Date.now(),
          name: `${newProfile.location.city || 'My'} Garden`,
          location: newProfile.location,
          experience: newProfile.experience,
          spaces: [initialSpace],
          createdAt: newProfile.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Update location & experience on garden, and update active space
      return {
        ...prev,
        location: newProfile.location,
        experience: newProfile.experience,
        spaces: prev.spaces.map((s) => {
          if (s.id === selectedSpaceId || (!selectedSpaceId && s === prev.spaces[0])) {
            return {
              ...s,
              type: newProfile.spaceType,
              size: newProfile.spaceSize,
              dimensions: newProfile.dimensions,
              sunlight: newProfile.sunlight,
              goal: newProfile.goal,
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, [selectedSpaceId]);

  // Photo actions on active space
  const savePhoto = useCallback((dataUrl: string, fileName: string, photoTimestamp?: string) => {
    if (!selectedSpaceId) return;
    const newPhoto: GardenPhoto = {
      id: 'photo-' + Date.now(),
      dataUrl,
      fileName,
      uploadedAt: new Date().toISOString(),
      photoTimestamp
    };
    editSpace(selectedSpaceId, {
      photos: [newPhoto]
    });
  }, [selectedSpaceId, editSpace]);

  const removePhoto = useCallback(() => {
    if (!selectedSpaceId) return;
    editSpace(selectedSpaceId, {
      photos: []
    });
  }, [selectedSpaceId, editSpace]);

  // Milestone 8: Garden Capture Intelligence Callbacks
  const activeCaptureSession = useMemo<GardenCaptureSession | null>(() => {
    if (!selectedSpace) return null;
    const sessions = selectedSpace.captureSessions || [];
    if (activeCaptureSessionId) {
      return sessions.find((s) => s.id === activeCaptureSessionId) || sessions[0] || null;
    }
    return sessions[0] || null;
  }, [selectedSpace, activeCaptureSessionId]);

  const createCaptureSession = useCallback((spaceId: string, notes?: string): GardenCaptureSession => {
    const newSession: GardenCaptureSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      spaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      mediaIds: [],
      notes
    };

    const target = spaces.find((s) => s.id === spaceId);
    editSpace(spaceId, {
      captureSessions: [...(target?.captureSessions || []), newSession]
    });
    setActiveCaptureSessionId(newSession.id);
    return newSession;
  }, [editSpace, spaces]);

  const saveMediaAsset = useCallback(async (params: {
    spaceId: string;
    sessionId?: string;
    fileOrBlob: Blob;
    type: GardenMediaType;
    source: CaptureSource;
    capturedAt?: string;
    direction?: string;
    parentMediaId?: string;
    frameTimestampSeconds?: number;
  }): Promise<GardenMediaAsset> => {
    const targetSpace = spaces.find((s) => s.id === params.spaceId);
    if (!targetSpace) {
      throw new Error(`Target garden space ${params.spaceId} not found.`);
    }

    const assetId = `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Save binary blob to IndexedDB
    await localMediaStorage.saveMediaBlob(assetId, params.fileOrBlob);

    // Generate lightweight thumbnail
    let thumbnailUrl: string | undefined;
    if (params.type === 'photo' || params.type === 'video_frame') {
      try {
        thumbnailUrl = await localMediaStorage.createThumbnail(params.fileOrBlob, 320);
      } catch {
        thumbnailUrl = undefined;
      }
    }

    const sessionId = params.sessionId || targetSpace.captureSessions?.[0]?.id || `session-${Date.now()}`;

    const newAsset: GardenMediaAsset = {
      id: assetId,
      spaceId: params.spaceId,
      sessionId,
      type: params.type,
      source: params.source,
      createdAt: new Date().toISOString(),
      capturedAt: params.capturedAt || new Date().toISOString(),
      mimeType: params.fileOrBlob.type || (params.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      sizeBytes: params.fileOrBlob.size,
      thumbnailUrl,
      parentMediaId: params.parentMediaId,
      frameTimestampSeconds: params.frameTimestampSeconds,
      direction: params.direction,
      analysisStatus: 'pending'
    };

    const updatedMediaAssets = [...(targetSpace.mediaAssets || []), newAsset];
    const updatedSessions = (targetSpace.captureSessions && targetSpace.captureSessions.length > 0)
      ? targetSpace.captureSessions.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              mediaIds: [...s.mediaIds, assetId],
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        })
      : [
          {
            id: sessionId,
            spaceId: params.spaceId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft' as const,
            mediaIds: [assetId]
          }
        ];

    // Maintain backward compatibility with space.photos
    const updatedPhotos = [...(targetSpace.photos || [])];
    if (thumbnailUrl && (params.type === 'photo' || params.type === 'video_frame')) {
      updatedPhotos.push({
        id: assetId,
        dataUrl: thumbnailUrl,
        fileName: `${params.type}_${Date.now()}.jpg`,
        uploadedAt: newAsset.createdAt,
        photoTimestamp: newAsset.capturedAt
      });
    }

    editSpace(params.spaceId, {
      mediaAssets: updatedMediaAssets,
      captureSessions: updatedSessions,
      photos: updatedPhotos
    });

    return newAsset;
  }, [spaces, editSpace]);

  const deleteMediaAsset = useCallback(async (spaceId: string, assetId: string): Promise<void> => {
    const targetSpace = spaces.find((s) => s.id === spaceId);
    if (!targetSpace) return;

    await localMediaStorage.deleteMediaBlob(assetId);

    const updatedMediaAssets = (targetSpace.mediaAssets || []).filter((a) => a.id !== assetId);
    const updatedPhotos = (targetSpace.photos || []).filter((p) => p.id !== assetId);
    const updatedSessions = (targetSpace.captureSessions || []).map((s) => ({
      ...s,
      mediaIds: s.mediaIds.filter((id) => id !== assetId),
      updatedAt: new Date().toISOString()
    }));

    editSpace(spaceId, {
      mediaAssets: updatedMediaAssets,
      captureSessions: updatedSessions,
      photos: updatedPhotos
    });
  }, [spaces, editSpace]);

  const extractVideoFrames = useCallback(async (
    spaceId: string,
    videoAssetId: string,
    options?: VideoExtractionOptions
  ): Promise<ExtractedVideoFrame[]> => {
    const blob = await localMediaStorage.getMediaBlob(videoAssetId);
    if (!blob) {
      throw new Error(`Video file ${videoAssetId} not found in local media store.`);
    }

    const frames = await videoFrameExtractor.extractFrames(blob, options);
    for (const frame of frames) {
      await saveMediaAsset({
        spaceId,
        fileOrBlob: frame.blob,
        type: 'video_frame',
        source: 'video_recording',
        parentMediaId: videoAssetId,
        frameTimestampSeconds: frame.timestampSeconds
      });
    }

    return frames;
  }, [saveMediaAsset]);

  const saveAIObservation = useCallback((obs: StoredAIObservation) => {
    setStoredAIObservations((prev) => [obs, ...prev]);
  }, []);

  const analyzeSpaceMedia = useCallback(async (
    spaceId: string,
    mediaAssetIds?: string[]
  ): Promise<MultiMediaAnalysisResult> => {
    const targetSpace = spaces.find((s) => s.id === spaceId);
    if (!targetSpace) {
      throw new Error(`Space ${spaceId} not found.`);
    }

    const allAssets = targetSpace.mediaAssets || [];
    const relevantAssets = mediaAssetIds
      ? allAssets.filter((a) => mediaAssetIds.includes(a.id))
      : allAssets.filter((a) => a.type === 'photo' || a.type === 'video_frame');

    const itemsToAnalyze: { id: string; dataUrl: string; label?: string }[] = [];

    for (const asset of relevantAssets.slice(0, 5)) {
      if (asset.thumbnailUrl) {
        itemsToAnalyze.push({
          id: asset.id,
          dataUrl: asset.thumbnailUrl,
          label: asset.direction || asset.type
        });
      } else {
        const blob = await localMediaStorage.getMediaBlob(asset.id);
        if (blob) {
          const dataUrl = await localMediaStorage.blobToDataUrl(blob);
          itemsToAnalyze.push({
            id: asset.id,
            dataUrl,
            label: asset.direction || asset.type
          });
        }
      }
    }

    const analysis = await localOllamaVisionProvider.analyzeMultiMedia(itemsToAnalyze, targetSpace);

    if (analysis.status === 'success') {
      const obs: StoredAIObservation = {
        id: `obs-${Date.now()}`,
        photoId: itemsToAnalyze[0]?.id || `batch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        spaceId: targetSpace.id,
        model: analysis.modelName || 'gemma3',
        type: 'garden_space',
        observations: {
          multiMediaAnalysis: analysis
        },
        status: 'success'
      };
      saveAIObservation(obs);
    }

    return analysis;
  }, [spaces, saveAIObservation]);

  // Milestone 3: Care Reminders
  const careReminders = useMemo(() => {
    if (!selectedSpace) return [];
    return careEngine.generateReminders(selectedSpace, environmentalContext);
  }, [selectedSpace, environmentalContext]);

  const enableNotifications = useCallback(async () => {
    const res = await notificationService.requestPermission();
    setNotificationStatus(res);
    return res;
  }, []);

  // Milestone 4: Local Vision AI State & Check
  const checkModelAvailability = useCallback(async () => {
    setModelAvailability({ status: 'checking', message: 'Checking local AI availability...' });
    const res = await localOllamaVisionProvider.checkAvailability();
    setModelAvailability(res);
  }, []);

  const setOllamaConfig = useCallback((baseUrl: string, model: string) => {
    localOllamaVisionProvider.setConfig(baseUrl, model);
    setOllamaConfigState({ baseUrl, model });
    checkModelAvailability();
  }, [checkModelAvailability]);

  useEffect(() => {
    checkModelAvailability();
  }, [checkModelAvailability]);

  // Plant actions on active space
  const addPlantToGarden = useCallback((plant: Plant) => {
    if (!selectedSpaceId || !selectedSpace) return;
    if (selectedSpace.plants.some((gp) => gp.plantId === plant.id)) return;

    const now = new Date().toISOString();
    const instanceId = `${selectedSpaceId}-${plant.id}-${Date.now()}`;
    const initialJournalEntry = gardenMemoryEngine.createJournalEntry({
      plantInstanceId: instanceId,
      plantId: plant.id,
      spaceId: selectedSpaceId,
      type: 'planted',
      occurredAt: now,
      note: `Planted ${plant.name} in ${selectedSpace.name}`,
      source: 'user',
      stage: 'vegetative'
    });

    const newPlant: GardenPlant = {
      plantId: plant.id,
      plant,
      addedAt: now,
      plantedAt: now,
      status: 'planted',
      spaceId: selectedSpaceId,
      wateringCount: 0,
      careHistory: [],
      instanceId,
      lifecycleStage: 'vegetative',
      lifecycleHistory: [
        {
          id: `init-${instanceId}`,
          stage: 'vegetative',
          transitionedAt: now,
          note: 'Planted into space',
          source: 'user'
        }
      ],
      journalEntries: [initialJournalEntry],
      heightMeasurements: []
    };

    editSpace(selectedSpaceId, {
      plants: [...selectedSpace.plants, newPlant]
    });
  }, [selectedSpaceId, selectedSpace, editSpace]);

  const removePlantFromGarden = useCallback((plantId: string) => {
    if (!selectedSpaceId || !selectedSpace) return;
    const remainingPlants = selectedSpace.plants.filter((gp) => gp.plantId !== plantId);
    let updatedLayout = selectedSpace.layout;
    if (updatedLayout) {
      updatedLayout = {
        ...updatedLayout,
        plantPlacements: (updatedLayout.plantPlacements || []).filter((p) => p.plantId !== plantId),
        containers: (updatedLayout.containers || []).map((c) => ({
          ...c,
          plantIds: (c.plantIds || []).filter((id) => id !== plantId)
        })),
        updatedAt: new Date().toISOString()
      };
    }
    editSpace(selectedSpaceId, {
      plants: remainingPlants,
      layout: updatedLayout
    });
  }, [selectedSpaceId, selectedSpace, editSpace]);

  const isPlantInGarden = useCallback(
    (plantId: string) => {
      return !!selectedSpace?.plants.some((gp) => gp.plantId === plantId);
    },
    [selectedSpace]
  );

  // Milestone 3: Water Plant Action
  const waterPlant = useCallback(
    (plantId: string, note?: string): { success: boolean; message: string } => {
      if (!selectedSpaceId || !selectedSpace) {
        return { success: false, message: 'No active space selected.' };
      }

      const target = selectedSpace.plants.find((gp) => gp.plantId === plantId);
      if (!target) {
        return { success: false, message: 'Plant not found in active space.' };
      }

      const canWater = careEngine.canWaterNow(target);
      if (!canWater.allowed) {
        return { success: false, message: canWater.reason || 'Watering already logged recently.' };
      }

      const event = careEngine.createWateringEvent(plantId, selectedSpaceId, note);
      const wateringJournalEntry = gardenMemoryEngine.createJournalEntry({
        plantInstanceId: target.instanceId || `${selectedSpaceId}-${plantId}-0`,
        plantId,
        spaceId: selectedSpaceId,
        type: 'watered',
        occurredAt: event.timestamp,
        note: note || 'Watered plant based on soil check',
        source: 'user'
      });

      const updatedPlants = selectedSpace.plants.map((gp) => {
        if (gp.plantId === plantId) {
          return {
            ...gp,
            lastWateredAt: event.timestamp,
            wateringCount: (gp.wateringCount || 0) + 1,
            careHistory: [...(gp.careHistory || []), event],
            journalEntries: [wateringJournalEntry, ...(gp.journalEntries || [])]
          };
        }
        return gp;
      });

      editSpace(selectedSpaceId, { plants: updatedPlants });

      // Auto-complete corresponding watering task if present
      const relatedTaskId = `task-care-water-${selectedSpaceId}-${plantId}`;
      setCheckedTaskIds((prev) => ({ ...prev, [relatedTaskId]: true }));
      setTaskStatuses((prev) => ({ ...prev, [relatedTaskId]: 'completed' }));

      return {
        success: true,
        message: `Watered ${target.plant.name}! Roots will appreciate the drink.`
      };
    },
    [selectedSpaceId, selectedSpace, editSpace]
  );

  // Milestone 3: Soil Moisture Check Action
  const checkSoil = useCallback(
    (plantId: string, condition: 'dry' | 'moist', note?: string): CareEvent | null => {
      if (!selectedSpaceId || !selectedSpace) return null;
      const target = selectedSpace.plants.find((gp) => gp.plantId === plantId);
      if (!target) return null;

      const event = careEngine.createSoilCheckEvent(plantId, selectedSpaceId, condition, note);
      const updatedPlants = selectedSpace.plants.map((gp) => {
        if (gp.plantId === plantId) {
          return {
            ...gp,
            lastCheckedAt: event.timestamp,
            careHistory: [...(gp.careHistory || []), event]
          };
        }
        return gp;
      });

      editSpace(selectedSpaceId, { plants: updatedPlants });

      // Auto-complete corresponding soil check task
      const relatedTaskId = `task-care-soil-${selectedSpaceId}-${plantId}`;
      setCheckedTaskIds((prev) => ({ ...prev, [relatedTaskId]: true }));
      setTaskStatuses((prev) => ({ ...prev, [relatedTaskId]: 'completed' }));

      return event;
    },
    [selectedSpaceId, selectedSpace, editSpace]
  );

  // Milestone 3: Task Status (Pending / Completed / Skipped)
  const setTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTaskStatuses((prev) => ({ ...prev, [taskId]: status }));
    setCheckedTaskIds((prev) => ({ ...prev, [taskId]: status === 'completed' }));
  }, []);

  // Checkbox toggles
  const toggleTask = useCallback((taskId: string) => {
    setCheckedTaskIds((prev) => {
      const isNowCompleted = !prev[taskId];
      setTaskStatuses((stPrev) => ({
        ...stPrev,
        [taskId]: isNowCompleted ? 'completed' : 'pending'
      }));
      return {
        ...prev,
        [taskId]: isNowCompleted
      };
    });
  }, []);

  const toggleShoppingItem = useCallback((itemId: string) => {
    setCheckedShoppingIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  // Context-aware Assistant Chat
  const sendChatMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: 'usr-' + Date.now(),
        sender: 'user',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, userMsg]);

      const rawPlants = selectedSpace?.plants.map((gp) => gp.plant) || [];
      const assistantContext = {
        profile,
        selectedSpace,
        allSpaces: spaces,
        selectedPlants: rawPlants,
        gardenPlants: selectedSpace?.plants || [],
        careEvents: (selectedSpace?.plants || []).flatMap((gp) => gp.careHistory || []),
        photoUploaded: !!selectedSpace?.photos.length,
        tasksCount: tasks.length,
        completedTasksCount: tasks.filter((t) => t.completed).length,
        environmentalContext
      };

      const reply = await gardenAssistantProvider.respond(
        content,
        [...chatMessages, userMsg],
        assistantContext
      );

      setChatMessages((prev) => [...prev, reply]);
    },
    [chatMessages, profile, selectedSpace, spaces, tasks, environmentalContext]
  );

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGarden(null);
    setSelectedSpaceId(null);
    setCheckedTaskIds({});
    setTaskStatuses({});
    setCheckedShoppingIds({});
    setStoredAIObservations([]);
    setChatMessages([]);
    setActiveTab('home');
  }, []);

  // Milestone 5: Sunlight Estimate calculation for active space
  const selectedSpaceSunlightEstimate = useMemo<SunlightEstimate | null>(() => {
    if (!selectedSpace) return null;
    return sunlightEstimationEngine.estimateSunlight({
      userReported: selectedSpace.sunlight,
      observations: selectedSpace.sunlightProfile?.observations || [],
      photos: selectedSpace.photos,
      location: garden?.location,
      spaceType: selectedSpace.type
    });
  }, [selectedSpace, garden?.location]);

  // Milestone 5: Record Observation
  const recordSunlightObservation = useCallback(
    (
      spaceId: string,
      observation: {
        timeOfDay: 'morning' | 'afternoon' | 'evening';
        condition: 'mostly_sunny' | 'partially_shaded' | 'mostly_shaded';
        notes?: string;
      }
    ) => {
      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          spaces: prev.spaces.map((s) => {
            if (s.id !== spaceId) return s;
            const currentProfile =
              s.sunlightProfile ||
              sunlightEstimationEngine.createInitialProfile(s.sunlight, s.type);
            const updatedProfile = sunlightEstimationEngine.recordObservation(
              currentProfile,
              {
                spaceId,
                timeOfDay: observation.timeOfDay,
                condition: observation.condition,
                notes: observation.notes
              },
              prev.location
            );
            return {
              ...s,
              sunlightProfile: updatedProfile,
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };
      });
    },
    []
  );

  // Milestone 5: Add Sunlight Zone
  const addSunlightZone = useCallback(
    (
      spaceId: string,
      zone: { name: string; type: 'sunny' | 'partial_shade' | 'shade'; description?: string }
    ): SunlightZone => {
      const newZone: SunlightZone = {
        id: `sz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        spaceId,
        name: zone.name.trim() || 'New Sunlight Zone',
        type: zone.type,
        description: zone.description
      };
      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          spaces: prev.spaces.map((s) => {
            if (s.id !== spaceId) return s;
            return {
              ...s,
              sunlightZones: [...(s.sunlightZones || []), newZone],
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };
      });
      return newZone;
    },
    []
  );

  // Milestone 6: Layout Actions
  const updateSpaceLayout = useCallback((spaceId: string, layoutUpdates: Partial<SpaceLayout>) => {
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        spaces: prev.spaces.map((s) => {
          if (s.id !== spaceId) return s;
          const currentLayout = s.layout || {
            zones: [],
            containers: [],
            plantPlacements: [],
            updatedAt: new Date().toISOString()
          };
          return {
            ...s,
            layout: {
              ...currentLayout,
              ...layoutUpdates,
              updatedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          };
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const addContainer = useCallback(
    (spaceId: string, container: Omit<GardenContainer, 'id' | 'spaceId'>): GardenContainer => {
      const newContainer: GardenContainer = {
        ...container,
        id: `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        spaceId
      };
      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          spaces: prev.spaces.map((s) => {
            if (s.id !== spaceId) return s;
            const currentLayout = s.layout || {
              zones: [],
              containers: [],
              plantPlacements: [],
              updatedAt: new Date().toISOString()
            };
            return {
              ...s,
              layout: {
                ...currentLayout,
                containers: [...currentLayout.containers, newContainer],
                updatedAt: new Date().toISOString()
              },
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };
      });
      return newContainer;
    },
    []
  );

  const removeContainer = useCallback((spaceId: string, containerId: string) => {
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        spaces: prev.spaces.map((s) => {
          if (s.id !== spaceId || !s.layout) return s;
          return {
            ...s,
            layout: {
              ...s.layout,
              containers: s.layout.containers.filter((c) => c.id !== containerId),
              plantPlacements: s.layout.plantPlacements.filter((p) => p.containerId !== containerId),
              updatedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          };
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const placePlant = useCallback(
    (spaceId: string, placement: Omit<PlantPlacement, 'id' | 'spaceId'>): PlantPlacement => {
      const newPlacement: PlantPlacement = {
        ...placement,
        id: `plm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        spaceId
      };
      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          spaces: prev.spaces.map((s) => {
            if (s.id !== spaceId) return s;
            const currentLayout = s.layout || {
              zones: [],
              containers: [],
              plantPlacements: [],
              updatedAt: new Date().toISOString()
            };
            const filteredPlacements = currentLayout.plantPlacements.filter(
              (p) => p.plantId !== placement.plantId
            );
            return {
              ...s,
              layout: {
                ...currentLayout,
                plantPlacements: [...filteredPlacements, newPlacement],
                updatedAt: new Date().toISOString()
              },
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };
      });
      return newPlacement;
    },
    []
  );

  const removePlantPlacement = useCallback((spaceId: string, placementId: string) => {
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        spaces: prev.spaces.map((s) => {
          if (s.id !== spaceId || !s.layout) return s;
          return {
            ...s,
            layout: {
              ...s.layout,
              plantPlacements: s.layout.plantPlacements.filter((p) => p.id !== placementId),
              updatedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          };
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const addSpaceZone = useCallback(
    (spaceId: string, zone: Omit<SpaceZone, 'id' | 'spaceId'>): SpaceZone => {
      const newZone: SpaceZone = {
        ...zone,
        id: `zone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        spaceId
      };
      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          spaces: prev.spaces.map((s) => {
            if (s.id !== spaceId) return s;
            const currentLayout = s.layout || {
              zones: [],
              containers: [],
              plantPlacements: [],
              updatedAt: new Date().toISOString()
            };
            return {
              ...s,
              layout: {
                ...currentLayout,
                zones: [...currentLayout.zones, newZone],
                updatedAt: new Date().toISOString()
              },
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };
      });
      return newZone;
    },
    []
  );

  const removeSpaceZone = useCallback((spaceId: string, zoneId: string) => {
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        spaces: prev.spaces.map((s) => {
          if (s.id !== spaceId || !s.layout) return s;
          return {
            ...s,
            layout: {
              ...s.layout,
              zones: s.layout.zones.filter((z) => z.id !== zoneId),
              plantPlacements: s.layout.plantPlacements.filter((p) => p.zoneId !== zoneId),
              updatedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          };
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const autoOptimizeLayout = useCallback((spaceId: string) => {
    setGarden((prev) => {
      if (!prev) return null;
      const targetSpace = prev.spaces.find((s) => s.id === spaceId);
      if (!targetSpace) return prev;

      const layout = targetSpace.layout || {
        zones: [],
        containers: [],
        plantPlacements: [],
        updatedAt: new Date().toISOString()
      };

      const sunnyZone =
        layout.zones.find((z) => z.type === 'sunny_area' || z.name.toLowerCase().includes('sun')) ||
        layout.zones[0];
      const shadeZone =
        layout.zones.find((z) => z.type === 'shaded_area' || z.name.toLowerCase().includes('shade')) ||
        layout.zones[1] ||
        layout.zones[0];

      let currentContainers = [...layout.containers];
      const newPlacements: PlantPlacement[] = [];

      targetSpace.plants.forEach((gp) => {
        const plant = gp.plant;
        const targetZone = plant.sunlightRequirement === 'full' ? sunnyZone : shadeZone;

        let container = currentContainers.find(
          (c) => c.zoneId === targetZone?.id && (!c.plantIds || c.plantIds.length < (c.maxPlants || 2))
        );

        if (!container && targetZone) {
          const newContainer: GardenContainer = {
            id: `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            spaceId,
            name: `${plant.name} Container`,
            type: plant.containerFriendly ? 'pot' : 'grow_bag',
            size: 'medium',
            zoneId: targetZone.id,
            sunlightZoneId: targetZone.sunlightZoneId,
            maxPlants: 2,
            plantIds: [plant.id],
            isAccessibleForWatering: true
          };
          currentContainers.push(newContainer);
          container = newContainer;
        } else if (container) {
          container = {
            ...container,
            plantIds: [...(container.plantIds || []), plant.id]
          };
          currentContainers = currentContainers.map((c) => (c.id === container!.id ? container! : c));
        }

        newPlacements.push({
          id: `plm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          spaceId,
          plantId: plant.id,
          plantName: plant.name,
          containerId: container?.id,
          zoneId: targetZone?.id,
          sunlightZoneId: targetZone?.sunlightZoneId,
          notes: `Optimized: ${plant.sunlightRequirement === 'full' ? 'Direct sunny area' : 'Gentle partial shade'}`
        });
      });

      return {
        ...prev,
        spaces: prev.spaces.map((s) => {
          if (s.id !== spaceId) return s;
          return {
            ...s,
            layout: {
              ...layout,
              containers: currentContainers,
              plantPlacements: newPlacements,
              updatedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          };
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const layoutIssues = useMemo<LayoutIssue[]>(() => {
    if (!selectedSpace || !selectedSpace.layout) return [];
    return layoutValidationEngine.validateLayout(selectedSpace, selectedSpace.layout, selectedSpace.plants);
  }, [selectedSpace]);

  const layoutRecommendations = useMemo<LayoutRecommendation[]>(() => {
    if (!selectedSpace || !selectedSpace.layout) return [];
    return layoutRecommendationEngine.generateRecommendations(
      selectedSpace,
      selectedSpace.layout,
      selectedSpace.plants
    );
  }, [selectedSpace]);

  // Milestone 9 Memoized Derivations
  const spaceCoverage = useMemo(() => {
    if (!selectedSpace) return null;
    return captureCoverageEngine.evaluateCoverage(selectedSpace);
  }, [selectedSpace]);

  const spaceMeasurements = useMemo(() => {
    return selectedSpace?.measurements || [];
  }, [selectedSpace]);

  const usableSpace = useMemo(() => {
    if (!selectedSpace) return null;
    return usableSpaceEngine.calculateUsableSpace(selectedSpace);
  }, [selectedSpace]);

  const userObservations = useMemo(() => {
    return selectedSpace?.userObservations || [];
  }, [selectedSpace]);

  // Milestone 10 Memoized Digital Twin
  const digitalTwin = useMemo(() => {
    if (!selectedSpace) return null;
    return digitalTwinRecommendationEngine.getOrCreateDigitalTwin(selectedSpace);
  }, [selectedSpace]);

  // Milestone 9 Actions
  const evaluateSpaceCoverage = useCallback(
    (spaceId: string): SpaceCaptureCoverage => {
      const sp = spaces.find((s) => s.id === spaceId) || selectedSpace;
      if (!sp) throw new Error('Space not found');
      const updated = captureCoverageEngine.evaluateCoverage(sp);
      editSpace(spaceId, { coverage: updated });
      return updated;
    },
    [spaces, selectedSpace, editSpace]
  );

  const addSpaceMeasurement = useCallback(
    (
      spaceId: string,
      data: Omit<SpaceMeasurement, 'id' | 'spaceId' | 'createdAt'>
    ): SpaceMeasurement => {
      const newMeasurement: SpaceMeasurement = {
        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        spaceId,
        name: data.name,
        value: data.value,
        unit: data.unit,
        source: data.source,
        confidence: data.confidence,
        createdAt: new Date().toISOString(),
        evidenceMediaIds: data.evidenceMediaIds,
        notes: data.notes
      };
      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          spaces: prev.spaces.map((s) => {
            if (s.id !== spaceId) return s;
            const existing = s.measurements || [];
            const updatedMeasurements = [...existing.filter((m) => m.name !== data.name), newMeasurement];
            return {
              ...s,
              measurements: updatedMeasurements,
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };
      });
      return newMeasurement;
    },
    []
  );

  const removeSpaceMeasurement = useCallback((spaceId: string, measurementId: string) => {
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        spaces: prev.spaces.map((s) => {
          if (s.id !== spaceId) return s;
          return {
            ...s,
            measurements: (s.measurements || []).filter((m) => m.id !== measurementId),
            updatedAt: new Date().toISOString()
          };
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const confirmUserObservation = useCallback(
    (
      spaceId: string,
      data: Omit<UserConfirmableObservation, 'id' | 'spaceId' | 'confirmedAt' | 'source'>
    ): UserConfirmableObservation => {
      const newObs: UserConfirmableObservation = {
        id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        spaceId,
        category: data.category,
        question: data.question,
        value: data.value,
        confirmedAt: new Date().toISOString(),
        source: 'user_confirmed',
        notes: data.notes
      };
      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          spaces: prev.spaces.map((s) => {
            if (s.id !== spaceId) return s;
            const existing = s.userObservations || [];
            const updatedObs = [...existing.filter((o) => o.category !== data.category), newObs];
            const updatedCoverage = captureCoverageEngine.evaluateCoverage({
              ...s,
              userObservations: updatedObs
            });
            return {
              ...s,
              userObservations: updatedObs,
              coverage: updatedCoverage,
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };
      });
      return newObs;
    },
    []
  );

  // Milestone 10 Actions
  const generateDigitalTwinProposal = useCallback(
    (spaceId: string, mode: DigitalTwinProposalMode): DigitalTwinProposal => {
      const targetSpace = spaces.find((s) => s.id === spaceId) || selectedSpace;
      if (!targetSpace) throw new Error('Space not found');
      const proposal = digitalTwinRecommendationEngine.generateProposal(targetSpace, mode);
      setGarden((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          spaces: prev.spaces.map((s) => {
            if (s.id !== spaceId) return s;
            const currentTwin = digitalTwinRecommendationEngine.getOrCreateDigitalTwin(s);
            const existingProposals = currentTwin.proposals || [];
            const updatedTwin: GardenDigitalTwin = {
              ...currentTwin,
              proposals: [...existingProposals.filter((p) => p.mode !== mode), proposal],
              activeProposal: proposal,
              updatedAt: new Date().toISOString()
            };
            return {
              ...s,
              digitalTwin: updatedTwin,
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };
      });
      return proposal;
    },
    [spaces, selectedSpace]
  );

  const acceptDigitalTwinProposal = useCallback((spaceId: string, proposalId: string) => {
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        spaces: prev.spaces.map((s) => {
          if (s.id !== spaceId) return s;
          const twin = s.digitalTwin;
          const proposal =
            twin?.proposals?.find((p) => p.id === proposalId) ||
            (twin?.activeProposal?.id === proposalId ? twin.activeProposal : null);
          if (!proposal) return s;

          const updatedLayout: SpaceLayout = {
            ...proposal.layout,
            updatedAt: new Date().toISOString()
          };
          const updatedTwin: GardenDigitalTwin = {
            ...twin!,
            layout: updatedLayout,
            activeProposal: undefined,
            updatedAt: new Date().toISOString()
          };
          return {
            ...s,
            layout: updatedLayout,
            digitalTwin: updatedTwin,
            updatedAt: new Date().toISOString()
          };
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const discardDigitalTwinProposal = useCallback((spaceId: string, proposalId: string) => {
    setGarden((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        spaces: prev.spaces.map((s) => {
          if (s.id !== spaceId) return s;
          const twin = s.digitalTwin;
          if (!twin) return s;
          const updatedTwin: GardenDigitalTwin = {
            ...twin,
            proposals: (twin.proposals || []).filter((p) => p.id !== proposalId),
            activeProposal: twin.activeProposal?.id === proposalId ? undefined : twin.activeProposal,
            updatedAt: new Date().toISOString()
          };
          return {
            ...s,
            digitalTwin: updatedTwin,
            updatedAt: new Date().toISOString()
          };
        }),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const getVisualConceptOutput = useCallback(
    (spaceId: string, proposal: DigitalTwinProposal): VisualConceptOutput => {
      const targetSpace = spaces.find((s) => s.id === spaceId) || selectedSpace;
      if (!targetSpace) throw new Error('Space not found');
      return aiVisualizerService.generateConceptVisualization(targetSpace, proposal);
    },
    [spaces, selectedSpace]
  );

  // Milestone 12: Garden Memory & Growth Tracking Hooks
  const allPlantsList = useMemo(() => {
    return (garden?.spaces || []).flatMap((s) => s.plants || []);
  }, [garden]);

  const allCareEventsList = useMemo(() => {
    return allPlantsList.flatMap((p) => p.careHistory || []);
  }, [allPlantsList]);

  const gardenInsights = useMemo(() => {
    if (!garden) return [];
    return gardenMemoryEngine.generateGardenInsights(allPlantsList, garden.spaces || [], allCareEventsList);
  }, [garden, allPlantsList, allCareEventsList]);

  const addJournalEntry = useCallback((entryData: {
    plantInstanceId: string;
    plantId: string;
    spaceId: string;
    type: import('../types').PlantJournalEntryType;
    occurredAt?: string;
    note?: string;
    mediaIds?: string[];
    source?: 'user' | 'care_engine' | 'vision_ai' | 'system';
    confidence?: number;
    stage?: PlantLifecycleStage;
    heightCm?: number;
    environmentalSnapshot?: {
      temperatureC?: number;
      weatherCondition?: string;
      isRainy?: boolean;
    };
  }): PlantJournalEntry => {
    const entry = gardenMemoryEngine.createJournalEntry({
      ...entryData,
      environmentalSnapshot: entryData.environmentalSnapshot || (environmentalContext ? {
        temperatureC: environmentalContext.snapshot.temperatureC,
        weatherCondition: environmentalContext.snapshot.conditionText,
        isRainy: environmentalContext.snapshot.rainfallMm > 0
      } : undefined)
    });

    if (garden) {
      const updatedSpaces = garden.spaces.map((sp) => {
        if (sp.id !== entryData.spaceId) return sp;
        const updatedPlants = sp.plants.map((p) => {
          if (p.instanceId !== entryData.plantInstanceId && p.plantId !== entryData.plantId) {
            return p;
          }
          const existingJournal = p.journalEntries || [];
          const updatedJournal = [entry, ...existingJournal];

          let updatedStage = p.lifecycleStage;
          let updatedHistory = p.lifecycleHistory || [];
          if (entryData.type === 'stage_changed' && entryData.stage) {
            updatedStage = entryData.stage;
            updatedHistory = [
              ...updatedHistory,
              {
                id: `stage-${Date.now()}`,
                stage: entryData.stage,
                transitionedAt: entry.occurredAt,
                note: entryData.note,
                source: entryData.source === 'system' ? 'system' : 'user'
              }
            ];
          }

          let updatedMeasurements = p.heightMeasurements || [];
          if (entryData.type === 'height_measured' && entryData.heightCm !== undefined) {
            updatedMeasurements = [
              ...updatedMeasurements,
              {
                id: `height-${Date.now()}`,
                heightCm: entryData.heightCm,
                measuredAt: entry.occurredAt,
                source: 'user_measured',
                note: entryData.note
              }
            ];
          }

          return {
            ...p,
            lifecycleStage: updatedStage,
            lifecycleHistory: updatedHistory,
            journalEntries: updatedJournal,
            heightMeasurements: updatedMeasurements
          };
        });

        return { ...sp, plants: updatedPlants, updatedAt: new Date().toISOString() };
      });

      setGarden({ ...garden, spaces: updatedSpaces, updatedAt: new Date().toISOString() });
    }

    return entry;
  }, [garden, environmentalContext]);

  const updatePlantLifecycleStage = useCallback((
    instanceId: string,
    newStage: PlantLifecycleStage,
    note?: string
  ) => {
    const targetPlant = allPlantsList.find((p) => p.instanceId === instanceId || p.plantId === instanceId);
    if (!targetPlant || !targetPlant.spaceId) return;

    addJournalEntry({
      plantInstanceId: targetPlant.instanceId || instanceId,
      plantId: targetPlant.plantId,
      spaceId: targetPlant.spaceId,
      type: 'stage_changed',
      stage: newStage,
      note: note || `Growth stage updated to ${newStage}`,
      source: 'user'
    });
  }, [allPlantsList, addJournalEntry]);

  const addPlantHeightMeasurement = useCallback((
    instanceId: string,
    heightCm: number,
    note?: string
  ) => {
    const targetPlant = allPlantsList.find((p) => p.instanceId === instanceId || p.plantId === instanceId);
    if (!targetPlant || !targetPlant.spaceId) return;

    addJournalEntry({
      plantInstanceId: targetPlant.instanceId || instanceId,
      plantId: targetPlant.plantId,
      spaceId: targetPlant.spaceId,
      type: 'height_measured',
      heightCm,
      note: note || `Height recorded: ${heightCm}cm`,
      source: 'user'
    });
  }, [allPlantsList, addJournalEntry]);

  const getAllGardenJournalEntries = useCallback((): PlantJournalEntry[] => {
    const allEntries = allPlantsList.flatMap((p) => p.journalEntries || []);
    return allEntries.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }, [allPlantsList]);

  // Milestone 13: Environmental Intelligence Summaries & Insights
  const environmentalSummaries = useMemo((): EnvironmentalSummary[] => {
    if (!selectedSpace) return [];
    const types: import('../types').EnvironmentalMeasurementType[] = [
      'air_temperature',
      'relative_humidity',
      'soil_moisture',
      'ambient_light',
      'soil_temperature',
      'rainfall'
    ];
    return types
      .map((t) => environmentalService.calculateSummary(environmentalObservations, t, selectedSpace.id))
      .filter((s): s is EnvironmentalSummary => s !== null);
  }, [environmentalObservations, selectedSpace]);

  const plantEnvironmentalInsights = useMemo((): PlantEnvironmentalInsight[] => {
    if (!selectedSpace) return [];
    return environmentalService.generatePlantEnvironmentalInsights(
      selectedSpace.plants || [],
      selectedSpace.id,
      environmentalObservations
    );
  }, [selectedSpace, environmentalObservations]);

  const addObservation = useCallback(
    (candidate: Partial<EnvironmentalObservation>) => {
      const res = environmentalService.ingestObservation(environmentalObservations, candidate);
      if (res.success && res.observation) {
        setEnvironmentalObservations((prev) => [res.observation!, ...prev]);
      }
      return res;
    },
    [environmentalObservations]
  );

  const registerSensorDevice = useCallback(
    (device: Partial<SensorDevice>) => {
      const res = environmentalService.registerDevice(sensorDevices, device);
      if (res.success && res.device) {
        setSensorDevices((prev) => [...prev, res.device!]);
      }
      return res;
    },
    [sensorDevices]
  );

  const getSpaceObservations = useCallback(
    (spaceId: string): EnvironmentalObservation[] => {
      return environmentalObservations.filter((o) => o.spaceId === spaceId);
    },
    [environmentalObservations]
  );

  // Milestone 14 & 16: Weather-Aware Adaptive Garden Care Planner
  const careRecommendations = useMemo((): CareRecommendation[] => {
    if (!selectedSpace) return [];
    return adaptiveCareEngine.generateRecommendations(
      selectedSpace,
      selectedSpace.plants || [],
      environmentalObservations,
      new Date(),
      environmentalContext
    );
  }, [selectedSpace, environmentalObservations, environmentalContext]);

  // Synchronize adaptive tasks when recommendations or space change
  useEffect(() => {
    if (!selectedSpace || careRecommendations.length === 0) return;
    setAdaptiveCareTasks((prev) =>
      adaptiveCareEngine.synchronizeTasksFromRecommendations(prev, careRecommendations, selectedSpace)
    );
  }, [selectedSpace, careRecommendations]);

  const completeAdaptiveCareTask = useCallback(
    (taskId: string, notes?: string) => {
      setAdaptiveCareTasks((prev) => {
        const { tasks: updatedTasks, completedTask } = adaptiveCareEngine.completeTask(prev, taskId, notes);
        if (completedTask && completedTask.plantInstanceId && completedTask.spaceId) {
          const actionType: import('../types').PlantJournalEntryType =
            completedTask.category === 'watering'
              ? 'watered'
              : completedTask.category === 'pruning'
              ? 'pruned'
              : completedTask.category === 'feeding'
              ? 'fertilized'
              : 'care_action';

          addJournalEntry({
            plantInstanceId: completedTask.plantInstanceId,
            plantId: completedTask.plantId || '',
            spaceId: completedTask.spaceId,
            type: actionType,
            note: notes || completedTask.title,
            source: 'user'
          });

          if (completedTask.category === 'watering' && completedTask.plantId) {
            waterPlant(completedTask.plantId, notes || 'Completed via Care Planner');
          }
        }
        return updatedTasks;
      });
    },
    [addJournalEntry, waterPlant]
  );

  const snoozeAdaptiveCareTask = useCallback((taskId: string, hours: number = 24) => {
    setAdaptiveCareTasks((prev) => adaptiveCareEngine.snoozeTask(prev, taskId, hours));
  }, []);

  const dismissAdaptiveCareTask = useCallback((taskId: string, reason?: string) => {
    setAdaptiveCareTasks((prev) => adaptiveCareEngine.dismissTask(prev, taskId, reason));
  }, []);

  const refreshCarePlanner = useCallback(() => {
    if (!selectedSpace) return;
    const recs = adaptiveCareEngine.generateRecommendations(
      selectedSpace,
      selectedSpace.plants || [],
      environmentalObservations,
      new Date(),
      environmentalContext
    );
    setAdaptiveCareTasks((prev) =>
      adaptiveCareEngine.synchronizeTasksFromRecommendations(prev, recs, selectedSpace)
    );
  }, [selectedSpace, environmentalObservations, environmentalContext]);

  // Milestone 15: Plant Health Diagnostic Intelligence
  const diagnosePlantHealth = useCallback(
    (params: {
      plantInstanceId?: string;
      plantId?: string;
      symptoms: StructuredSymptomReport;
      visionResult?: PlantPhotoAnalysisResult | null;
    }): ContextualDiagnosisReport => {
      if (!selectedSpace) {
        throw new Error('No garden space selected for diagnosis');
      }

      // Match target plant from selected space plants
      let targetPlant: GardenPlant | Plant | null = null;
      if (params.plantInstanceId) {
        targetPlant =
          (selectedSpace.plants || []).find(
            (p) => p.instanceId === params.plantInstanceId
          ) || null;
      }
      if (!targetPlant && params.plantId) {
        targetPlant =
          (selectedSpace.plants || []).find((p) => p.plantId === params.plantId) ||
          PLANT_CATALOG.find((p) => p.id === params.plantId) ||
          null;
      }

      return plantHealthDiagnosticEngine.diagnose({
        space: selectedSpace,
        plant: targetPlant,
        symptoms: params.symptoms,
        environmentalObservations,
        environmentalContext,
        visionResult: params.visionResult
      });
    },
    [selectedSpace, environmentalObservations, environmentalContext]
  );

  const saveDiagnosisRecord = useCallback(
    (report: ContextualDiagnosisReport): DiagnosisRecord => {
      const newRecord: DiagnosisRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        report,
        createdAt: new Date().toISOString()
      };

      setDiagnosisHistory((prev) => [newRecord, ...prev]);

      // Automatically log to Garden Journal (Milestone 12 integration)
      addJournalEntry({
        plantInstanceId: report.plantInstanceId || 'unassigned',
        plantId: report.plantId || 'unassigned',
        spaceId: report.spaceId,
        type: 'diagnosis_recorded',
        note: `Plant Doctor Diagnosis: ${report.summary} (Strength: ${report.overallEvidenceStrength})`,
        source: 'care_engine'
      });

      return newRecord;
    },
    [addJournalEntry]
  );

  const convertDiagnosisToCareTask = useCallback(
    (
      diagnosisRecordId: string,
      causeId?: string
    ): { success: boolean; task?: AdaptiveCareTask; message: string } => {
      const record = diagnosisHistory.find((r) => r.id === diagnosisRecordId);
      if (!record) {
        return { success: false, message: 'Diagnosis record not found.' };
      }

      const report = record.report;
      const cause = causeId
        ? report.rankedCauses.find((c) => c.id === causeId) || report.rankedCauses[0]
        : report.rankedCauses[0];

      if (!cause || !cause.suggestedCareAction) {
        return { success: false, message: 'No actionable care step is suggested for this cause.' };
      }

      // Deduplication: prevent duplicate active tasks for the same plant & category
      const isDuplicate = adaptiveCareTasks.some(
        (t) =>
          t.spaceId === report.spaceId &&
          t.plantInstanceId === report.plantInstanceId &&
          t.category === cause.suggestedCareAction!.category &&
          (t.status === 'suggested' || t.status === 'planned' || t.status === 'due' || t.status === 'snoozed')
      );

      if (isDuplicate) {
        return {
          success: false,
          message: `An active ${cause.suggestedCareAction.category} task already exists for this plant.`
        };
      }

      const taskId = `task-diag-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      const newTask: AdaptiveCareTask = {
        id: taskId,
        spaceId: report.spaceId,
        plantInstanceId: report.plantInstanceId,
        plantId: report.plantId,
        plantName: report.plantName,
        title: cause.suggestedCareAction.title,
        description: cause.suggestedCareAction.description,
        category: cause.suggestedCareAction.category,
        priority: cause.suggestedCareAction.priority,
        status: 'planned',
        estimatedMinutes: 10,
        createdAt: new Date().toISOString(),
        dueWindow: 'Next 24 Hours',
        touchGrassPrompt: 'Inspect your plant firsthand and check the soil before making irreversible changes.'
      };

      setAdaptiveCareTasks((prev) => [newTask, ...prev]);

      // Link task ID to diagnosis record
      setDiagnosisHistory((prev) =>
        prev.map((r) => (r.id === diagnosisRecordId ? { ...r, createdTaskId: taskId } : r))
      );

      return {
        success: true,
        task: newTask,
        message: `Care task "${newTask.title}" added to your Care Planner.`
      };
    },
    [diagnosisHistory, adaptiveCareTasks]
  );

  const recordDiagnosisFollowUp = useCallback(
    (
      recordId: string,
      status: 'resolved' | 'improved' | 'no_change' | 'declined',
      notes?: string
    ) => {
      let updatedRecord: DiagnosisRecord | undefined;

      setDiagnosisHistory((prev) =>
        prev.map((r) => {
          if (r.id === recordId) {
            updatedRecord = {
              ...r,
              followUpStatus: status,
              followUpNotes: notes
            };
            return updatedRecord;
          }
          return r;
        })
      );

      const target = updatedRecord || diagnosisHistory.find((r) => r.id === recordId);
      if (target) {
        addJournalEntry({
          plantInstanceId: target.report.plantInstanceId || 'unassigned',
          plantId: target.report.plantId || 'unassigned',
          spaceId: target.report.spaceId,
          type: 'follow_up_recorded',
          note: `Doctor Follow-up: Status marked as "${status}". ${notes ? notes : ''}`,
          source: 'user'
        });
      }
    },
    [diagnosisHistory, addJournalEntry]
  );

  return (
    <GardenContext.Provider
      value={{
        garden,
        spaces,
        selectedSpaceId,
        selectedSpace,
        profile,
        photo,
        selectedGardenPlants,
        recommendations,
        shoppingList,
        allShoppingList,
        tasks,
        allTasks,
        environmentalContext,
        environmentalAdvice,
        waterPlant,
        checkSoil,
        setTaskStatus,
        careReminders,
        enableNotifications,
        notificationStatus,
        modelAvailability,
        checkModelAvailability,
        ollamaConfig,
        setOllamaConfig,
        storedAIObservations,
        saveAIObservation,
        recordSunlightObservation,
        addSunlightZone,
        selectedSpaceSunlightEstimate,
        updateSpaceLayout,
        addContainer,
        removeContainer,
        placePlant,
        removePlantPlacement,
        addSpaceZone,
        removeSpaceZone,
        autoOptimizeLayout,
        layoutIssues,
        layoutRecommendations,
        chatMessages,
        activeTab,
        isInitialLoading,
        showTouchGrassModal,
        selectedPlantForDetail,
        isSpaceModalOpen,
        spaceModalMode,
        editingSpace,
        setActiveTab,
        selectSpace,
        addSpace,
        editSpace,
        deleteSpace,
        openCreateSpaceModal,
        openEditSpaceModal,
        closeSpaceModal,
        saveProfile,
        savePhoto,
        removePhoto,
        addPlantToGarden,
        removePlantFromGarden,
        isPlantInGarden,
        toggleTask,
        toggleShoppingItem,
        sendChatMessage,
        setShowTouchGrassModal,
        setSelectedPlantForDetail,
        resetAll,
        gardenLocation,
        locationPermissionStatus,
        weatherMode,
        setWeatherMode,
        requestCurrentLocation,
        setManualLocation,
        clearLocation,
        refreshWeather,
        activeCaptureSession,
        setActiveCaptureSessionId,
        createCaptureSession,
        saveMediaAsset,
        deleteMediaAsset,
        extractVideoFrames,
        analyzeSpaceMedia,
        spaceCoverage,
        spaceMeasurements,
        usableSpace,
        userObservations,
        evaluateSpaceCoverage,
        addSpaceMeasurement,
        removeSpaceMeasurement,
        confirmUserObservation,
        digitalTwin,
        generateDigitalTwinProposal,
        acceptDigitalTwinProposal,
        discardDigitalTwinProposal,
        getVisualConceptOutput,
        gardenInsights,
        addJournalEntry,
        updatePlantLifecycleStage,
        addPlantHeightMeasurement,
        getAllGardenJournalEntries,
        environmentalObservations,
        sensorDevices,
        environmentalSummaries,
        plantEnvironmentalInsights,
        addObservation,
        registerSensorDevice,
        getSpaceObservations,
        careRecommendations,
        adaptiveCareTasks,
        completeAdaptiveCareTask,
        snoozeAdaptiveCareTask,
        dismissAdaptiveCareTask,
        refreshCarePlanner,
        diagnosisHistory,
        diagnosePlantHealth,
        saveDiagnosisRecord,
        convertDiagnosisToCareTask,
        recordDiagnosisFollowUp
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};

export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) {
    throw new Error('useGarden must be used within a GardenProvider');
  }
  return context;
};
