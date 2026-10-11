import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptiveCareEngine } from '../services/adaptiveCareEngine';
import { OpenMeteoWeatherProvider } from '../services/openMeteoWeatherProvider';
import { PlantHealthDiagnosticEngine } from '../services/plantHealthDiagnosticEngine';
import {
  GardenPlant,
  GardenSpace,
  EnvironmentalObservation,
  EnvironmentalContext,
  LocationInfo,
  AdaptiveCareTask
} from '../types';
import { PLANT_CATALOG } from '../data/plants';

describe('Milestone 16: Weather-Aware Garden Intelligence', () => {
  let careEngine: AdaptiveCareEngine;
  let weatherProvider: OpenMeteoWeatherProvider;
  let diagnosticEngine: PlantHealthDiagnosticEngine;

  const tomato = PLANT_CATALOG.find((p) => p.id === 'cherry-tomato') || PLANT_CATALOG[0];
  const mint = PLANT_CATALOG.find((p) => p.id === 'mint') || PLANT_CATALOG[1];
  const tulsi = PLANT_CATALOG.find((p) => p.id === 'holy-basil-tulsi') || PLANT_CATALOG[2];

  const exposedSpace: GardenSpace = {
    id: 'space-exposed-terrace',
    name: 'Open Terrace',
    type: 'terrace',
    size: 'large',
    sunlight: 'more_than_6h',
    goal: 'vegetables',
    isSheltered: false,
    photos: [],
    plants: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const shelteredSpace: GardenSpace = {
    id: 'space-sheltered-balcony',
    name: 'Covered Balcony',
    type: 'balcony',
    size: 'small',
    sunlight: '2_to_4h',
    goal: 'herbs',
    isSheltered: true, // Under solid roof
    photos: [],
    plants: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const indoorSpace: GardenSpace = {
    id: 'space-living-room',
    name: 'Living Room',
    type: 'indoor',
    size: 'small',
    sunlight: 'less_than_2h',
    goal: 'easy_plants',
    photos: [],
    plants: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    careEngine = new AdaptiveCareEngine();
    weatherProvider = new OpenMeteoWeatherProvider();
    diagnosticEngine = new PlantHealthDiagnosticEngine();
    weatherProvider.clearCache();
    vi.restoreAllMocks();
  });

  describe('2.2 Weather Provider Intelligence & Defense', () => {
    it('correctly maps live Open-Meteo payload into normalized WeatherSnapshot with apparent temp, observed and forecast rain', async () => {
      const mockResponse = {
        current: {
          time: '2026-10-11T12:00:00Z',
          temperature_2m: 29.4,
          relative_humidity_2m: 65,
          apparent_temperature: 32.1,
          precipitation: 0.0,
          rain: 0.0,
          weather_code: 2,
          cloud_cover: 45,
          wind_speed_10m: 14.5
        },
        daily: {
          time: ['2026-10-11', '2026-10-12'],
          temperature_2m_max: [31.0, 30.5],
          temperature_2m_min: [22.0, 21.5],
          precipitation_sum: [8.5, 2.0],
          precipitation_probability_max: [75, 40],
          weather_code: [61, 2],
          wind_speed_10m_max: [18.0, 12.0]
        }
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      }));

      const loc: LocationInfo = { city: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.97, longitude: 77.59 };
      const forecast = await weatherProvider.getForecast(loc);

      expect(forecast.current.temperatureC).toBe(29.4);
      expect(forecast.current.apparentTemperatureC).toBe(32.1);
      expect(forecast.current.forecastRainfallMm).toBe(8.5);
      expect(forecast.current.observedRainfallMm).toBe(0.0);
      expect(forecast.current.precipitationProbabilityPercent).toBe(75);
      expect(forecast.current.retrievedAt).toBeDefined();
      expect(forecast.current.validFrom).toBe('2026-10-11T12:00:00Z');
      expect(forecast.daily[0].windSpeedKmh).toBe(18.0);
    });

    it('identifies severe weather heatwave alerts for extreme temperatures', async () => {
      const hotResponse = {
        current: {
          temperature_2m: 42.0,
          apparent_temperature: 44.5,
          relative_humidity_2m: 35,
          weather_code: 0,
          wind_speed_10m: 10
        },
        daily: {
          time: ['2026-10-11'],
          temperature_2m_max: [43.0],
          temperature_2m_min: [28.0],
          precipitation_probability_max: [0],
          precipitation_sum: [0]
        }
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => hotResponse
      }));

      const loc: LocationInfo = { city: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9, longitude: 75.8 };
      const forecast = await weatherProvider.getForecast(loc);

      expect(forecast.current.severeWeatherAlert).toBeDefined();
      expect(forecast.current.severeWeatherAlert?.type).toBe('heatwave');
      expect(forecast.current.severeWeatherAlert?.severity).toBe('alert');
      expect(forecast.current.severeWeatherAlert?.headline).toContain('Heatwave');
    });

    it('identifies frost / near-freeze warning when temperatures drop near freezing', async () => {
      const frostResponse = {
        current: {
          temperature_2m: 1.5,
          weather_code: 0,
          wind_speed_10m: 5
        },
        daily: {
          time: ['2026-10-11'],
          temperature_2m_max: [8.0],
          temperature_2m_min: [0.5],
          precipitation_probability_max: [0],
          precipitation_sum: [0]
        }
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => frostResponse
      }));

      const loc: LocationInfo = { city: 'Shimla', state: 'HP', country: 'India', latitude: 31.1, longitude: 77.1 };
      const forecast = await weatherProvider.getForecast(loc);

      expect(forecast.current.severeWeatherAlert).toBeDefined();
      expect(forecast.current.severeWeatherAlert?.type).toBe('frost');
      expect(forecast.current.severeWeatherAlert?.severity).toBe('alert');
    });

    it('gracefully handles offline operation and returns honest unavailable state without substituting zero for temperature', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));
      const loc: LocationInfo = { city: 'OfflineTown', state: '', country: 'India' };

      const envCtx = await weatherProvider.getEnvironmentalContext(loc);
      expect(envCtx.isUnavailable).toBe(true);
      expect(envCtx.source).toBe('unavailable');
      expect(envCtx.snapshot.conditionText).toContain('unavailable');
    });
  });

  describe('2.3 Weather-Aware Watering Decisions & Shelter Differentiation', () => {
    const rainyEnvContext: EnvironmentalContext = {
      location: { city: 'Bengaluru', state: '', country: 'India' },
      source: 'open_meteo_live',
      confidence: 'measured_live',
      timestamp: new Date().toISOString(),
      snapshot: {
        temperatureC: 24,
        minTemperatureC: 20,
        maxTemperatureC: 27,
        humidityPercent: 88,
        precipitationProbabilityPercent: 80,
        rainfallMm: 0,
        windSpeedKmh: 12,
        cloudCoverPercent: 95,
        conditionText: 'Rain likely',
        timestamp: new Date().toISOString(),
        isMock: false,
        forecastRainfallMm: 12.0,
        observedRainfallMm: 0.0
      }
    };

    it('postpones watering for exposed outdoor space on forecast rain with explicit reevaluation period without auto-completing task', () => {
      const plantInstance: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-exposed-tomato',
        spaceId: exposedSpace.id,
        lastWateredAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      };

      const recs = careEngine.generateRecommendations(
        exposedSpace,
        [plantInstance],
        [],
        new Date(),
        rainyEnvContext
      );

      const postponeRec = recs.find((r) => r.isPostponedOrSuppressed);
      expect(postponeRec).toBeDefined();
      expect(postponeRec?.actionTitle).toContain('Hold off watering');
      expect(postponeRec?.classification).toBe('no_action_needed');
      expect(postponeRec?.reevaluateAt).toBeDefined();
      expect(postponeRec?.weatherReason).toContain('Rain forecast');

      // Task synchronization: task must be marked 'postponed' and NOT completed
      const existingTask: AdaptiveCareTask = {
        id: 'task-watering-1',
        spaceId: exposedSpace.id,
        plantInstanceId: plantInstance.instanceId,
        category: 'watering',
        title: 'Water tomato',
        description: 'Water at base',
        priority: 'high',
        status: 'due',
        estimatedMinutes: 3,
        createdAt: new Date().toISOString()
      };

      const synchronized = careEngine.synchronizeTasksFromRecommendations(
        [existingTask],
        recs,
        exposedSpace
      );

      const task = synchronized.find((t) => t.id === 'task-watering-1');
      expect(task).toBeDefined();
      expect(task?.status).toBe('postponed');
      expect(task?.isPostponed).toBe(true);
      expect(task?.reevaluateAt).toBeDefined();
      expect(task?.status).not.toBe('completed'); // MUST NOT be marked completed
    });

    it('does NOT postpone watering for roofed/sheltered balcony or indoor plant when rain is forecast', () => {
      const shelteredPlant: GardenPlant = {
        plantId: mint.id,
        plant: mint,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-sheltered-mint',
        spaceId: shelteredSpace.id,
        lastWateredAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString()
      };

      const indoorPlant: GardenPlant = {
        plantId: tulsi.id,
        plant: tulsi,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-indoor-tulsi',
        spaceId: indoorSpace.id,
        lastWateredAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString()
      };

      // 1. Test Sheltered Space
      const shelteredRecs = careEngine.generateRecommendations(
        shelteredSpace,
        [shelteredPlant],
        [],
        new Date(),
        rainyEnvContext
      );
      const shelteredWaterRec = shelteredRecs.find((r) => r.category === 'watering');
      expect(shelteredWaterRec?.isPostponedOrSuppressed).toBeFalsy();
      expect(shelteredRecs.some((r) => r.isPostponedOrSuppressed)).toBe(false);

      // 2. Test Indoor Space
      const indoorRecs = careEngine.generateRecommendations(
        indoorSpace,
        [indoorPlant],
        [],
        new Date(),
        rainyEnvContext
      );
      expect(indoorRecs.some((r) => r.isPostponedOrSuppressed)).toBe(false);
    });

    it('recommends root-zone inspection when soil is critically dry even if rain is forecast in an exposed space', () => {
      const parchedPlant: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-parched-tomato',
        spaceId: exposedSpace.id
      };

      // Soil moisture sensor telemetry is critically dry (< 25%)
      const dryObs: EnvironmentalObservation = {
        id: 'obs-dry-1',
        spaceId: exposedSpace.id,
        type: 'soil_moisture',
        value: 14,
        unit: '%',
        timestamp: new Date().toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      };

      const recs = careEngine.generateRecommendations(
        exposedSpace,
        [parchedPlant],
        [dryObs],
        new Date(),
        rainyEnvContext
      );

      const inspectionRec = recs.find((r) => r.category === 'inspection');
      expect(inspectionRec).toBeDefined();
      expect(inspectionRec?.classification).toBe('needs_inspection');
      expect(inspectionRec?.actionTitle).toContain('Check root-zone moisture');
      expect(inspectionRec?.reason).toContain('forecast rain does not guarantee adequate root-zone moisture');
    });

    it('recommends topsoil moisture penetration check when rain was actually observed', () => {
      const observedRainEnv: EnvironmentalContext = {
        location: { city: 'Bengaluru', state: '', country: 'India' },
        source: 'open_meteo_live',
        confidence: 'measured_live',
        timestamp: new Date().toISOString(),
        snapshot: {
          temperatureC: 22,
          minTemperatureC: 18,
          maxTemperatureC: 25,
          humidityPercent: 92,
          precipitationProbabilityPercent: 20,
          rainfallMm: 6.5,
          observedRainfallMm: 6.5,
          windSpeedKmh: 8,
          cloudCoverPercent: 70,
          conditionText: 'Recent showers',
          timestamp: new Date().toISOString(),
          isMock: false
        }
      };

      const plantInstance: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-rain-tomato',
        spaceId: exposedSpace.id
      };

      const recs = careEngine.generateRecommendations(
        exposedSpace,
        [plantInstance],
        [],
        new Date(),
        observedRainEnv
      );

      const rainCheckRec = recs.find((r) => r.actionTitle.includes('Check rain penetration'));
      expect(rainCheckRec).toBeDefined();
      expect(rainCheckRec?.classification).toBe('needs_inspection');
      expect(rainCheckRec?.reason).toContain('6.5mm');
    });
  });

  describe('2.4 Sensor Freshness Validation & Stale Telemetry Handling', () => {
    it('flags soil moisture reading older than 24h as stale and recommends manual 1-inch finger check', () => {
      const plantInstance: GardenPlant = {
        plantId: mint.id,
        plant: mint,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-stale-test',
        spaceId: shelteredSpace.id
      };

      // 30 hour old reading
      const staleObs: EnvironmentalObservation = {
        id: 'obs-stale-moisture',
        spaceId: shelteredSpace.id,
        type: 'soil_moisture',
        value: 65,
        unit: '%',
        timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      };

      const recs = careEngine.generateRecommendations(
        shelteredSpace,
        [plantInstance],
        [staleObs]
      );

      const staleRec = recs.find((r) => r.id.includes('rec-stale-sensor'));
      expect(staleRec).toBeDefined();
      expect(staleRec?.classification).toBe('needs_inspection');
      expect(staleRec?.actionTitle).toContain('Perform manual soil check');
      expect(staleRec?.reason).toContain('older than 24 hours');
      expect(staleRec?.missingEvidence).toContain('Fresh soil moisture reading (< 24h old)');
    });
  });

  describe('2.5 Plant-Specific Temperature Thresholds & Extreme Weather', () => {
    it('recommends shade and mulch instead of overwatering when high heat occurs but soil moisture is adequate', () => {
      const plantInstance: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-hot-tomato',
        spaceId: exposedSpace.id
      };

      // High ambient temperature: 38°C
      const hotWeatherContext: EnvironmentalContext = {
        location: { city: 'Nagpur', state: '', country: 'India' },
        source: 'open_meteo_live',
        confidence: 'measured_live',
        timestamp: new Date().toISOString(),
        snapshot: {
          temperatureC: 38,
          minTemperatureC: 28,
          maxTemperatureC: 39,
          humidityPercent: 35,
          precipitationProbabilityPercent: 0,
          rainfallMm: 0,
          windSpeedKmh: 10,
          cloudCoverPercent: 5,
          conditionText: 'Clear sky',
          timestamp: new Date().toISOString(),
          isMock: false
        }
      };

      // Active fresh sensor confirms soil moisture is adequate (55%)
      const moistObs: EnvironmentalObservation = {
        id: 'obs-moist-heat',
        spaceId: exposedSpace.id,
        type: 'soil_moisture',
        value: 55,
        unit: '%',
        timestamp: new Date().toISOString(),
        source: 'connected_sensor',
        dataQuality: 'valid'
      };

      const recs = careEngine.generateRecommendations(
        exposedSpace,
        [plantInstance],
        [moistObs],
        new Date(),
        hotWeatherContext
      );

      const shadeRec = recs.find((r) => r.category === 'protection' && r.actionTitle.includes('shade'));
      expect(shadeRec).toBeDefined();
      expect(shadeRec?.classification).toBe('recommended');
      expect(shadeRec?.reason).toContain('do not overwater');
      // Must NOT generate a watering task
      expect(recs.some((r) => r.category === 'watering' && r.classification === 'recommended')).toBe(false);
    });

    it('generates cold protection recommendation when forecast low drops below plant minimum threshold', () => {
      const tropicalPlant: GardenPlant = {
        plantId: tulsi.id,
        plant: tulsi,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-cold-tulsi',
        spaceId: exposedSpace.id
      };

      const coldWeatherContext: EnvironmentalContext = {
        location: { city: 'Ludhiana', state: '', country: 'India' },
        source: 'open_meteo_live',
        confidence: 'measured_live',
        timestamp: new Date().toISOString(),
        snapshot: {
          temperatureC: 9,
          minTemperatureC: 6,
          maxTemperatureC: 15,
          humidityPercent: 60,
          precipitationProbabilityPercent: 0,
          rainfallMm: 0,
          windSpeedKmh: 12,
          cloudCoverPercent: 20,
          conditionText: 'Cold clear night',
          timestamp: new Date().toISOString(),
          isMock: false
        }
      };

      const recs = careEngine.generateRecommendations(
        exposedSpace,
        [tropicalPlant],
        [],
        new Date(),
        coldWeatherContext
      );

      const coldRec = recs.find((r) => r.category === 'protection' && r.actionTitle.includes('cold'));
      expect(coldRec).toBeDefined();
      expect(coldRec?.priority).toBe('high');
      expect(coldRec?.actionInstructions).toContain('frost cloth');
    });

    it('generates wind protection recommendation for exposed space during high winds', () => {
      const plantInstance: GardenPlant = {
        plantId: tomato.id,
        plant: tomato,
        addedAt: new Date().toISOString(),
        status: 'growing',
        instanceId: 'inst-wind-tomato',
        spaceId: exposedSpace.id
      };

      const windyWeatherContext: EnvironmentalContext = {
        location: { city: 'CoastalCity', state: '', country: 'India' },
        source: 'open_meteo_live',
        confidence: 'measured_live',
        timestamp: new Date().toISOString(),
        snapshot: {
          temperatureC: 26,
          minTemperatureC: 22,
          maxTemperatureC: 28,
          humidityPercent: 75,
          precipitationProbabilityPercent: 10,
          rainfallMm: 0,
          windSpeedKmh: 42, // High winds
          cloudCoverPercent: 40,
          conditionText: 'Windy gale',
          timestamp: new Date().toISOString(),
          isMock: false
        }
      };

      const recs = careEngine.generateRecommendations(
        exposedSpace,
        [plantInstance],
        [],
        new Date(),
        windyWeatherContext
      );

      const windRec = recs.find((r) => r.actionTitle.includes('high winds'));
      expect(windRec).toBeDefined();
      expect(windRec?.priority).toBe('high');
      expect(windRec?.reason).toContain('42 km/h');
    });
  });

  describe('2.6 Garden Doctor Environmental Evidence Integration', () => {
    it('uses environmental context as supporting evidence and NOT proof of plant disease', () => {
      const hotWeatherContext: EnvironmentalContext = {
        location: { city: 'Delhi', state: '', country: 'India' },
        source: 'open_meteo_live',
        confidence: 'measured_live',
        timestamp: new Date().toISOString(),
        snapshot: {
          temperatureC: 38,
          minTemperatureC: 27,
          maxTemperatureC: 40,
          humidityPercent: 30,
          precipitationProbabilityPercent: 0,
          rainfallMm: 0,
          windSpeedKmh: 10,
          cloudCoverPercent: 0,
          conditionText: 'Hot',
          timestamp: new Date().toISOString(),
          isMock: false
        }
      };

      const report = diagnosticEngine.diagnose({
        space: exposedSpace,
        plant: tomato,
        symptoms: {
          primarySymptom: 'wilting',
          affectedPart: 'whole_plant',
          userNotes: 'Leaves are drooping in the afternoon'
        },
        environmentalContext: hotWeatherContext
      });

      const underwateringCause = report.rankedCauses.find((c) => c.id === 'cause-underwatering');
      expect(underwateringCause).toBeDefined();

      const weatherEvidence = underwateringCause?.supportingEvidence.find((e) =>
        e.description.includes('Ambient weather temperature')
      );
      expect(weatherEvidence).toBeDefined();
      expect(weatherEvidence?.description).toContain('Weather is supporting context, not proof of disease');
    });
  });
});
