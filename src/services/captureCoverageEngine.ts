import {
  CaptureCoverageItem,
  CaptureView,
  CoverageStatus,
  GardenSpace,
  SpaceCaptureCoverage,
  SpaceType
} from '../types';

export interface ViewDefinition {
  view: CaptureView;
  label: string;
  description: string;
  directionPrompt: string;
  whyItMatters: string;
  priority: number; // 1 = highest, 5 = lowest
}

export const SPACE_VIEW_REQUIREMENTS: Record<SpaceType, ViewDefinition[]> = {
  balcony: [
    {
      view: 'entrance',
      label: 'Entrance looking outward',
      description: 'Wide view from the doorway into the balcony space.',
      directionPrompt: 'Stand near the doorway and point your camera outward into the balcony.',
      whyItMatters: 'Establishes full space depth and preserves a clear entryway threshold.',
      priority: 1
    },
    {
      view: 'floor',
      label: 'Floor surface & drainage',
      description: 'Ground view showing floor tiles, slope, and drainage outlet.',
      directionPrompt: 'Point the camera down to show the floor tiles, slopes, and drainage area.',
      whyItMatters: 'Ensures water will drain freely after watering and pots will not block runoff.',
      priority: 1
    },
    {
      view: 'front',
      label: 'Front railing / parapet',
      description: 'Railing boundary, height, and outward exposure.',
      directionPrompt: 'Point towards the main railing or outer parapet boundary.',
      whyItMatters: 'Reveals edge safety, sunlight orientation, and wind exposure.',
      priority: 2
    },
    {
      view: 'left',
      label: 'Left side & wall',
      description: 'Left vertical wall, corners, and side lighting.',
      directionPrompt: 'Point camera towards the left wall and corner.',
      whyItMatters: 'Identifies vertical trellis space and morning or afternoon light angles.',
      priority: 3
    },
    {
      view: 'right',
      label: 'Right side & wall',
      description: 'Right wall, corner space, and shelter.',
      directionPrompt: 'Point camera towards the right side and corner.',
      whyItMatters: 'Finds tucked-away spots for larger storage pots and wind-sensitive herbs.',
      priority: 3
    },
    {
      view: 'ceiling',
      label: 'Ceiling or overhead roof',
      description: 'Overhang, slab ceiling, or open sky above.',
      directionPrompt: 'Tilt camera upward towards the ceiling overhang or awning.',
      whyItMatters: 'Shows whether rainfall reaches your containers and if hanging planters fit.',
      priority: 4
    },
    {
      view: 'sky',
      label: 'Exterior sky & obstructions',
      description: 'View outside railing showing open horizon vs nearby towers.',
      directionPrompt: 'Capture the view outside the railing looking toward the open sky.',
      whyItMatters: 'Identifies neighboring buildings or canopy trees that cast midday shadows.',
      priority: 4
    }
  ],
  terrace: [
    {
      view: 'entrance',
      label: 'Access door & walkway',
      description: 'Stairwell door or doorway onto the open terrace.',
      directionPrompt: 'Stand at the terrace doorway and capture the entry view.',
      whyItMatters: 'Keeps main doorway clear so you can comfortably carry watering cans.',
      priority: 1
    },
    {
      view: 'floor',
      label: 'Open floor surface',
      description: 'Terrace flooring, slope, and expansion joints.',
      directionPrompt: 'Point down across the open floor surface.',
      whyItMatters: 'Identifies safe level ground for heavy pots and grow bags.',
      priority: 1
    },
    {
      view: 'drainage',
      label: 'Drainage outlets & slopes',
      description: 'Corner drain pipes and stormwater outlets.',
      directionPrompt: 'Capture corner drains where rainwater leaves the terrace.',
      whyItMatters: 'Critical to prevent pooled water and root rot during monsoon showers.',
      priority: 1
    },
    {
      view: 'boundary',
      label: 'Parapet walls & boundaries',
      description: 'Perimeter parapet walls and safety edges.',
      directionPrompt: 'Capture the perimeter boundary wall.',
      whyItMatters: 'Parapets block harsh lower winds and provide windbreak zones.',
      priority: 2
    },
    {
      view: 'shade',
      label: 'Permanent structures & shade',
      description: 'Water tanks, stair towers, or pergolas.',
      directionPrompt: 'Capture water tanks, mumty stairwells, or permanent structures.',
      whyItMatters: 'Permanent structures cast predictable all-day shadows for delicate plants.',
      priority: 3
    },
    {
      view: 'water_source',
      label: 'Garden tap / water connection',
      description: 'Outdoor hose bib or tap outlet.',
      directionPrompt: 'Capture the outdoor water tap or hose bib location.',
      whyItMatters: 'Groups heavy drinking plants closer to your water source.',
      priority: 3
    },
    {
      view: 'sky',
      label: 'Open sky view',
      description: 'Horizon and solar path across the roof.',
      directionPrompt: 'Pan across the open sky view to check the horizon.',
      whyItMatters: 'Reveals full sun potential across morning east and afternoon west.',
      priority: 4
    }
  ],
  backyard: [
    {
      view: 'entrance',
      label: 'Entrance from house',
      description: 'View looking out into the yard from the rear door.',
      directionPrompt: 'Stand at the back doorway and view the whole yard.',
      whyItMatters: 'Establishes primary walking route and visual connection from home.',
      priority: 1
    },
    {
      view: 'floor',
      label: 'Ground soil & garden beds',
      description: 'Lawn, soil surface, or paved patio.',
      directionPrompt: 'Point towards the ground soil and existing garden beds.',
      whyItMatters: 'Distinguishes plantable ground soil from paved surfaces.',
      priority: 1
    },
    {
      view: 'boundary',
      label: 'Property fence & boundaries',
      description: 'Fences, brick walls, and property borders.',
      directionPrompt: 'Capture property boundary fences and perimeter borders.',
      whyItMatters: 'Boundary walls provide wind shelter and trellis climbing opportunities.',
      priority: 2
    },
    {
      view: 'shade',
      label: 'Canopy trees & shade',
      description: 'Overhead shade trees and surrounding buildings.',
      directionPrompt: 'Look up toward nearby trees that cast filtered shade.',
      whyItMatters: 'Distinguishes full-sun open ground from cool filtered under-canopy zones.',
      priority: 2
    },
    {
      view: 'water_source',
      label: 'Hose pipe / outdoor tap',
      description: 'Location of the garden hose or water access point.',
      directionPrompt: 'Show the garden tap or hose connection.',
      whyItMatters: 'Prevents dragging heavy hoses across delicate vegetable beds.',
      priority: 3
    }
  ],
  garden: [
    {
      view: 'entrance',
      label: 'Garden entrance & path',
      description: 'Entry gateway and primary walkway.',
      directionPrompt: 'Stand at the entry gate facing into the garden.',
      whyItMatters: 'Protects main garden path from encroachment.',
      priority: 1
    },
    {
      view: 'floor',
      label: 'Growing beds & ground',
      description: 'Ground beds, lawn, and soil patches.',
      directionPrompt: 'Capture the ground growing beds and soil condition.',
      whyItMatters: 'Helps plan container versus in-ground planting zones.',
      priority: 1
    },
    {
      view: 'boundary',
      label: 'Perimeter edges',
      description: 'Perimeter hedges or fences.',
      directionPrompt: 'Capture boundary hedges or fences.',
      whyItMatters: 'Establishes planting boundaries and companion groupings.',
      priority: 2
    },
    {
      view: 'water_source',
      label: 'Water access point',
      description: 'Garden tap or irrigation head.',
      directionPrompt: 'Show the water source location.',
      whyItMatters: 'Ensures watering ease for everyday care.',
      priority: 3
    }
  ],
  windowsill: [
    {
      view: 'front',
      label: 'Window & ledge view',
      description: 'Direct view of the windowsill ledge and frame.',
      directionPrompt: 'Stand back and capture the whole window frame and sill.',
      whyItMatters: 'Shows available ledge length and pot stability.',
      priority: 1
    },
    {
      view: 'floor',
      label: 'Sill depth & surface',
      description: 'Top-down look at the sill depth and resting surface.',
      directionPrompt: 'Look down onto the sill surface to show its width and depth.',
      whyItMatters: 'Ensures pot base diameter fits securely without tipping.',
      priority: 1
    },
    {
      view: 'sky',
      label: 'Outside light & sky view',
      description: 'Angle of daylight through the window glass.',
      directionPrompt: 'Capture the view through the window toward the open sky.',
      whyItMatters: 'Determines morning vs afternoon sun hours through the pane.',
      priority: 2
    },
    {
      view: 'shade',
      label: 'Window overhangs & curtains',
      description: 'Blinds, awnings, or external overhangs.',
      directionPrompt: 'Show any eaves or blinds that block direct midday light.',
      whyItMatters: 'Accounts for structural window shadows.',
      priority: 3
    }
  ],
  indoor: [
    {
      view: 'front',
      label: 'Window & primary light source',
      description: 'Window or glass door bringing daylight into the room.',
      directionPrompt: 'Point toward the closest window or daylight source.',
      whyItMatters: 'Indoor plants strictly depend on distance from the window glass.',
      priority: 1
    },
    {
      view: 'floor',
      label: 'Floor / table resting space',
      description: 'Floor area, shelf, or tabletop where plants will sit.',
      directionPrompt: 'Show the table, stand, or floor surface for your pots.',
      whyItMatters: 'Verifies saucer protection and room clearance.',
      priority: 1
    },
    {
      view: 'sky',
      label: 'Outside light direction',
      description: 'Angle of sun entering the room.',
      directionPrompt: 'Look through the window toward the sky.',
      whyItMatters: 'Identifies foot-candles of natural light versus shaded interior.',
      priority: 2
    }
  ],
  pots: [
    {
      view: 'entrance',
      label: 'Overall grouping overview',
      description: 'View of the entire container cluster.',
      directionPrompt: 'Step back to capture all existing pots together.',
      whyItMatters: 'Shows container density and grouping arrangement.',
      priority: 1
    },
    {
      view: 'floor',
      label: 'Resting ground surface',
      description: 'Ground beneath containers and drainage path.',
      directionPrompt: 'Show the floor or ground under your pots.',
      whyItMatters: 'Ensures water flows safely away from foundations.',
      priority: 1
    },
    {
      view: 'sky',
      label: 'Sunlight direction',
      description: 'Sky opening above the containers.',
      directionPrompt: 'Capture the sky opening above your container area.',
      whyItMatters: 'Determines solar exposure for container crops.',
      priority: 2
    }
  ],
  other: [
    {
      view: 'entrance',
      label: 'Main entry view',
      description: 'Wide view showing access to the growing space.',
      directionPrompt: 'Capture a wide view from where you enter the space.',
      whyItMatters: 'Establishes primary access and perspective.',
      priority: 1
    },
    {
      view: 'floor',
      label: 'Floor / ground surface',
      description: 'Ground level where planters will rest.',
      directionPrompt: 'Show the floor or ground where containers will sit.',
      whyItMatters: 'Checks stability, slope, and drainage.',
      priority: 1
    },
    {
      view: 'boundary',
      label: 'Physical boundaries',
      description: 'Walls, railings, or borders.',
      directionPrompt: 'Capture the edges or boundaries of the space.',
      whyItMatters: 'Defines usable boundaries for plant placement.',
      priority: 2
    },
    {
      view: 'sky',
      label: 'Sky view & light access',
      description: 'Sunlight entry and overhead clearance.',
      directionPrompt: 'Point camera towards the sky or light source.',
      whyItMatters: 'Determines solar exposure and tall obstructions.',
      priority: 2
    }
  ]
};

/**
 * Capture Coverage Engine (Milestone 9)
 * Evaluates documented areas of real garden space, identifies missing views,
 * and adaptively recommends the next most useful action.
 */
export class CaptureCoverageEngine {
  /**
   * Evaluates coverage across a garden space
   */
  evaluateCoverage(space: GardenSpace): SpaceCaptureCoverage {
    const spaceType = space.type || 'balcony';
    const definitions = SPACE_VIEW_REQUIREMENTS[spaceType] || SPACE_VIEW_REQUIREMENTS.other;

    const mediaAssets = space.mediaAssets || [];
    const photos = space.photos || [];
    const userObs = space.userObservations || [];

    // Helper to find media linked to a view
    const viewItems: CaptureCoverageItem[] = definitions.map((def) => {
      const evidenceIds: string[] = [];
      let status: CoverageStatus = 'unknown';
      let confidence = 0;
      let reason = 'Not yet documented.';

      // 1. Direct media asset direction match
      mediaAssets.forEach((asset) => {
        const dir = (asset.direction || '').toLowerCase().trim();
        const purpose = (asset.purpose || '').toLowerCase().trim();

        if (dir === def.view || purpose.includes(def.view)) {
          evidenceIds.push(asset.id);
        } else if (def.view === 'floor' && (dir.includes('floor') || dir.includes('ground') || dir.includes('drain'))) {
          evidenceIds.push(asset.id);
        } else if (def.view === 'sky' && (dir.includes('sky') || dir.includes('light'))) {
          evidenceIds.push(asset.id);
        } else if (def.view === 'front' && (dir.includes('railing') || dir.includes('parapet') || dir.includes('window'))) {
          evidenceIds.push(asset.id);
        } else if (def.view === 'entrance' && (dir.includes('entrance') || dir.includes('door') || dir.includes('overview'))) {
          evidenceIds.push(asset.id);
        }
      });

      // 2. Fallback to photos if only 1 photo exists and this is the overview/entrance view
      if (evidenceIds.length === 0 && photos.length > 0) {
        if (def.view === 'entrance' || def.view === 'front') {
          evidenceIds.push(photos[0].id);
        }
      }

      // 3. User confirmable observations match
      const matchingObs = userObs.find((o) => {
        if (def.view === 'drainage' && o.category === 'drainage') return true;
        if (def.view === 'ceiling' && o.category === 'rain_exposure') return true;
        if (def.view === 'entrance' && o.category === 'walkway') return true;
        if (def.view === 'front' && o.category === 'railing_safety') return true;
        return false;
      });

      if (evidenceIds.length > 0) {
        if (evidenceIds.length >= 2 || matchingObs) {
          status = 'covered';
          confidence = 0.9;
          reason = `Documented with ${evidenceIds.length} media item(s)${matchingObs ? ' and user confirmation' : ''}.`;
        } else {
          status = 'partially_covered';
          confidence = 0.65;
          reason = `Visible in 1 media item; additional angle will increase certainty.`;
        }
      } else if (matchingObs) {
        status = 'needs_confirmation';
        confidence = 0.5;
        reason = `User reported "${matchingObs.value}", but no photographic evidence has been captured yet.`;
      }

      return {
        view: def.view,
        label: def.label,
        description: def.description,
        status,
        evidenceMediaIds: evidenceIds,
        confidence,
        reason,
        directionPrompt: def.directionPrompt,
        whyItMatters: def.whyItMatters
      };
    });

    const coveredCount = viewItems.filter((v) => v.status === 'covered').length;
    const partialCount = viewItems.filter((v) => v.status === 'partially_covered').length;
    const totalRequiredViews = definitions.length;

    // Overall confidence calculation
    const weightedScore = viewItems.reduce((acc, item) => acc + item.confidence, 0);
    const overallConfidence = totalRequiredViews > 0 ? Math.round((weightedScore / totalRequiredViews) * 100) / 100 : 0;

    // Missing views prioritized
    const missingImportantViews: CaptureView[] = definitions
      .sort((a, b) => a.priority - b.priority)
      .map((d) => d.view)
      .filter((v) => {
        const item = viewItems.find((vi) => vi.view === v);
        return !item || item.status === 'unknown' || item.status === 'needs_confirmation';
      });

    // Next recommended view (highest priority unfulfilled view)
    let nextRecommendedView: CaptureCoverageItem | undefined;
    for (const def of [...definitions].sort((a, b) => a.priority - b.priority)) {
      const match = viewItems.find((vi) => vi.view === def.view);
      if (match && match.status !== 'covered') {
        nextRecommendedView = match;
        break;
      }
    }

    return {
      spaceId: space.id,
      updatedAt: new Date().toISOString(),
      views: viewItems,
      overallConfidence,
      coveredCount: coveredCount + Math.floor(partialCount * 0.5),
      totalRequiredViews,
      missingImportantViews,
      nextRecommendedView
    };
  }

  /**
   * Returns quick guided prompts for user
   */
  getMissingViewPrompt(space: GardenSpace): {
    headline: string;
    description: string;
    actionLabel: string;
    view?: CaptureView;
    whyItMatters?: string;
  } {
    const coverage = this.evaluateCoverage(space);
    if (!coverage.nextRecommendedView) {
      return {
        headline: 'Space well documented! 🌱',
        description: 'You have captured all key angles needed for a safe, personalized layout plan.',
        actionLabel: 'View Garden Digital Twin'
      };
    }

    const next = coverage.nextRecommendedView;
    return {
      headline: `Next recommended view: ${next.label}`,
      description: next.directionPrompt || next.description,
      actionLabel: `Capture ${next.label}`,
      view: next.view,
      whyItMatters: next.whyItMatters
    };
  }
}

export const captureCoverageEngine = new CaptureCoverageEngine();
