import { describe, it, expect } from 'vitest';
import { captureCoverageEngine, SPACE_VIEW_REQUIREMENTS } from '../services/captureCoverageEngine';
import { spaceMeasurementEngine } from '../services/spaceMeasurementEngine';
import { usableSpaceEngine } from '../services/usableSpaceEngine';
import {
  GardenMediaAsset,
  GardenSpace,
  SpaceType
} from '../types';

describe('Milestone 9: Adaptive Space Scanning & Measurement Intelligence', () => {
  const createMockSpace = (type: SpaceType = 'balcony', overrides: Partial<GardenSpace> = {}): GardenSpace => ({
    id: 'space-test-m9',
    name: 'Balcony 3B',
    type,
    size: 'small',
    sunlight: '4_to_6h',
    goal: 'kitchen_garden',
    photos: [],
    plants: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  describe('2.2 & 2.3 Capture Coverage Profiles per Space Type', () => {
    it('provides space-specific requirements for balcony', () => {
      const balconyViews = SPACE_VIEW_REQUIREMENTS.balcony.map((v) => v.view);
      expect(balconyViews).toContain('entrance');
      expect(balconyViews).toContain('floor');
      expect(balconyViews).toContain('front');
      expect(balconyViews).toContain('left');
      expect(balconyViews).toContain('right');
      expect(balconyViews).toContain('ceiling');
      expect(balconyViews).toContain('sky');
    });

    it('provides space-specific requirements for terrace', () => {
      const terraceViews = SPACE_VIEW_REQUIREMENTS.terrace.map((v) => v.view);
      expect(terraceViews).toContain('entrance');
      expect(terraceViews).toContain('floor');
      expect(terraceViews).toContain('drainage');
      expect(terraceViews).toContain('boundary');
      expect(terraceViews).toContain('water_source');
    });

    it('provides space-specific requirements for windowsill & indoor rooms', () => {
      const windowViews = SPACE_VIEW_REQUIREMENTS.windowsill.map((v) => v.view);
      expect(windowViews).toContain('front');
      expect(windowViews).toContain('floor');
      expect(windowViews).toContain('sky');
      expect(windowViews).toContain('shade');
    });

    it('provides configurable fallback profile for custom/other spaces without failing', () => {
      const space = createMockSpace('other' as SpaceType);
      const coverage = captureCoverageEngine.evaluateCoverage(space);
      expect(coverage.views.length).toBeGreaterThan(0);
      expect(coverage.missingImportantViews.length).toBeGreaterThan(0);
    });
  });

  describe('2.4 Adaptive Recommendation & Evidence Evaluation', () => {
    it('identifies missing views when space has zero media', () => {
      const space = createMockSpace('balcony');
      const coverage = captureCoverageEngine.evaluateCoverage(space);

      expect(coverage.coveredCount).toBe(0);
      expect(coverage.overallConfidence).toBe(0);
      expect(coverage.missingImportantViews).toContain('entrance');
      expect(coverage.missingImportantViews).toContain('floor');
      expect(coverage.nextRecommendedView?.view).toBe('entrance');
    });

    it('reuses existing photo as overview/entrance evidence', () => {
      const space = createMockSpace('balcony', {
        photos: [
          {
            id: 'photo-1',
            dataUrl: 'data:image/jpeg;base64,mock',
            fileName: 'balcony_main.jpg',
            uploadedAt: new Date().toISOString()
          }
        ]
      });

      const coverage = captureCoverageEngine.evaluateCoverage(space);
      const entranceView = coverage.views.find((v) => v.view === 'entrance');
      expect(entranceView?.status).toBe('partially_covered');
      expect(entranceView?.evidenceMediaIds).toContain('photo-1');
    });

    it('marks view as covered when multiple evidence assets exist', () => {
      const assets: GardenMediaAsset[] = [
        {
          id: 'asset-floor-1',
          spaceId: 'space-test-m9',
          sessionId: 'session-1',
          type: 'photo',
          source: 'camera',
          createdAt: new Date().toISOString(),
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          direction: 'floor'
        },
        {
          id: 'asset-floor-2',
          spaceId: 'space-test-m9',
          sessionId: 'session-1',
          type: 'photo',
          source: 'camera',
          createdAt: new Date().toISOString(),
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          direction: 'floor'
        }
      ];

      const space = createMockSpace('balcony', { mediaAssets: assets });
      const coverage = captureCoverageEngine.evaluateCoverage(space);
      const floorView = coverage.views.find((v) => v.view === 'floor');

      expect(floorView?.status).toBe('covered');
      expect(floorView?.confidence).toBe(0.9);
      expect(floorView?.evidenceMediaIds.length).toBe(2);
    });

    it('does not repeatedly request an already covered view', () => {
      const assets: GardenMediaAsset[] = [
        {
          id: 'asset-ent-1',
          spaceId: 'space-test-m9',
          sessionId: 'session-1',
          type: 'photo',
          source: 'camera',
          createdAt: new Date().toISOString(),
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          direction: 'entrance'
        },
        {
          id: 'asset-ent-2',
          spaceId: 'space-test-m9',
          sessionId: 'session-1',
          type: 'photo',
          source: 'camera',
          createdAt: new Date().toISOString(),
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          direction: 'entrance'
        }
      ];

      const space = createMockSpace('balcony', { mediaAssets: assets });
      const prompt = captureCoverageEngine.getMissingViewPrompt(space);

      // Entrance is covered, so it should recommend the next priority view (floor)
      expect(prompt.view).not.toBe('entrance');
      expect(prompt.view).toBe('floor');
    });

    it('preserves user-confirmed observations distinctly and improves coverage confidence', () => {
      const space = createMockSpace('balcony', {
        userObservations: [
          {
            id: 'obs-rain-1',
            spaceId: 'space-test-m9',
            category: 'rain_exposure',
            question: 'Is this area exposed to rain?',
            value: 'Partially Sheltered',
            confirmedAt: new Date().toISOString(),
            source: 'user_confirmed'
          }
        ]
      });

      const coverage = captureCoverageEngine.evaluateCoverage(space);
      const ceilingView = coverage.views.find((v) => v.view === 'ceiling');

      expect(ceilingView?.status).toBe('needs_confirmation');
      expect(ceilingView?.reason).toContain('User reported "Partially Sheltered"');
    });
  });

  describe('2.5 Space Measurement Intelligence', () => {
    it('converts length units accurately (m, cm, ft)', () => {
      // 1 meter = ~3.28 ft
      expect(spaceMeasurementEngine.convertLength(1, 'm', 'ft')).toBe(3.28);
      // 60 cm = ~1.97 ft
      expect(spaceMeasurementEngine.convertLength(60, 'cm', 'ft')).toBe(1.97);
      // 10 ft = ~3.05 m
      expect(spaceMeasurementEngine.convertLength(10, 'ft', 'm')).toBe(3.05);
    });

    it('converts area units accurately (m2, ft2)', () => {
      // 10 m2 = ~107.6 ft2
      expect(spaceMeasurementEngine.convertArea(10, 'm2', 'ft2')).toBe(107.6);
      // 100 ft2 = ~9.29 m2
      expect(spaceMeasurementEngine.convertArea(100, 'ft2', 'm2')).toBe(9.29);
    });

    it('calibrates space dimensions from known floor tile size without assuming standards', () => {
      // 5 tiles across x 60 cm = 300 cm -> 9.8 ft
      const measurement = spaceMeasurementEngine.calibrateFromTiles(
        'space-test-m9',
        5,
        60,
        'Balcony Width'
      );

      expect(measurement.value).toBe(9.8);
      expect(measurement.unit).toBe('ft');
      expect(measurement.source).toBe('reference_calibrated');
      expect(measurement.confidence).toBe(0.85);
      expect(measurement.notes).toContain('5 floor tiles');
    });

    it('derives default measurements with explicit visual_estimate source when not measured', () => {
      const space = createMockSpace('balcony', { size: 'small' });
      const measurements = spaceMeasurementEngine.getMeasurementsForSpace(space);

      expect(measurements.length).toBe(2);
      expect(measurements[0].source).toBe('visual_estimate');
      expect(measurements[0].confidence).toBe(0.45);
      expect(measurements[0].notes).toContain('Planning assumption');
    });

    it('preserves user-measured dimensions when provided during space setup', () => {
      const space = createMockSpace('balcony', {
        dimensions: { width: '8.5', length: '5.0', unit: 'ft' }
      });
      const measurements = spaceMeasurementEngine.getMeasurementsForSpace(space);

      expect(measurements.length).toBe(2);
      expect(measurements[0].value).toBe(8.5);
      expect(measurements[0].source).toBe('user_measured');
      expect(measurements[0].confidence).toBe(0.95);
    });
  });

  describe('2.6 Usable Space Calculation & Walkway Protection', () => {
    it('calculates usable planting area subtracting walkway and obstacles', () => {
      const space = createMockSpace('balcony', {
        dimensions: { width: '10', length: '6', unit: 'ft' }
      });

      const usable = usableSpaceEngine.calculateUsableSpace(space);

      // Total: 10 x 6 = 60 sq ft
      expect(usable.totalFloorAreaSqFt).toBe(60);
      // Central walkway: 6ft depth x 2ft width = 12 sq ft
      expect(usable.walkingAreaSqFt).toBe(12);
      // Net usable planting: 60 - 12 = 48 sq ft
      expect(usable.usablePlantingAreaSqFt).toBe(48);
      expect(usable.unit).toBe('sq_ft');
    });

    it('respects configurable minimum walkway width', () => {
      const space = createMockSpace('balcony', {
        dimensions: { width: '10', length: '6', unit: 'ft' }
      });

      const usable = usableSpaceEngine.calculateUsableSpace(space, {
        minWalkwayWidthFt: 2.5
      });

      expect(usable.walkingAreaSqFt).toBe(15); // 6 x 2.5 = 15 sq ft
      expect(usable.usablePlantingAreaSqFt).toBe(45); // 60 - 15 = 45 sq ft
    });

    it('flags warning when containers exceed usable floor perimeter', () => {
      const space = createMockSpace('balcony', {
        dimensions: { width: '4', length: '3', unit: 'ft' }, // Total: 12 sq ft, walkway takes ~3.6
        layout: {
          zones: [],
          containers: [
            { id: 'c1', spaceId: 's1', name: 'Pot 1', type: 'pot', size: 'large' },
            { id: 'c2', spaceId: 's1', name: 'Pot 2', type: 'pot', size: 'large' },
            { id: 'c3', spaceId: 's1', name: 'Pot 3', type: 'pot', size: 'large' },
            { id: 'c4', spaceId: 's1', name: 'Pot 4', type: 'pot', size: 'large' }
          ],
          plantPlacements: [],
          updatedAt: new Date().toISOString()
        }
      });

      const usable = usableSpaceEngine.calculateUsableSpace(space);
      expect(usable.warnings.some((w) => w.includes('exceed estimated perimeter'))).toBe(true);
    });

    it('flags structural safety disclaimers for balcony railings and rooftop slabs', () => {
      const balconySpace = createMockSpace('balcony');
      const balconyUsable = usableSpaceEngine.calculateUsableSpace(balconySpace);
      expect(balconyUsable.warnings.some((w) => w.includes('Railing planter load limit'))).toBe(true);

      const terraceSpace = createMockSpace('terrace', {
        layout: {
          zones: [],
          containers: Array(7).fill(0).map((_, i) => ({
            id: `c-${i}`,
            spaceId: 's1',
            name: `Grow Bag ${i}`,
            type: 'grow_bag',
            size: 'large'
          })),
          plantPlacements: [],
          updatedAt: new Date().toISOString()
        }
      });
      const terraceUsable = usableSpaceEngine.calculateUsableSpace(terraceSpace);
      expect(terraceUsable.warnings.some((w) => w.includes('roof slab'))).toBe(true);
    });

    it('labels output confidence explicitly as rough_estimate when using category defaults', () => {
      const space = createMockSpace('balcony'); // No dimensions
      const usable = usableSpaceEngine.calculateUsableSpace(space);

      expect(usable.confidence).toBe('rough_estimate');
      expect(usable.assumptions.some((a) => a.includes('approximate'))).toBe(true);
    });
  });
});
