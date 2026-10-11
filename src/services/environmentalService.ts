import {
  EnvironmentalObservation,
  EnvironmentalMeasurementType,
  EnvironmentalSummary,
  PlantEnvironmentalInsight,
  SensorDevice,
  GardenPlant
} from '../types';
import { validateEnvironmentalObservation } from './environmentalValidation';
import { secureIds } from '../utils/secureId';

export interface ObservationFilterOptions {
  spaceId?: string;
  plantInstanceId?: string;
  type?: EnvironmentalMeasurementType;
  source?: string;
  sensorId?: string;
  startDate?: string;
  endDate?: string;
}

export class EnvironmentalService {
  /**
   * Validates and ingests a new environmental observation.
   * Performs deduplication: ignores identical readings within a 30-second window.
   */
  ingestObservation(
    existingObservations: EnvironmentalObservation[],
    candidate: Partial<EnvironmentalObservation>
  ): { success: boolean; observation?: EnvironmentalObservation; errors?: string[] } {
    const validation = validateEnvironmentalObservation(candidate);

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const obsTimestamp = candidate.timestamp || new Date().toISOString();
    const candidateTime = new Date(obsTimestamp).getTime();

    // Duplicate detection: check if same space, type, value, and sensor occurred within 30 seconds
    const isDuplicate = existingObservations.some((existing) => {
      if (existing.spaceId !== candidate.spaceId) return false;
      if (existing.type !== candidate.type) return false;
      if (existing.value !== candidate.value) return false;
      if ((existing.sensorId || '') !== (candidate.sensorId || '')) return false;

      const diffMs = Math.abs(new Date(existing.timestamp).getTime() - candidateTime);
      return diffMs < 30 * 1000;
    });

    if (isDuplicate) {
      return {
        success: false,
        errors: ['Duplicate observation detected within 30-second window with identical value and sensor.']
      };
    }

    const observation: EnvironmentalObservation = {
      id: candidate.id || secureIds.envObs(),
      spaceId: candidate.spaceId!,
      plantInstanceId: candidate.plantInstanceId,
      type: candidate.type!,
      value: candidate.value!,
      unit: candidate.unit!,
      timestamp: obsTimestamp,
      source: candidate.source || 'manual',
      sensorId: candidate.sensorId,
      calibration: candidate.calibration,
      dataQuality: 'valid',
      validationErrors: [],
      notes: candidate.notes
    };

    return { success: true, observation };
  }

  /**
   * Filters and sorts observations chronologically (most recent first).
   */
  filterObservations(
    observations: EnvironmentalObservation[],
    filters: ObservationFilterOptions = {}
  ): EnvironmentalObservation[] {
    return observations
      .filter((obs) => {
        if (filters.spaceId && obs.spaceId !== filters.spaceId) return false;
        if (filters.plantInstanceId && obs.plantInstanceId !== filters.plantInstanceId) return false;
        if (filters.type && obs.type !== filters.type) return false;
        if (filters.source && obs.source !== filters.source) return false;
        if (filters.sensorId && obs.sensorId !== filters.sensorId) return false;
        if (filters.startDate) {
          if (new Date(obs.timestamp).getTime() < new Date(filters.startDate).getTime()) return false;
        }
        if (filters.endDate) {
          if (new Date(obs.timestamp).getTime() > new Date(filters.endDate).getTime()) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Retrieves the most recent valid observation for a given space and type.
   */
  getLatestObservation(
    observations: EnvironmentalObservation[],
    spaceId: string,
    type: EnvironmentalMeasurementType,
    plantInstanceId?: string
  ): EnvironmentalObservation | null {
    const filtered = this.filterObservations(observations, { spaceId, type, plantInstanceId });
    return filtered.length > 0 ? filtered[0] : null;
  }

  /**
   * Calculates statistical summary for a measurement type across observations.
   * Marks summary as stale if latest reading is older than 24 hours.
   */
  calculateSummary(
    observations: EnvironmentalObservation[],
    type: EnvironmentalMeasurementType,
    spaceId?: string
  ): EnvironmentalSummary | null {
    const validObs = observations.filter(
      (o) => o.type === type && o.dataQuality === 'valid' && (!spaceId || o.spaceId === spaceId)
    );

    if (validObs.length === 0) {
      return null;
    }

    const sorted = [...validObs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latest = sorted[0];

    const values = validObs.map((o) => o.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;

    const ageHours = (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60);
    const isStale = ageHours > 24;

    return {
      type,
      unit: latest.unit,
      min,
      max,
      avg,
      latestValue: latest.value,
      latestTimestamp: latest.timestamp,
      count: validObs.length,
      isStale
    };
  }

  /**
   * Registers a new sensor device with validation.
   */
  registerDevice(
    existingDevices: SensorDevice[],
    device: Partial<SensorDevice>
  ): { success: boolean; device?: SensorDevice; error?: string } {
    if (!device.name || device.name.trim() === '') {
      return { success: false, error: 'Device name is required.' };
    }
    if (!device.spaceId) {
      return { success: false, error: 'Device must be assigned to a garden space.' };
    }
    if (existingDevices.some((d) => d.name.toLowerCase() === device.name?.trim().toLowerCase() && d.spaceId === device.spaceId)) {
      return { success: false, error: 'A sensor device with this name already exists in this space.' };
    }
    if (!device.supportedTypes || device.supportedTypes.length === 0) {
      return { success: false, error: 'Device must specify at least one supported measurement type.' };
    }

    const id = device.id || secureIds.device();
    const newDevice: SensorDevice = {
      id,
      name: device.name.trim(),
      type: device.type || 'soil_sensor',
      spaceId: device.spaceId,
      supportedTypes: device.supportedTypes,
      lastSeenAt: device.lastSeenAt || new Date().toISOString(),
      status: device.status || 'active',
      hardwareDetails: device.hardwareDetails || { protocol: 'manual' },
      registeredAt: device.registeredAt || new Date().toISOString()
    };

    return { success: true, device: newDevice };
  }

  /**
   * Compares real environmental observations with documented plant requirements
   * and generates explainable, transparent insights.
   */
  generatePlantEnvironmentalInsights(
    plants: GardenPlant[],
    spaceId: string,
    observations: EnvironmentalObservation[]
  ): PlantEnvironmentalInsight[] {
    const insights: PlantEnvironmentalInsight[] = [];
    const spaceObs = observations.filter((o) => o.spaceId === spaceId && o.dataQuality === 'valid');

    // Retrieve latest air temperature
    const latestAirTemp = this.getLatestObservation(spaceObs, spaceId, 'air_temperature');
    // Retrieve latest soil moisture
    const latestSoilMoisture = this.getLatestObservation(spaceObs, spaceId, 'soil_moisture');

    const now = Date.now();

    plants.forEach((gp) => {
      const plant = gp.plant;
      const targetPlantInstanceId = gp.instanceId;
      const provenanceSource =
        plant.dataQuality?.sources?.[0]?.name || 'ICAR Horticultural Crop Guidelines';

      // 1. Temperature Comparison against plant requirements
      if (latestAirTemp && plant.temperatureRequirements) {
        const temp = latestAirTemp.value;
        const tempReq = plant.temperatureRequirements;
        const ageHours = (now - new Date(latestAirTemp.timestamp).getTime()) / (1000 * 60 * 60);
        const freshnessNote = ageHours > 24 ? ' (Note: observation is older than 24h)' : '';

        // Extreme heat above documented maxC
        if (tempReq.maxC !== undefined && temp > tempReq.maxC) {
          insights.push({
            id: `insight-heat-stress-${gp.instanceId || plant.id}`,
            plantInstanceId: targetPlantInstanceId,
            spaceId,
            title: `Heat Stress Risk for ${plant.name}`,
            description: `Measured temperature of ${temp}°C exceeds documented heat threshold of ${tempReq.maxC}°C${freshnessNote}. Transpiration loss increases significantly in small containers.`,
            supportingObservationIds: [latestAirTemp.id],
            referencedRequirement: {
              requirement: `Maximum tolerance: ${tempReq.maxC}°C (Optimal: ${tempReq.optimalMinC ?? '—'}–${tempReq.optimalMaxC ?? '—'}°C)`,
              source: provenanceSource
            },
            evidenceQuality: ageHours <= 24 ? 'verified_evidence' : 'reviewed_guidance',
            severity: 'alert',
            recommendedNextStep:
              'Provide afternoon shade or shift container to a cooler spot. Check soil dampness at the base.',
            createdAt: new Date().toISOString()
          });
        }
        // Extreme cold below documented minC
        else if (tempReq.minC !== undefined && temp < tempReq.minC) {
          insights.push({
            id: `insight-cold-stress-${gp.instanceId || plant.id}`,
            plantInstanceId: targetPlantInstanceId,
            spaceId,
            title: `Chilling Temperature Warning for ${plant.name}`,
            description: `Measured temperature of ${temp}°C is below documented lower threshold of ${tempReq.minC}°C${freshnessNote}. Growth slows and tropical roots become vulnerable.`,
            supportingObservationIds: [latestAirTemp.id],
            referencedRequirement: {
              requirement: `Minimum tolerance: ${tempReq.minC}°C (Optimal: ${tempReq.optimalMinC ?? '—'}–${tempReq.optimalMaxC ?? '—'}°C)`,
              source: provenanceSource
            },
            evidenceQuality: ageHours <= 24 ? 'verified_evidence' : 'reviewed_guidance',
            severity: 'warning',
            recommendedNextStep:
              'Shield plant from night drafts or move indoors/under covered eaves until temperatures rise.',
            createdAt: new Date().toISOString()
          });
        }
        // Approaching peak heat (between optimalMaxC and maxC)
        else if (tempReq.optimalMaxC !== undefined && temp > tempReq.optimalMaxC) {
          insights.push({
            id: `insight-warm-watch-${gp.instanceId || plant.id}`,
            plantInstanceId: targetPlantInstanceId,
            spaceId,
            title: `Warm Growth Window for ${plant.name}`,
            description: `Measured temperature of ${temp}°C is above optimal range (${tempReq.optimalMinC ?? 18}–${tempReq.optimalMaxC}°C)${freshnessNote}. Container moisture will evaporate faster.`,
            supportingObservationIds: [latestAirTemp.id],
            referencedRequirement: {
              requirement: `Optimal range: ${tempReq.optimalMinC ?? 18}–${tempReq.optimalMaxC}°C`,
              source: provenanceSource
            },
            evidenceQuality: ageHours <= 24 ? 'verified_evidence' : 'reviewed_guidance',
            severity: 'info',
            recommendedNextStep:
              'Perform a quick 1-inch finger soil test in the morning to confirm moisture.',
            createdAt: new Date().toISOString()
          });
        }
      }

      // 2. Soil Moisture Observations
      if (latestSoilMoisture) {
        const moisture = latestSoilMoisture.value;
        const ageHours = (now - new Date(latestSoilMoisture.timestamp).getTime()) / (1000 * 60 * 60);

        if (moisture < 20) {
          insights.push({
            id: `insight-soil-dry-${gp.instanceId || plant.id}`,
            plantInstanceId: targetPlantInstanceId,
            spaceId,
            title: `Low Soil Moisture Reading (${moisture}%)`,
            description: `Recorded soil moisture for ${plant.name} is low at ${moisture}%. Roots may experience moisture stress if top inch is completely parched.`,
            supportingObservationIds: [latestSoilMoisture.id],
            referencedRequirement: {
              requirement: plant.wateringText || 'Water when top 1 inch feels dry.',
              source: provenanceSource
            },
            evidenceQuality: ageHours <= 12 ? 'verified_evidence' : 'reviewed_guidance',
            severity: 'warning',
            recommendedNextStep:
              'Confirm with a 1-inch finger test. If dry, water gently at the base until drainage holes weep.',
            createdAt: new Date().toISOString()
          });
        } else if (moisture > 80) {
          insights.push({
            id: `insight-soil-saturated-${gp.instanceId || plant.id}`,
            plantInstanceId: targetPlantInstanceId,
            spaceId,
            title: `Saturated Soil Reading (${moisture}%)`,
            description: `Soil moisture for ${plant.name} is high at ${moisture}%. Prolonged saturated soil deprives roots of oxygen.`,
            supportingObservationIds: [latestSoilMoisture.id],
            referencedRequirement: {
              requirement: 'Requires good drainage; avoid waterlogged roots.',
              source: provenanceSource
            },
            evidenceQuality: ageHours <= 12 ? 'verified_evidence' : 'reviewed_guidance',
            severity: 'info',
            recommendedNextStep:
              'Do not add water. Ensure drainage hole is unblocked and saucer is drained.',
            createdAt: new Date().toISOString()
          });
        }
      }

      // 3. Missing Environmental Evidence Note
      if (!latestAirTemp && !latestSoilMoisture) {
        insights.push({
          id: `insight-no-env-${gp.instanceId || plant.id}`,
          plantInstanceId: targetPlantInstanceId,
          spaceId,
          title: `No Recent Sensor or Manual Readings for ${plant.name}`,
          description: `No physical temperature or soil moisture readings have been recorded for ${spaceId}. Relying on general baseline horticultural guidance.`,
          supportingObservationIds: [],
          referencedRequirement: {
            requirement: plant.wateringText || 'Baseline care guidance',
            source: provenanceSource
          },
          evidenceQuality: 'insufficient_data',
          severity: 'info',
          recommendedNextStep:
            'Log a quick manual temperature or soil check in the Environment tab to unlock real physical insights.',
          createdAt: new Date().toISOString()
        });
      }
    });

    return insights;
  }
}

export const environmentalService = new EnvironmentalService();
