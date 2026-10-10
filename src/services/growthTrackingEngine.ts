import {
  PlantCategory,
  PlantLifecycleStage,
  PlantHeightMeasurement
} from '../types';

export interface GrowthComparisonResult {
  daysElapsed: number;
  stageTransition?: {
    from: PlantLifecycleStage;
    to: PlantLifecycleStage;
  };
  heightDeltaCm?: number;
  growthRateCmPerDay?: number;
  qualitativeSummary: string;
  perspectiveDisclaimer?: string;
  confidence: 'calibrated' | 'qualitative_only';
}

export class GrowthTrackingEngine {
  /**
   * Returns standard lifecycle stages tailored to plant category
   */
  getLifecycleStagesForCategory(category?: PlantCategory): PlantLifecycleStage[] {
    switch (category) {
      case 'vegetables':
        return ['planned', 'seeded', 'germinated', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'];
      case 'fruits':
        return ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest', 'dormant'];
      case 'herbs':
        return ['planned', 'seeded', 'germinated', 'seedling', 'vegetative', 'harvest', 'flowering'];
      case 'flowers':
        return ['planned', 'seeded', 'germinated', 'seedling', 'vegetative', 'flowering', 'dormant'];
      case 'indoor':
      case 'succulents':
        return ['seedling', 'vegetative', 'dormant'];
      default:
        return ['planned', 'seeded', 'germinated', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest', 'dormant'];
    }
  }

  /**
   * Deterministic growth comparison between two historical observations or photos
   */
  compareObservations(
    earlier: {
      occurredAt: string;
      stage?: PlantLifecycleStage;
      heightCm?: number;
      mediaId?: string;
    },
    later: {
      occurredAt: string;
      stage?: PlantLifecycleStage;
      heightCm?: number;
      mediaId?: string;
    }
  ): GrowthComparisonResult {
    const earlyTime = new Date(earlier.occurredAt).getTime();
    const lateTime = new Date(later.occurredAt).getTime();

    // Days elapsed calculation
    const diffMs = Math.max(0, lateTime - earlyTime);
    const daysElapsed = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let heightDeltaCm: number | undefined = undefined;
    let growthRateCmPerDay: number | undefined = undefined;

    if (earlier.heightCm !== undefined && later.heightCm !== undefined) {
      heightDeltaCm = parseFloat((later.heightCm - earlier.heightCm).toFixed(1));
      if (daysElapsed > 0) {
        growthRateCmPerDay = parseFloat((heightDeltaCm / daysElapsed).toFixed(2));
      }
    }

    const stageTransition =
      earlier.stage && later.stage && earlier.stage !== later.stage
        ? { from: earlier.stage, to: later.stage }
        : undefined;

    // Build honest qualitative assessment without false vision certainty
    let qualitativeSummary = '';
    if (stageTransition) {
      qualitativeSummary = `Progressed from ${stageTransition.from} to ${stageTransition.to} over ${daysElapsed} days.`;
    } else if (heightDeltaCm !== undefined) {
      if (heightDeltaCm > 0) {
        qualitativeSummary = `Measured growth of +${heightDeltaCm}cm (${growthRateCmPerDay ?? 0} cm/day) over ${daysElapsed} days.`;
      } else if (heightDeltaCm === 0) {
        qualitativeSummary = `Height stable at ${later.heightCm}cm over ${daysElapsed} days.`;
      } else {
        qualitativeSummary = `Height adjusted or trimmed by ${Math.abs(heightDeltaCm)}cm over ${daysElapsed} days.`;
      }
    } else {
      qualitativeSummary = `Observations recorded ${daysElapsed} days apart. Plant continues in ${later.stage || 'active'} stage.`;
    }

    // Honest perspective disclaimer when comparing photos
    const hasPhotos = Boolean(earlier.mediaId || later.mediaId);
    const perspectiveDisclaimer = hasPhotos
      ? 'Camera angle, zoom, and framing differ between captures. Growth comparison is qualitative and visual percentage claims are avoided without calibrated markers.'
      : undefined;

    return {
      daysElapsed,
      stageTransition,
      heightDeltaCm,
      growthRateCmPerDay,
      qualitativeSummary,
      perspectiveDisclaimer,
      confidence: heightDeltaCm !== undefined ? 'calibrated' : 'qualitative_only'
    };
  }

  /**
   * Computes latest height and growth trend from user measurements
   */
  analyzeHeightMeasurements(measurements: PlantHeightMeasurement[]): {
    latestHeightCm?: number;
    totalGrowthCm?: number;
    averageRateCmPerDay?: number;
    measurementCount: number;
  } {
    if (!measurements || measurements.length === 0) {
      return { measurementCount: 0 };
    }

    // Sort chronologically
    const sorted = [...measurements].sort(
      (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const measurementCount = sorted.length;

    if (sorted.length === 1) {
      return {
        latestHeightCm: last.heightCm,
        measurementCount: 1
      };
    }

    const totalGrowthCm = parseFloat((last.heightCm - first.heightCm).toFixed(1));
    const firstTime = new Date(first.measuredAt).getTime();
    const lastTime = new Date(last.measuredAt).getTime();
    const days = Math.max(1, Math.round((lastTime - firstTime) / (1000 * 60 * 60 * 24)));
    const averageRateCmPerDay = parseFloat((totalGrowthCm / days).toFixed(2));

    return {
      latestHeightCm: last.heightCm,
      totalGrowthCm,
      averageRateCmPerDay,
      measurementCount
    };
  }
}

export const growthTrackingEngine = new GrowthTrackingEngine();
