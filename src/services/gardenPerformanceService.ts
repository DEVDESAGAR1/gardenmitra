import {
  Garden,
  GardenSpace,
  PlantCategory,
  PlantLifecycleStage,
  CareActionCategory,
  AdaptiveCareTask,
  DiagnosisRecord,
  EnvironmentalObservation,
  EnvironmentalContext,
  PlantSymptom,
  PerformanceTimeWindow,
  ExplainablePerformanceInsight,
  PlantInventorySummary,
  LifecycleMilestonesSummary,
  LifecycleMilestoneEvent,
  GrowthAnalyticsSummary,
  PlantGrowthRateItem,
  CareActivitySummary,
  HealthRecoverySummary,
  GardenPerformanceReport
} from '../types';

export interface PerformanceReportParams {
  garden: Garden | null;
  spaces: GardenSpace[];
  selectedSpaceId?: string | null;
  selectedPlantInstanceId?: string | null;
  timeWindow?: PerformanceTimeWindow;
  adaptiveCareTasks?: AdaptiveCareTask[];
  diagnosisHistory?: DiagnosisRecord[];
  environmentalObservations?: EnvironmentalObservation[];
  environmentalContext?: EnvironmentalContext | null;
}

export class GardenPerformanceService {
  /**
   * Generates a fully deterministic, explainable Garden Performance Report.
   * Strictly computes metrics from persisted garden history.
   */
  generatePerformanceReport(params: PerformanceReportParams): GardenPerformanceReport {
    const {
      spaces = [],
      selectedSpaceId = null,
      selectedPlantInstanceId = null,
      timeWindow = 'all_time',
      adaptiveCareTasks = [],
      diagnosisHistory = [],
      environmentalObservations = [],
      environmentalContext = null
    } = params;

    const filteredSpaces = selectedSpaceId
      ? spaces.filter((s) => s.id === selectedSpaceId)
      : spaces;

    const inventory = this.calculateInventorySummary(filteredSpaces);
    const lifecycle = this.calculateLifecycleSummary(filteredSpaces, selectedPlantInstanceId);
    const growth = this.calculateGrowthSummary(filteredSpaces, selectedPlantInstanceId);
    const care = this.calculateCareActivitySummary(adaptiveCareTasks, filteredSpaces, selectedSpaceId, timeWindow);
    const health = this.calculateHealthRecoverySummary(diagnosisHistory, selectedSpaceId);

    const hasHistoricalWeather = false; // Weather API only provides live & 5-day forecast; historical database not stored
    const historicalWeatherNote =
      'Historical weather archive is not stored locally. Only current telemetry snapshots and live forecasts are available.';

    const insights = this.generateExplainableInsights({
      inventory,
      lifecycle,
      growth,
      care,
      health,
      spaces: filteredSpaces,
      environmentalObservations,
      environmentalContext,
      hasHistoricalWeather
    });

    return {
      generatedAt: new Date().toISOString(),
      timeWindow,
      spaceFilterId: selectedSpaceId || undefined,
      inventory,
      lifecycle,
      growth,
      care,
      health,
      insights,
      hasHistoricalWeather,
      historicalWeatherNote
    };
  }

  /**
   * 3.3 Garden inventory and lifecycle analytics
   */
  calculateInventorySummary(spaces: GardenSpace[]): PlantInventorySummary {
    const byCategory: Record<PlantCategory, number> = {
      herbs: 0,
      vegetables: 0,
      flowers: 0,
      fruits: 0,
      indoor: 0,
      succulents: 0,
      native: 0,
      other: 0
    };

    let activeCount = 0;
    let plannedCount = 0;
    let harvestedCount = 0;
    let removedCount = 0;

    const bySpace: Array<{ spaceId: string; spaceName: string; count: number }> = [];

    spaces.forEach((space) => {
      let spacePlantCount = 0;
      (space.plants || []).forEach((gp) => {
        spacePlantCount++;
        const cat = gp.plant?.category || 'other';
        byCategory[cat] = (byCategory[cat] || 0) + 1;

        if (gp.status === 'planted' || gp.status === 'growing') {
          activeCount++;
        } else if (gp.status === 'planning') {
          plannedCount++;
        } else if (gp.status === 'harvested') {
          harvestedCount++;
        }

        if (gp.lifecycleStage === 'removed') {
          removedCount++;
        }
      });

      bySpace.push({
        spaceId: space.id,
        spaceName: space.name,
        count: spacePlantCount
      });
    });

    const totalPlants = activeCount + plannedCount + harvestedCount;

    return {
      totalPlants,
      activeCount,
      plannedCount,
      harvestedCount,
      removedCount,
      byCategory,
      bySpace
    };
  }

  /**
   * Calculates recorded lifecycle milestone progression and stage distributions.
   */
  calculateLifecycleSummary(
    spaces: GardenSpace[],
    plantInstanceIdFilter?: string | null
  ): LifecycleMilestonesSummary {
    const stageCounts: Record<PlantLifecycleStage, number> = {
      planned: 0,
      seeded: 0,
      germinated: 0,
      seedling: 0,
      vegetative: 0,
      flowering: 0,
      fruiting: 0,
      harvest: 0,
      dormant: 0,
      declining: 0,
      removed: 0,
      unknown: 0
    };

    const milestoneTimeline: LifecycleMilestoneEvent[] = [];
    let confirmedMilestonesCount = 0;
    let inferredMilestonesCount = 0;

    spaces.forEach((space) => {
      (space.plants || []).forEach((gp) => {
        const instanceId = gp.instanceId || `inst-${gp.plantId}`;
        if (plantInstanceIdFilter && instanceId !== plantInstanceIdFilter) {
          return;
        }

        const stage = gp.lifecycleStage || 'vegetative';
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;

        // Process explicit lifecycle history
        if (gp.lifecycleHistory && gp.lifecycleHistory.length > 0) {
          gp.lifecycleHistory.forEach((hist) => {
            const isUser = hist.source === 'user';
            if (isUser) confirmedMilestonesCount++;
            else inferredMilestonesCount++;

            milestoneTimeline.push({
              plantInstanceId: instanceId,
              plantName: gp.plant.name,
              stage: hist.stage,
              date: hist.transitionedAt,
              source: hist.source,
              isConfirmed: isUser
            });
          });
        }

        // Process journal entries for milestones
        if (gp.journalEntries && gp.journalEntries.length > 0) {
          gp.journalEntries.forEach((entry) => {
            if (
              entry.type === 'stage_changed' ||
              entry.type === 'planted' ||
              entry.type === 'flowering' ||
              entry.type === 'harvested'
            ) {
              const mappedStage: PlantLifecycleStage =
                entry.stage ||
                (entry.type === 'planted'
                  ? 'seedling'
                  : entry.type === 'flowering'
                  ? 'flowering'
                  : entry.type === 'harvested'
                  ? 'harvest'
                  : 'vegetative');

              const isUser = entry.source === 'user';
              if (isUser) confirmedMilestonesCount++;
              else inferredMilestonesCount++;

              milestoneTimeline.push({
                plantInstanceId: instanceId,
                plantName: gp.plant.name,
                stage: mappedStage,
                date: entry.occurredAt || entry.recordedAt,
                source: entry.source === 'user' ? 'user' : 'care_engine',
                isConfirmed: isUser
              });
            }
          });
        }
      });
    });

    // Sort timeline chronologically (latest first)
    milestoneTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      stageCounts,
      milestoneTimeline,
      confirmedMilestonesCount,
      inferredMilestonesCount
    };
  }

  /**
   * 3.4 Growth and measurement analytics
   * Strictly computes physical growth rates only when >= 2 dated measurements exist.
   */
  calculateGrowthSummary(
    spaces: GardenSpace[],
    plantInstanceIdFilter?: string | null
  ): GrowthAnalyticsSummary {
    let totalObservations = 0;
    let totalHeightMeasurements = 0;
    let plantsWithMeasurements = 0;
    let plantsWithSufficientData = 0;

    const plantGrowthRates: PlantGrowthRateItem[] = [];

    spaces.forEach((space) => {
      (space.plants || []).forEach((gp) => {
        const instanceId = gp.instanceId || `inst-${gp.plantId}`;
        if (plantInstanceIdFilter && instanceId !== plantInstanceIdFilter) {
          return;
        }

        totalObservations += (gp.journalEntries?.length || 0);

        // Gather all dated height measurements
        const rawMeasurements: Array<{ id: string; heightCm: number; measuredAt: string }> = [];

        // 1. Direct heightMeasurements array
        (gp.heightMeasurements || []).forEach((m) => {
          if (typeof m.heightCm === 'number' && m.heightCm > 0 && m.measuredAt) {
            rawMeasurements.push({
              id: m.id,
              heightCm: m.heightCm,
              measuredAt: m.measuredAt
            });
          }
        });

        // 2. Journal entries containing measured height
        (gp.journalEntries || []).forEach((j) => {
          if (
            j.type === 'height_measured' &&
            typeof j.heightCm === 'number' &&
            j.heightCm > 0 &&
            (j.occurredAt || j.recordedAt)
          ) {
            if (!rawMeasurements.some((m) => m.id === j.id)) {
              rawMeasurements.push({
                id: j.id,
                heightCm: j.heightCm,
                measuredAt: j.occurredAt || j.recordedAt
              });
            }
          }
        });

        // Sort measurements chronologically (oldest to newest)
        rawMeasurements.sort(
          (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
        );

        totalHeightMeasurements += rawMeasurements.length;
        if (rawMeasurements.length > 0) {
          plantsWithMeasurements++;
        }

        if (rawMeasurements.length >= 2) {
          plantsWithSufficientData++;
          const initial = rawMeasurements[0];
          const latest = rawMeasurements[rawMeasurements.length - 1];
          const deltaCm = Math.round((latest.heightCm - initial.heightCm) * 10) / 10;
          const initialMs = new Date(initial.measuredAt).getTime();
          const latestMs = new Date(latest.measuredAt).getTime();
          const daysElapsed = Math.max(1, Math.round((latestMs - initialMs) / (1000 * 3600 * 24)));
          const growthRateCmPerDay =
            Math.round((deltaCm / daysElapsed) * 100) / 100;

          plantGrowthRates.push({
            plantInstanceId: instanceId,
            plantName: gp.plant.name,
            initialHeightCm: initial.heightCm,
            latestHeightCm: latest.heightCm,
            deltaCm,
            daysElapsed,
            growthRateCmPerDay,
            measurementCount: rawMeasurements.length,
            status: 'sufficient_data',
            measurements: rawMeasurements,
            dataLimitations: []
          });
        } else {
          plantGrowthRates.push({
            plantInstanceId: instanceId,
            plantName: gp.plant.name,
            initialHeightCm: rawMeasurements[0]?.heightCm,
            latestHeightCm: rawMeasurements[0]?.heightCm,
            measurementCount: rawMeasurements.length,
            status: 'insufficient_data',
            measurements: rawMeasurements,
            dataLimitations: [
              rawMeasurements.length === 0
                ? 'No dated height measurements recorded yet.'
                : 'Only 1 measurement recorded. At least 2 dated measurements are required to calculate physical growth trends.'
            ]
          });
        }
      });
    });

    return {
      totalObservations,
      totalHeightMeasurements,
      plantsWithMeasurements,
      plantsWithSufficientData,
      plantGrowthRates
    };
  }

  /**
   * 3.5 Care activity analytics
   * Clearly specifies the denominator:
   * Total Eligible Tasks = Completed + Due + Snoozed + Postponed
   * (Dismissed tasks are excluded from the completion denominator).
   */
  calculateCareActivitySummary(
    tasks: AdaptiveCareTask[],
    spaces: GardenSpace[],
    spaceFilterId?: string | null,
    timeWindow: PerformanceTimeWindow = 'all_time'
  ): CareActivitySummary {
    const relevantTasks = tasks.filter((t) => {
      if (spaceFilterId && t.spaceId !== spaceFilterId) return false;

      if (timeWindow === 'last_7_days') {
        const threshold = Date.now() - 7 * 24 * 3600 * 1000;
        return new Date(t.createdAt).getTime() >= threshold;
      }
      if (timeWindow === 'last_30_days') {
        const threshold = Date.now() - 30 * 24 * 3600 * 1000;
        return new Date(t.createdAt).getTime() >= threshold;
      }
      return true;
    });

    const tasksByCategory: Record<CareActionCategory, number> = {
      watering: 0,
      inspection: 0,
      feeding: 0,
      pruning: 0,
      protection: 0,
      milestone_check: 0
    };

    let totalCompletedTasks = 0;
    let totalDueTasks = 0;
    let totalPostponedTasks = 0;
    let totalSnoozedTasks = 0;

    relevantTasks.forEach((t) => {
      if (t.status === 'completed') {
        totalCompletedTasks++;
        tasksByCategory[t.category] = (tasksByCategory[t.category] || 0) + 1;
      } else if (t.status === 'due' || t.status === 'planned' || t.status === 'suggested') {
        totalDueTasks++;
      } else if (t.status === 'postponed') {
        totalPostponedTasks++;
      } else if (t.status === 'snoozed') {
        totalSnoozedTasks++;
      }
    });

    const totalPendingTasks = totalDueTasks + totalPostponedTasks + totalSnoozedTasks;
    const totalEligibleTasks =
      totalCompletedTasks + totalDueTasks + totalPostponedTasks + totalSnoozedTasks;

    const completionRatePercent =
      totalEligibleTasks > 0
        ? Math.round((totalCompletedTasks / totalEligibleTasks) * 100)
        : null;

    // Count journal care events
    let journalCareEventsCount = 0;
    spaces.forEach((s) => {
      if (spaceFilterId && s.id !== spaceFilterId) return;
      (s.plants || []).forEach((gp) => {
        journalCareEventsCount += (gp.careHistory?.length || 0);
        journalCareEventsCount += (gp.journalEntries?.filter((j) => j.type === 'watered' || j.type === 'pruned' || j.type === 'fertilized' || j.type === 'care_action').length || 0);
      });
    });

    return {
      totalCompletedTasks,
      totalPendingTasks,
      totalEligibleTasks,
      completionRatePercent,
      denominatorExplanation:
        'Denominator: Completed + Due + Postponed + Snoozed tasks. Dismissed tasks are excluded.',
      tasksByCategory,
      journalCareEventsCount
    };
  }

  /**
   * 3.6 Plant health and recovery analytics
   */
  calculateHealthRecoverySummary(
    diagnoses: DiagnosisRecord[],
    spaceFilterId?: string | null
  ): HealthRecoverySummary {
    const relevant = diagnoses.filter((d) => {
      if (spaceFilterId && d.report.spaceId !== spaceFilterId) return false;
      return true;
    });

    const outcomes = {
      resolved: 0,
      improved: 0,
      no_change: 0,
      declined: 0,
      pending: 0
    };

    const symptomCounts = new Map<PlantSymptom, number>();
    const plantsWarrantingInspection: Array<{
      plantInstanceId: string;
      plantName: string;
      spaceId: string;
      reason: string;
    }> = [];

    relevant.forEach((d) => {
      const status = d.followUpStatus;
      if (status === 'resolved') outcomes.resolved++;
      else if (status === 'improved') outcomes.improved++;
      else if (status === 'no_change') outcomes.no_change++;
      else if (status === 'declined') outcomes.declined++;
      else outcomes.pending++;

      const sym = d.report.symptoms.primarySymptom;
      symptomCounts.set(sym, (symptomCounts.get(sym) || 0) + 1);

      // Flag plants that warrant attention (e.g. outcome was no_change or declined)
      if (status === 'no_change' || status === 'declined') {
        const plantInstanceId = d.report.plantInstanceId || d.report.plantId || 'unknown';
        if (!plantsWarrantingInspection.some((p) => p.plantInstanceId === plantInstanceId)) {
          plantsWarrantingInspection.push({
            plantInstanceId,
            plantName: d.report.plantName,
            spaceId: d.report.spaceId,
            reason: `Latest health follow-up marked "${status}". Plant warrants renewed visual inspection.`
          });
        }
      }
    });

    const recurringSymptoms: Array<{ symptom: PlantSymptom; count: number }> = [];
    symptomCounts.forEach((count, symptom) => {
      recurringSymptoms.push({ symptom, count });
    });
    recurringSymptoms.sort((a, b) => b.count - a.count);

    const totalFollowUps =
      outcomes.resolved + outcomes.improved + outcomes.no_change + outcomes.declined;

    return {
      totalDiagnoses: relevant.length,
      totalFollowUps,
      outcomes,
      recurringSymptoms,
      plantsWarrantingInspection
    };
  }

  /**
   * 3.8 Explainable Insights Engine
   * Generates deterministic, evidence-linked insights with stable keys and actionable next steps.
   */
  generateExplainableInsights(params: {
    inventory: PlantInventorySummary;
    lifecycle: LifecycleMilestonesSummary;
    growth: GrowthAnalyticsSummary;
    care: CareActivitySummary;
    health: HealthRecoverySummary;
    spaces: GardenSpace[];
    environmentalObservations: EnvironmentalObservation[];
    environmentalContext?: EnvironmentalContext | null;
    hasHistoricalWeather: boolean;
  }): ExplainablePerformanceInsight[] {
    const { inventory, lifecycle, growth, care, health, spaces, environmentalContext } = params;
    const insights: ExplainablePerformanceInsight[] = [];

    // 1. Inventory Insight
    if (inventory.activeCount > 0) {
      insights.push({
        id: 'insight-inventory-active',
        stableKey: `inventory-active-${inventory.activeCount}`,
        category: 'inventory',
        priority: 'info',
        title: `${inventory.activeCount} Living Plants Growing in Garden`,
        explanation: `Your garden currently tracks ${inventory.activeCount} active plants across ${spaces.length} spaces.`,
        supportingRecordIds: spaces.flatMap((s) => (s.plants || []).map((p) => p.instanceId || p.plantId)),
        recordsExamined: inventory.totalPlants,
        dataLimitations: [],
        recommendedNextAction: 'Review plant requirements and seasonal calendar.',
        actionType: 'review_task'
      });
    }

    // 2. Lifecycle Milestones Insight
    if (lifecycle.milestoneTimeline.length > 0) {
      const topMilestone = lifecycle.milestoneTimeline[0];
      insights.push({
        id: `insight-milestone-${topMilestone.plantInstanceId}`,
        stableKey: `milestone-${topMilestone.plantInstanceId}-${topMilestone.stage}`,
        category: 'milestone',
        priority: 'normal',
        title: `${topMilestone.plantName} reached ${topMilestone.stage.toUpperCase()}`,
        explanation: `Recorded on ${new Date(topMilestone.date).toLocaleDateString()}. Milestones are documented in persistent garden memory.`,
        supportingRecordIds: [topMilestone.plantInstanceId],
        plantInstanceId: topMilestone.plantInstanceId,
        plantName: topMilestone.plantName,
        recordsExamined: lifecycle.milestoneTimeline.length,
        dataLimitations: [],
        recommendedNextAction: `Inspect ${topMilestone.plantName} to verify healthy growth.`,
        actionType: 'inspect_plant',
        latestEvidenceTimestamp: topMilestone.date
      });
    }

    // 3. Growth Measurements Insight
    growth.plantGrowthRates.forEach((rateItem) => {
      if (rateItem.status === 'sufficient_data') {
        insights.push({
          id: `insight-growth-${rateItem.plantInstanceId}`,
          stableKey: `growth-trend-${rateItem.plantInstanceId}-${rateItem.measurementCount}`,
          category: 'growth',
          priority: 'normal',
          title: `${rateItem.plantName}: +${rateItem.deltaCm} cm Growth Trend`,
          explanation: `Your ${rateItem.plantName} has ${rateItem.measurementCount} dated height measurements available for comparison (+${rateItem.deltaCm} cm over ${rateItem.daysElapsed} days, ~${rateItem.growthRateCmPerDay} cm/day).`,
          supportingRecordIds: rateItem.measurements.map((m) => m.id),
          plantInstanceId: rateItem.plantInstanceId,
          plantName: rateItem.plantName,
          recordsExamined: rateItem.measurementCount,
          dataLimitations: ['Calculated from manual ruler measurements at soil base to top stem.'],
          recommendedNextAction: 'Log another dated height measurement in 7–10 days.',
          actionType: 'record_height',
          latestEvidenceTimestamp: rateItem.measurements[rateItem.measurements.length - 1]?.measuredAt
        });
      } else if (rateItem.measurementCount === 1) {
        insights.push({
          id: `insight-growth-insufficient-${rateItem.plantInstanceId}`,
          stableKey: `growth-insufficient-${rateItem.plantInstanceId}`,
          category: 'growth',
          priority: 'info',
          title: `${rateItem.plantName} Baseline Height Recorded`,
          explanation: `There are not enough dated observations to establish a physical growth trend (1 measurement recorded). Add a second measurement to unlock growth rate analytics.`,
          supportingRecordIds: rateItem.measurements.map((m) => m.id),
          plantInstanceId: rateItem.plantInstanceId,
          plantName: rateItem.plantName,
          recordsExamined: 1,
          dataLimitations: ['At least 2 dated measurements required for growth delta calculation.'],
          recommendedNextAction: 'Record a second height measurement.',
          actionType: 'record_height',
          latestEvidenceTimestamp: rateItem.measurements[0]?.measuredAt
        });
      }
    });

    // 4. Care Activity Insight
    if (care.totalPendingTasks > 0) {
      insights.push({
        id: 'insight-care-pending',
        stableKey: `care-pending-${care.totalPendingTasks}`,
        category: 'care',
        priority: 'high',
        title: `${care.totalPendingTasks} Care Tasks Pending Attention`,
        explanation: `${care.totalPendingTasks} care tasks remain pending across your spaces. Regular attention keeps your garden flourishing.`,
        supportingRecordIds: [],
        recordsExamined: care.totalEligibleTasks,
        dataLimitations: ['Tasks reflect generated adaptive planner items.'],
        recommendedNextAction: 'Open the Care Planner to review and complete pending tasks.',
        actionType: 'review_task'
      });
    }

    if (care.totalCompletedTasks > 0) {
      insights.push({
        id: 'insight-care-completed',
        stableKey: `care-completed-${care.totalCompletedTasks}`,
        category: 'care',
        priority: 'info',
        title: `${care.totalCompletedTasks} Care Tasks Successfully Completed`,
        explanation: `Completion rate: ${care.completionRatePercent !== null ? `${care.completionRatePercent}%` : 'N/A'}. (${care.denominatorExplanation})`,
        supportingRecordIds: [],
        recordsExamined: care.totalEligibleTasks,
        dataLimitations: ['Recorded activity may not represent every real-world action.'],
        recommendedNextAction: 'Maintain steady moisture monitoring routine.',
        actionType: 'check_soil'
      });
    }

    // 5. Health & Recovery Follow-ups Insight
    health.plantsWarrantingInspection.forEach((warrantItem) => {
      insights.push({
        id: `insight-health-${warrantItem.plantInstanceId}`,
        stableKey: `health-reinspect-${warrantItem.plantInstanceId}`,
        category: 'health',
        priority: 'high',
        title: `Health Follow-Up Needed for ${warrantItem.plantName}`,
        explanation: warrantItem.reason,
        supportingRecordIds: [warrantItem.plantInstanceId],
        plantInstanceId: warrantItem.plantInstanceId,
        plantName: warrantItem.plantName,
        spaceId: warrantItem.spaceId,
        recordsExamined: health.totalDiagnoses,
        dataLimitations: ['A recorded diagnosis is a symptom analysis, not confirmed pathogen proof.'],
        recommendedNextAction: 'Perform fresh plant check and log recovery outcome.',
        actionType: 'complete_follow_up'
      });
    });

    // 6. Weather & Environmental Data Limitation Note
    insights.push({
      id: 'insight-env-history-limitation',
      stableKey: 'env-history-limitation',
      category: 'environmental',
      priority: 'info',
      title: 'Historical Weather Availability Notice',
      explanation:
        environmentalContext && !environmentalContext.isUnavailable
          ? `Current live weather (${environmentalContext.snapshot.temperatureC}°C, ${environmentalContext.snapshot.conditionText}) and 5-day forecast are active. Historical weather logs are not reconstructed to prevent inaccurate claims.`
          : 'Historical weather data is unavailable. Real garden decisions rely on physical soil touch and local observations.',
      supportingRecordIds: [],
      recordsExamined: 1,
      dataLimitations: ['Historical weather archives are not stored.'],
      recommendedNextAction: 'Take a calm moment outside to observe local air and sunlight.',
      actionType: 'check_soil'
    });

    return insights;
  }
}

export const gardenPerformanceService = new GardenPerformanceService();
