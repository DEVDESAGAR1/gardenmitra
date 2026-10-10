import {
  DigitalTwinProposal,
  DigitalTwinProposalMode,
  GardenContainer,
  GardenDigitalTwin,
  GardenSpace,
  PlantPlacement,
  SpaceLayout
} from '../types';
import { captureCoverageEngine } from './captureCoverageEngine';
import { spaceMeasurementEngine } from './spaceMeasurementEngine';
import { usableSpaceEngine } from './usableSpaceEngine';
import { layoutValidationEngine } from './layoutOptimizationEngine';

/**
 * Digital Twin Recommendation Engine (Milestone 10)
 * Generates explainable, deterministic proposal layouts across 4 modes.
 * Validates spatial constraints and never mutates current space state before acceptance.
 */
export class DigitalTwinRecommendationEngine {
  /**
   * Initializes or loads the Digital Twin for a given space
   */
  getOrCreateDigitalTwin(space: GardenSpace): GardenDigitalTwin {
    if (space.digitalTwin) {
      return space.digitalTwin;
    }

    const coverage = captureCoverageEngine.evaluateCoverage(space);
    const measurements = spaceMeasurementEngine.getMeasurementsForSpace(space);
    const usableSpace = usableSpaceEngine.calculateUsableSpace(space);

    const layout = space.layout || {
      width: space.dimensions?.width,
      depth: space.dimensions?.length,
      unit: space.dimensions?.unit || 'ft',
      zones: space.sunlightZones?.map((sz) => ({
        id: `zone-${sz.id}`,
        spaceId: space.id,
        name: sz.name,
        type: sz.type === 'sunny' ? ('sunny_area' as const) : ('shaded_area' as const),
        sunlightZoneId: sz.id
      })) || [
        {
          id: `zone-sunny-${space.id}`,
          spaceId: space.id,
          name: 'Sunny Railing / Perimeter',
          type: 'sunny_area' as const
        },
        {
          id: `zone-walkway-${space.id}`,
          spaceId: space.id,
          name: 'Central Access Path',
          type: 'walkway' as const,
          isWalkway: true
        }
      ],
      containers: [],
      plantPlacements: [],
      updatedAt: new Date().toISOString()
    };

    const mediaIds = (space.mediaAssets || []).map((m) => m.id);

    return {
      id: `twin-${space.id}`,
      spaceId: space.id,
      version: 1,
      updatedAt: new Date().toISOString(),
      layout,
      measurements,
      coverage,
      usableSpace,
      evidenceMediaIds: mediaIds,
      observations: space.userObservations || [],
      assumptions: [
        'Zones generated from documented lighting and walkway access.',
        'Walkway width planning assumption: minimum 2 feet clear path.'
      ],
      proposals: []
    };
  }

  /**
   * Generates a proposed layout for a specific goal mode
   */
  generateProposal(
    space: GardenSpace,
    mode: DigitalTwinProposalMode
  ): DigitalTwinProposal {
    const twin = this.getOrCreateDigitalTwin(space);
    const currentLayout = twin.layout;
    const plants = space.plants || [];

    const sunnyZone = currentLayout.zones.find((z) => z.type === 'sunny_area' || z.name.toLowerCase().includes('sun')) || currentLayout.zones[0];
    const shadeZone = currentLayout.zones.find((z) => z.type === 'shaded_area' || z.name.toLowerCase().includes('shade')) || currentLayout.zones[1] || currentLayout.zones[0];
    const walkwayZone = currentLayout.zones.find((z) => z.type === 'walkway' || z.isWalkway);

    const proposedContainers: GardenContainer[] = [];
    const proposedPlacements: PlantPlacement[] = [];
    const explanations: string[] = [];

    if (walkwayZone) {
      explanations.push(`Preserving "${walkwayZone.name}" completely unobstructed for comfortable walking and watering.`);
    }

    // Mode-specific proposals
    switch (mode) {
      case 'space_efficient': {
        explanations.push('Perimeter alignment: pots arranged strictly along boundaries to leave central walking lane 100% open.');
        explanations.push('Vertical planters prioritized to maximize foliage without occupying floor tiles.');

        // Build containers along perimeter
        plants.forEach((gp, idx) => {
          const plant = gp.plant;
          const isSunLover = plant.sunlightRequirement === 'full';
          const targetZone = isSunLover ? sunnyZone : shadeZone;
          const containerId = `prop-cont-eff-${idx + 1}`;

          proposedContainers.push({
            id: containerId,
            spaceId: space.id,
            name: `${plant.name} Perimeter Pot`,
            type: plant.containerFriendly ? 'pot' : 'vertical_planter',
            size: 'small',
            zoneId: targetZone?.id,
            sunlightZoneId: targetZone?.sunlightZoneId,
            maxPlants: 1,
            plantIds: [plant.id],
            isAccessibleForWatering: true
          });

          proposedPlacements.push({
            id: `prop-place-eff-${idx + 1}`,
            spaceId: space.id,
            plantId: plant.id,
            plantName: plant.name,
            containerId,
            zoneId: targetZone?.id,
            notes: `Aligned along perimeter in ${targetZone?.name || 'safe zone'}`
          });
        });
        break;
      }

      case 'beginner_friendly': {
        explanations.push('Organized by watering rhythm: herbs grouped together for easy 1-inch finger moisture checks.');
        explanations.push('Comfortable reaching height: containers positioned where you will not need to stretch or trip.');

        plants.forEach((gp, idx) => {
          const plant = gp.plant;
          const containerId = `prop-cont-beg-${idx + 1}`;
          const targetZone = plant.sunlightRequirement === 'full' ? sunnyZone : shadeZone;

          proposedContainers.push({
            id: containerId,
            spaceId: space.id,
            name: `Easy Care ${plant.name}`,
            type: 'pot',
            size: 'medium',
            zoneId: targetZone?.id,
            sunlightZoneId: targetZone?.sunlightZoneId,
            maxPlants: 1,
            plantIds: [plant.id],
            isAccessibleForWatering: true
          });

          proposedPlacements.push({
            id: `prop-place-beg-${idx + 1}`,
            spaceId: space.id,
            plantId: plant.id,
            plantName: plant.name,
            containerId,
            zoneId: targetZone?.id,
            notes: 'Positioned for easy daily watering and leaf inspection'
          });
        });
        break;
      }

      case 'max_edibles': {
        explanations.push('Full sun exposure maximized for fruiting and flowering crops like tomatoes and chillies.');
        explanations.push('Deep grow bags assigned to root crops and heavy feeders.');

        plants.forEach((gp, idx) => {
          const plant = gp.plant;
          const isFruiting = plant.category === 'vegetables' || plant.category === 'fruits';
          const targetZone = isFruiting ? sunnyZone : (shadeZone || sunnyZone);
          const containerId = `prop-cont-edible-${idx + 1}`;

          proposedContainers.push({
            id: containerId,
            spaceId: space.id,
            name: `${plant.name} ${isFruiting ? 'Grow Bag' : 'Planter'}`,
            type: isFruiting ? 'grow_bag' : 'pot',
            size: isFruiting ? 'large' : 'medium',
            zoneId: targetZone?.id,
            sunlightZoneId: targetZone?.sunlightZoneId,
            maxPlants: 1,
            plantIds: [plant.id],
            isAccessibleForWatering: true
          });

          proposedPlacements.push({
            id: `prop-place-edible-${idx + 1}`,
            spaceId: space.id,
            plantId: plant.id,
            plantName: plant.name,
            containerId,
            zoneId: targetZone?.id,
            notes: `Maximized yield in ${targetZone?.name || 'high sunlight'}`
          });
        });
        break;
      }

      case 'low_maintenance': {
        explanations.push('Larger potting volume to slow down soil drying on hot afternoons.');
        explanations.push('Containers situated with clear drainage clearance so runoff drains without pooling.');

        plants.forEach((gp, idx) => {
          const plant = gp.plant;
          const containerId = `prop-cont-lowm-${idx + 1}`;
          const targetZone = shadeZone || sunnyZone;

          proposedContainers.push({
            id: containerId,
            spaceId: space.id,
            name: `${plant.name} Self-Draining Tub`,
            type: 'planter_box',
            size: 'medium',
            zoneId: targetZone?.id,
            sunlightZoneId: targetZone?.sunlightZoneId,
            maxPlants: 1,
            plantIds: [plant.id],
            isAccessibleForWatering: true
          });

          proposedPlacements.push({
            id: `prop-place-lowm-${idx + 1}`,
            spaceId: space.id,
            plantId: plant.id,
            plantName: plant.name,
            containerId,
            zoneId: targetZone?.id,
            notes: 'Positioned for stable moisture retention'
          });
        });
        break;
      }
    }

    const proposedLayout: SpaceLayout = {
      ...currentLayout,
      containers: proposedContainers,
      plantPlacements: proposedPlacements,
      updatedAt: new Date().toISOString()
    };

    // Validate proposed layout using existing LayoutValidationEngine
    const warnings = layoutValidationEngine.validateLayout(space, proposedLayout, plants);

    const modeTitles: Record<DigitalTwinProposalMode, string> = {
      space_efficient: 'Space-Efficient Perimeter Arrangement',
      beginner_friendly: 'Beginner-Friendly Easy-Watering Layout',
      max_edibles: 'Maximum Edibles & Kitchen Garden Layout',
      low_maintenance: 'Low-Maintenance Moisture-Retaining Layout'
    };

    const modeDescriptions: Record<DigitalTwinProposalMode, string> = {
      space_efficient: 'Keeps walkways wide open and utilizes side edges and railings.',
      beginner_friendly: 'Groups pots where you can easily reach them for 1-inch soil checks.',
      max_edibles: 'Puts sun-loving tomatoes, chillies, and greens into direct solar paths.',
      low_maintenance: 'Uses larger moisture-holding pots and groups them near drains.'
    };

    const usable = usableSpaceEngine.calculateUsableSpace(space);

    return {
      id: `prop-${mode}-${Date.now()}`,
      mode,
      title: modeTitles[mode],
      description: modeDescriptions[mode],
      layout: proposedLayout,
      explanations,
      newPlacementsCount: proposedPlacements.length,
      movedContainersCount: Math.abs(proposedContainers.length - (currentLayout.containers.length || 0)),
      usablePlantingAreaSqFt: usable.usablePlantingAreaSqFt,
      warnings,
      createdAt: new Date().toISOString()
    };
  }
}

export const digitalTwinRecommendationEngine = new DigitalTwinRecommendationEngine();
