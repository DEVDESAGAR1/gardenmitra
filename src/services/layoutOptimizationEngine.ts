import {
  GardenSpace,
  SpaceLayout,
  SpaceZone,
  GardenContainer,
  LayoutIssue,
  LayoutRecommendation,
  GardenPlant,
  Plant
} from '../types';

/**
 * Layout Optimization & Validation Engines (Milestone 6)
 * Beginner-first rules:
 * - Prioritizes plant health, walkway safety, and watering ease over overcrowding.
 * - Explains "WHY" for every placement.
 * - Detects practical real-world obstacles (blocked path, shade incompatibility).
 */
export class LayoutValidationEngine {
  validateLayout(
    space: GardenSpace,
    layout: SpaceLayout,
    gardenPlants: GardenPlant[]
  ): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    // Helper map of plants
    const plantMap = new Map<string, Plant>();
    gardenPlants.forEach((gp) => plantMap.set(gp.plantId, gp.plant));

    // Helper map of zones
    const zoneMap = new Map<string, SpaceZone>();
    layout.zones.forEach((z) => zoneMap.set(z.id, z));

    // Helper map of containers
    const containerMap = new Map<string, GardenContainer>();
    layout.containers.forEach((c) => containerMap.set(c.id, c));

    // 1. Check for Blocked Walkways & Doorways
    const walkwayZones = layout.zones.filter((z) => z.type === 'walkway' || z.isWalkway);
    walkwayZones.forEach((walkway) => {
      // Find if any container is assigned to this walkway zone
      const blockingContainers = layout.containers.filter(
        (c) => c.zoneId === walkway.id
      );
      blockingContainers.forEach((bc) => {
        issues.push({
          id: `issue-walkway-${bc.id}`,
          severity: 'critical',
          type: 'blocked_walkway',
          message: `Walkway path "${walkway.name}" is obstructed by container "${bc.name}".`,
          affectedContainerName: bc.name,
          suggestedAction: 'Move this pot to the side to preserve an unobstructed walking and watering path.'
        });
      });
    });

    const accessZones = layout.zones.filter((z) => z.type === 'doorway_access');
    accessZones.forEach((access) => {
      const blockingContainers = layout.containers.filter((c) => c.zoneId === access.id);
      blockingContainers.forEach((bc) => {
        issues.push({
          id: `issue-access-${bc.id}`,
          severity: 'critical',
          type: 'blocked_access',
          message: `Entrance doorway "${access.name}" has container "${bc.name}" in front of it.`,
          affectedContainerName: bc.name,
          suggestedAction: 'Keep entrance thresholds clear for safety and daily access.'
        });
      });
    });

    // 2. Check Sunlight Compatibility for Plant Placements
    layout.plantPlacements.forEach((placement) => {
      const plant = plantMap.get(placement.plantId);
      if (!plant) return;

      // Determine effective zone
      let zone: SpaceZone | undefined;
      if (placement.zoneId) {
        zone = zoneMap.get(placement.zoneId);
      } else if (placement.containerId) {
        const container = containerMap.get(placement.containerId);
        if (container?.zoneId) zone = zoneMap.get(container.zoneId);
      }

      if (zone) {
        // High sunlight plant in shaded zone
        if (plant.sunlightRequirement === 'full' && (zone.type === 'shaded_area' || zone.name.toLowerCase().includes('shade'))) {
          issues.push({
            id: `issue-sun-${placement.id}`,
            severity: 'warning',
            type: 'sunlight_incompatibility',
            message: `${plant.name} requires strong direct sun (5h+) but is placed in shaded area "${zone.name}".`,
            affectedPlantName: plant.name,
            suggestedAction: `Move ${plant.name} to a brighter zone or sunny railing position so it can flower and fruit.`
          });
        }
      }
    });

    // 3. Check Container Density in Limited Spaces
    const totalContainers = layout.containers.length;
    if (space.size === 'very_small' && totalContainers > 4) {
      issues.push({
        id: 'issue-density-very-small',
        severity: 'warning',
        type: 'excessive_density',
        message: `High container density: ${totalContainers} pots in a very compact ${space.type}.`,
        suggestedAction: 'Consider vertical wall brackets or compact grouping to maintain air circulation.'
      });
    } else if (space.size === 'small' && totalContainers > 8) {
      issues.push({
        id: 'issue-density-small',
        severity: 'warning',
        type: 'excessive_density',
        message: `High container density: ${totalContainers} pots may crowd your ${space.type}.`,
        suggestedAction: 'Group pots by watering needs and preserve a minimum 2-foot access lane.'
      });
    }

    // 4. Check Container Watering Accessibility
    layout.containers.forEach((container) => {
      if (container.isAccessibleForWatering === false) {
        issues.push({
          id: `issue-water-access-${container.id}`,
          severity: 'warning',
          type: 'watering_difficulty',
          message: `Container "${container.name}" is marked difficult to reach for watering.`,
          affectedContainerName: container.name,
          suggestedAction: 'Bring this container forward so you can easily do the 1-inch soil moisture test.'
        });
      }

      // Overcrowded container check
      if (container.maxPlants && container.plantIds && container.plantIds.length > container.maxPlants) {
        issues.push({
          id: `issue-capacity-${container.id}`,
          severity: 'info',
          type: 'container_size',
          message: `Container "${container.name}" has ${container.plantIds.length} plants (recommended capacity: ${container.maxPlants}).`,
          affectedContainerName: container.name,
          suggestedAction: 'Thin or repot extra seedlings so roots have adequate soil volume.'
        });
      }
    });

    return issues;
  }
}

export class LayoutRecommendationEngine {
  generateRecommendations(
    space: GardenSpace,
    layout: SpaceLayout,
    gardenPlants: GardenPlant[]
  ): LayoutRecommendation[] {
    const recommendations: LayoutRecommendation[] = [];

    // Helper zones
    const sunnyZones = layout.zones.filter(
      (z) => z.type === 'sunny_area' || z.name.toLowerCase().includes('sun')
    );
    const shadeZones = layout.zones.filter(
      (z) => z.type === 'shaded_area' || z.name.toLowerCase().includes('shade')
    );

    // 1. Plant Specific Placement Recommendations
    gardenPlants.forEach((gp) => {
      const plant = gp.plant;

      if (plant.sunlightRequirement === 'full') {
        const targetZone = sunnyZones[0] || layout.zones[0];
        recommendations.push({
          id: `rec-plant-${plant.id}`,
          plantId: plant.id,
          plantName: plant.name,
          recommendedZoneId: targetZone?.id,
          recommendedZoneName: targetZone?.name || 'Brightest sunny area',
          recommendedContainerType: plant.containerFriendly ? 'pot' : 'grow_bag',
          headline: `Place ${plant.name} in your brightest sunny spot`,
          reason: `${plant.name} needs high solar energy to develop blossoms and fruit.`,
          tip: 'Keep pots slightly elevated on pot feet to ensure clean drainage.'
        });
      } else if (plant.sunlightRequirement === 'low' || plant.name.toLowerCase().includes('mint')) {
        const targetZone = shadeZones[0] || layout.zones[1] || layout.zones[0];
        recommendations.push({
          id: `rec-plant-${plant.id}`,
          plantId: plant.id,
          plantName: plant.name,
          recommendedZoneId: targetZone?.id,
          recommendedZoneName: targetZone?.name || 'Partial shade area',
          recommendedContainerType: 'pot',
          headline: `Place ${plant.name} in partial shade`,
          reason: `${plant.name} enjoys cool root temperatures and tolerates filtered light well.`,
          tip: plant.name.toLowerCase().includes('mint')
            ? 'Grow mint in its own separate container to prevent vigorous runner roots from overtaking other plants.'
            : 'Check soil moisture regularly as leafy foliage drinks steadily.'
        });
      }
    });

    // 2. Small Space / Limited Space Optimizations
    if (space.size === 'small' || space.size === 'very_small') {
      recommendations.push({
        id: 'rec-space-vertical',
        plantId: 'general',
        plantName: 'Vertical Opportunity',
        recommendedContainerType: 'vertical_planter',
        headline: 'Utilize vertical wall or railing space',
        reason: `Your ${space.type} has limited floor area. Vertical and hanging planters double your growing capacity without crowding your feet.`,
        tip: 'Hang herb pouches or railing troughs securely on sturdy balcony rails.'
      });

      recommendations.push({
        id: 'rec-space-walkway',
        plantId: 'general',
        plantName: 'Walkway Clearance',
        headline: 'Maintain a 2-foot central walkway',
        reason: 'Gardening is enjoyable only when you can move freely to inspect and water your plants.',
        tip: 'Arrange pots along outer perimeters rather than clustering in the center.'
      });
    }

    return recommendations;
  }
}

export const layoutValidationEngine = new LayoutValidationEngine();
export const layoutRecommendationEngine = new LayoutRecommendationEngine();
