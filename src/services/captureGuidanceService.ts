import { SpaceCaptureChecklistItem, SpaceType } from '../types';

/**
 * Capture Guidance Service (Milestone 8)
 * Provides deterministic, beginner-friendly checklists customized to each space type.
 * Recommendations are completely optional and skippable.
 */
export class CaptureGuidanceService {
  getChecklistForSpace(spaceType: SpaceType): SpaceCaptureChecklistItem[] {
    switch (spaceType) {
      case 'balcony':
        return [
          {
            id: 'balcony-overview',
            label: 'Entrance looking outward',
            description: 'Stand at the doorway facing the balcony to show the full layout and depth.',
            category: 'overview',
            completed: false
          },
          {
            id: 'balcony-left',
            label: 'Left side & wall',
            description: 'Show vertical wall potential and side lighting.',
            category: 'structure',
            completed: false
          },
          {
            id: 'balcony-railing',
            label: 'Front railing / parapet',
            description: 'Show railing height, sunlight exposure, and safety boundary.',
            category: 'structure',
            completed: false
          },
          {
            id: 'balcony-right',
            label: 'Right side & corners',
            description: 'Show corners for potential container placement.',
            category: 'structure',
            completed: false
          },
          {
            id: 'balcony-floor',
            label: 'Floor surface & drainage',
            description: 'Check where water drains and ensure walkways are clear.',
            category: 'ground',
            completed: false
          },
          {
            id: 'balcony-ceiling',
            label: 'Ceiling or overhead roof',
            description: 'Shows whether the space is sheltered from rainfall and direct overhead sun.',
            category: 'sky',
            completed: false
          },
          {
            id: 'balcony-sky',
            label: 'Exterior sky view',
            description: 'Shows open sky vs tall neighboring buildings or trees blocking light.',
            category: 'sky',
            completed: false
          }
        ];

      case 'terrace':
        return [
          {
            id: 'terrace-overview',
            label: 'Wide panoramic view',
            description: 'Capture the whole open terrace from one corner.',
            category: 'overview',
            completed: false
          },
          {
            id: 'terrace-boundaries',
            label: 'Boundaries & parapet walls',
            description: 'Show edge safety walls and prevailing wind exposure.',
            category: 'structure',
            completed: false
          },
          {
            id: 'terrace-drainage',
            label: 'Drainage outlets & water tap',
            description: 'Show garden tap and slope where water exits during heavy rain.',
            category: 'ground',
            completed: false
          },
          {
            id: 'terrace-shade',
            label: 'Permanent shade & overhead structures',
            description: 'Show water tanks, pergolas, or stairwell shadows.',
            category: 'structure',
            completed: false
          },
          {
            id: 'terrace-surroundings',
            label: 'Surrounding buildings & open horizon',
            description: 'Helps understand morning east vs afternoon west sunlight path.',
            category: 'sky',
            completed: false
          }
        ];

      case 'backyard':
      case 'garden':
        return [
          {
            id: 'yard-overview',
            label: 'Full garden / yard overview',
            description: 'Step back to show the entire growing ground or lawn area.',
            category: 'overview',
            completed: false
          },
          {
            id: 'yard-boundaries',
            label: 'Fences, walls & boundary edges',
            description: 'Show physical property borders and fencing.',
            category: 'structure',
            completed: false
          },
          {
            id: 'yard-soil',
            label: 'Ground soil & garden beds',
            description: 'Close-up of the soil bed, grass, or paved pathways.',
            category: 'ground',
            completed: false
          },
          {
            id: 'yard-trees',
            label: 'Canopy trees & shade sources',
            description: 'Show nearby large trees that filter sunlight.',
            category: 'sky',
            completed: false
          },
          {
            id: 'yard-water',
            label: 'Water source / hose tap access',
            description: 'Location of the garden hose or watering point.',
            category: 'ground',
            completed: false
          }
        ];

      case 'windowsill':
      case 'indoor':
        return [
          {
            id: 'window-front',
            label: 'Window & ledge view',
            description: 'Show width and depth of the windowsill or indoor table.',
            category: 'overview',
            completed: false
          },
          {
            id: 'window-sill',
            label: 'Sill surface & placement zone',
            description: 'Show where pots would rest safely without tipping.',
            category: 'ground',
            completed: false
          },
          {
            id: 'window-outside',
            label: 'View looking outside',
            description: 'Shows angle of morning/afternoon sunlight into the room.',
            category: 'sky',
            completed: false
          },
          {
            id: 'window-sky',
            label: 'Open sky exposure',
            description: 'Shows whether eaves or tall buildings obstruct the sky.',
            category: 'sky',
            completed: false
          }
        ];

      default:
        return [
          {
            id: 'generic-overview',
            label: 'Wide view of the growing space',
            description: 'Show where pots or planters will be placed.',
            category: 'overview',
            completed: false
          },
          {
            id: 'generic-light',
            label: 'Light source & sky direction',
            description: 'Show how light enters the space.',
            category: 'sky',
            completed: false
          },
          {
            id: 'generic-surface',
            label: 'Floor or resting surface',
            description: 'Show ground stability and drainage.',
            category: 'ground',
            completed: false
          }
        ];
    }
  }
}

export const captureGuidanceService = new CaptureGuidanceService();
