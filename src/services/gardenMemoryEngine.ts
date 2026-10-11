import {
  GardenPlant,
  GardenSpace,
  CareEvent,
  GardenInsight,
  PlantJournalEntry,
  PlantLifecycleStage,
  PlantJournalEntryType
} from '../types';
import { secureIds } from '../utils/secureId';

export class GardenMemoryEngine {
  /**
   * Ensures a garden plant has a stable instance identity, lifecycle stage, and history containers
   */
  normalizePlantInstance(plant: GardenPlant, spaceId: string, index: number = 0): GardenPlant {
    const instanceId = plant.instanceId || `${spaceId}-${plant.plantId}-${index}`;
    const lifecycleStage: PlantLifecycleStage = plant.lifecycleStage || (plant.status === 'planning' ? 'planned' : 'vegetative');

    return {
      ...plant,
      instanceId,
      spaceId: plant.spaceId || spaceId,
      lifecycleStage,
      lifecycleHistory: plant.lifecycleHistory || [
        {
          id: `init-${instanceId}`,
          stage: lifecycleStage,
          transitionedAt: plant.plantedAt || plant.addedAt || new Date().toISOString(),
          note: 'Initial stage recorded',
          source: 'system'
        }
      ],
      journalEntries: plant.journalEntries || [],
      heightMeasurements: plant.heightMeasurements || []
    };
  }

  /**
   * Creates a structured journal entry with clear source provenance and distinct timestamps
   */
  createJournalEntry(params: {
    plantInstanceId: string;
    plantId: string;
    spaceId: string;
    type: PlantJournalEntryType;
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
  }): PlantJournalEntry {
    const now = new Date().toISOString();
    return {
      id: secureIds.journal(),
      plantInstanceId: params.plantInstanceId,
      plantId: params.plantId,
      spaceId: params.spaceId,
      type: params.type,
      occurredAt: params.occurredAt || now,
      recordedAt: now,
      note: params.note,
      mediaIds: params.mediaIds || [],
      source: params.source || 'user',
      confidence: params.confidence ?? (params.source === 'vision_ai' ? 0.75 : 1.0),
      stage: params.stage,
      heightCm: params.heightCm,
      environmentalSnapshot: params.environmentalSnapshot
    };
  }

  /**
   * Generates helpful, encouraging, non-guilt-based garden insights
   */
  generateGardenInsights(
    plants: GardenPlant[],
    spaces: GardenSpace[],
    careEvents: CareEvent[] = []
  ): GardenInsight[] {
    const insights: GardenInsight[] = [];
    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. Check for plants needing a gentle observation
    for (const p of plants) {
      const space = spaces.find((s) => s.id === p.spaceId);
      const spaceName = space ? space.name : 'your space';

      // Check last checked or watered date
      const lastActionTime = p.lastCheckedAt || p.lastWateredAt || p.addedAt;
      if (lastActionTime) {
        const elapsedDays = Math.floor((nowMs - new Date(lastActionTime).getTime()) / dayMs);
        if (elapsedDays >= 6) {
          insights.push({
            id: `insight-checkin-${p.instanceId || p.plantId}`,
            plantInstanceId: p.instanceId,
            spaceId: p.spaceId,
            title: `Gentle check-in for ${p.plant.name}`,
            description: `It has been ${elapsedDays} days since the last recorded soil check in ${spaceName}. Touch the top inch of soil to check moisture.`,
            category: 'check_in',
            urgency: 'normal',
            createdAt: new Date().toISOString()
          });
        }
      }

      // 2. Check for recent flowering or harvest milestones in journal entries
      const entries = p.journalEntries || [];
      const recentMilestone = entries.find(
        (e) =>
          (e.type === 'flowering' || e.type === 'harvested' || e.stage === 'flowering' || e.stage === 'fruiting') &&
          nowMs - new Date(e.occurredAt).getTime() < 7 * dayMs
      );

      if (recentMilestone) {
        insights.push({
          id: `insight-milestone-${p.instanceId || p.plantId}`,
          plantInstanceId: p.instanceId,
          spaceId: p.spaceId,
          title: `Milestone: ${p.plant.name} is ${recentMilestone.stage || recentMilestone.type}!`,
          description: `Great progress in ${spaceName}. Keep up regular hydration and monitor sunlight balance.`,
          category: 'milestone',
          urgency: 'info',
          createdAt: new Date().toISOString()
        });
      }

      // 3. Height measurements celebration
      if (p.heightMeasurements && p.heightMeasurements.length >= 2) {
        const sortedHeights = [...p.heightMeasurements].sort(
          (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
        );
        const first = sortedHeights[0];
        const last = sortedHeights[sortedHeights.length - 1];
        const growthDelta = last.heightCm - first.heightCm;
        if (growthDelta > 0) {
          insights.push({
            id: `insight-growth-${p.instanceId || p.plantId}`,
            plantInstanceId: p.instanceId,
            spaceId: p.spaceId,
            title: `Measured growth on ${p.plant.name}`,
            description: `Grew +${growthDelta.toFixed(1)}cm from ${first.heightCm}cm to ${last.heightCm}cm since first recorded measurement!`,
            category: 'milestone',
            urgency: 'info',
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // 4. Care consistency recognition
    const recentCareCount = careEvents.filter(
      (c) => nowMs - new Date(c.timestamp).getTime() < 7 * dayMs
    ).length;

    if (recentCareCount >= 3) {
      insights.push({
        id: `insight-consistency-${Date.now()}`,
        title: 'Consistent care cadence',
        description: `You logged ${recentCareCount} garden care actions this week. Consistent observation is the heart of healthy plants!`,
        category: 'consistency',
        urgency: 'info',
        createdAt: new Date().toISOString()
      });
    }

    // 5. Default welcoming insight if garden is fresh
    if (insights.length === 0 && plants.length > 0) {
      insights.push({
        id: `insight-welcome-${Date.now()}`,
        title: 'Your garden journal is ready',
        description: 'Take weekly photos and note simple observations to build a memory of how your plants grow.',
        category: 'check_in',
        urgency: 'low',
        createdAt: new Date().toISOString()
      });
    }

    return insights;
  }
}

export const gardenMemoryEngine = new GardenMemoryEngine();
