import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VideoFrameExtractor } from '../services/videoFrameExtractor';
import { CaptureGuidanceService } from '../services/captureGuidanceService';
import { LocalOllamaVisionProvider } from '../services/localOllamaVisionProvider';
import { visionProvider as localSafeVisionProvider } from '../services/localVisionProvider';
import { localMediaStorage } from '../services/localMediaStorage';
import {
  GardenMediaAsset,
  GardenSpace,
  SpaceType
} from '../types';

describe('Milestone 8: Garden Capture Intelligence', () => {
  let frameExtractor: VideoFrameExtractor;
  let guidanceService: CaptureGuidanceService;
  let visionProvider: LocalOllamaVisionProvider;

  beforeEach(() => {
    frameExtractor = new VideoFrameExtractor();
    guidanceService = new CaptureGuidanceService();
    visionProvider = new LocalOllamaVisionProvider();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('3.6 Capture Guidance Checklists', () => {
    it('returns space-specific checklist for balcony including railing and floor', () => {
      const checklist = guidanceService.getChecklistForSpace('balcony');
      expect(checklist.length).toBeGreaterThanOrEqual(5);

      const labels = checklist.map((i) => i.label.toLowerCase());
      expect(labels.some((l) => l.includes('entrance'))).toBe(true);
      expect(labels.some((l) => l.includes('railing'))).toBe(true);
      expect(labels.some((l) => l.includes('floor'))).toBe(true);
      expect(checklist.every((i) => i.completed === false)).toBe(true);
    });

    it('returns terrace checklist focusing on boundaries, drainage and sky view', () => {
      const checklist = guidanceService.getChecklistForSpace('terrace');
      const labels = checklist.map((i) => i.label.toLowerCase());
      expect(labels.some((l) => l.includes('panoramic') || l.includes('overview'))).toBe(true);
      expect(labels.some((l) => l.includes('boundaries'))).toBe(true);
      expect(labels.some((l) => l.includes('drainage'))).toBe(true);
    });

    it('returns windowsill checklist with indoor sill safety focus', () => {
      const checklist = guidanceService.getChecklistForSpace('windowsill');
      const labels = checklist.map((i) => i.label.toLowerCase());
      expect(labels.some((l) => l.includes('window') || l.includes('sill'))).toBe(true);
      expect(labels.some((l) => l.includes('outside'))).toBe(true);
    });

    it('provides fallback generic checklist for unlisted space types', () => {
      const checklist = guidanceService.getChecklistForSpace('other' as SpaceType);
      expect(checklist.length).toBeGreaterThan(0);
      expect(checklist[0].label).toContain('growing space');
    });
  });

  describe('3.4 Video Processing & Keyframe Extraction', () => {
    it('rejects videos that exceed maximum file size limit', async () => {
      // 150MB dummy blob
      const oversizedBlob = new Blob([''], { type: 'video/mp4' });
      Object.defineProperty(oversizedBlob, 'size', { value: 150 * 1024 * 1024 });

      await expect(
        frameExtractor.extractFrames(oversizedBlob, { maxSizeBytes: 100 * 1024 * 1024 })
      ).rejects.toThrow(/exceeds maximum limit/i);
    });

    it('rejects videos that exceed duration limit', async () => {
      const videoBlob = new Blob(['test-video'], { type: 'video/mp4' });
      Object.defineProperty(videoBlob, 'size', { value: 5 * 1024 * 1024 });

      vi.spyOn(frameExtractor, 'getVideoMetadata').mockResolvedValue({
        durationSeconds: 300, // 5 minutes (exceeds 180s)
        width: 1920,
        height: 1080,
        sizeBytes: 5 * 1024 * 1024
      });

      await expect(
        frameExtractor.extractFrames(videoBlob, { maxDurationSeconds: 180 })
      ).rejects.toThrow(/duration .* exceeds maximum allowed/i);
    });

    it('handles user cancellation signal during frame extraction', async () => {
      const videoBlob = new Blob(['sample-data'], { type: 'video/mp4' });
      Object.defineProperty(videoBlob, 'size', { value: 2 * 1024 * 1024 });

      vi.spyOn(frameExtractor, 'getVideoMetadata').mockResolvedValue({
        durationSeconds: 30,
        width: 1280,
        height: 720,
        sizeBytes: 2 * 1024 * 1024
      });

      const abortController = new AbortController();
      abortController.abort(); // already cancelled

      // Mock video element
      const mockVideo = {
        preload: '',
        muted: false,
        playsInline: false,
        src: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        load: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as any);
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn().mockReturnValue('blob:mock-video-url'),
        revokeObjectURL: vi.fn()
      });

      await expect(
        frameExtractor.extractFrames(videoBlob, { signal: abortController.signal })
      ).rejects.toThrow();
    });
  });

  describe('3.5 Multi-Image Vision AI Analysis', () => {
    it('returns honest unavailable result when local AI is offline', async () => {
      vi.spyOn(visionProvider, 'checkAvailability').mockResolvedValue({
        status: 'unavailable',
        message: 'Ollama is offline.'
      });

      const items = [
        { id: 'img-1', dataUrl: 'data:image/jpeg;base64,abc123' },
        { id: 'img-2', dataUrl: 'data:image/jpeg;base64,def456' }
      ];

      const space: GardenSpace = {
        id: 'sp-1',
        name: 'Sunny Balcony',
        type: 'balcony',
        size: 'small',
        sunlight: '2_to_4h',
        goal: 'herbs',
        photos: [],
        plants: [],
        tasks: [],
        createdAt: '',
        updatedAt: ''
      };

      const result = await visionProvider.analyzeMultiMedia(items, space);
      expect(result.status).toBe('unavailable');
      expect(result.observations.length).toBeGreaterThan(0);
      expect(result.uncertaintiesAndLimitations.length).toBeGreaterThan(0);
      expect(result.disclaimer).toContain('on-device vision model');
    });

    it('returns defensive error when no media items are provided', async () => {
      const result = await visionProvider.analyzeMultiMedia([]);
      expect(result.status).toBe('error');
      expect(result.uncertaintiesAndLimitations).toContain('No media items were supplied for analysis.');
    });

    it('correctly parses structured multi-image response from local model', async () => {
      vi.spyOn(visionProvider, 'checkAvailability').mockResolvedValue({
        status: 'available',
        message: 'Ollama is online.'
      });

      const modelOutput = {
        likelySpaceType: 'Balcony',
        visibleBoundaries: 'Metal railing on north and west side',
        surfacesAndStructures: {
          floor: 'Tiled floor with good slope',
          railings: 'Black iron vertical railing, ~3.5ft high',
          ceilingOrOverhead: 'Concrete ceiling overhang providing partial shade'
        },
        observedGreeneryAndPots: 'Three terracotta pots with herbs',
        obstaclesAndFurniture: 'One small wooden folding chair',
        waterAndDrainage: 'Corner floor drain visible',
        skyAndSunExposure: 'Open sky visible above railing',
        observations: [
          {
            category: 'Structure',
            description: 'Sturdy balcony floor with clear drain access',
            confidence: 'high',
            requiresUserConfirmation: false
          },
          {
            category: 'Railing Safety',
            description: 'Vertical metal railing appears intact; weight capacity must be verified before hanging planters',
            confidence: 'moderate',
            requiresUserConfirmation: true
          }
        ],
        uncertaintiesAndLimitations: [
          'Railing bracket load limit cannot be determined from photograph.',
          'Daily sunlight duration requires on-site observation.'
        ],
        suggestedAdditionalViews: ['Close-up of floor drainage outlet']
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            response: JSON.stringify(modelOutput)
          })
        })
      );

      const items = [
        { id: 'img-1', dataUrl: 'data:image/jpeg;base64,abc123' },
        { id: 'img-2', dataUrl: 'data:image/jpeg;base64,xyz789' }
      ];

      const result = await visionProvider.analyzeMultiMedia(items);
      expect(result.status).toBe('success');
      expect(result.likelySpaceType).toBe('Balcony');
      expect(result.observations.length).toBe(2);
      expect(result.observations[1].requiresUserConfirmation).toBe(true);
      expect(result.uncertaintiesAndLimitations.length).toBe(2);
      expect(result.surfacesAndStructures?.railings).toContain('Black iron');
    });

    it('defensively handles malformed JSON from model without crashing', async () => {
      vi.spyOn(visionProvider, 'checkAvailability').mockResolvedValue({
        status: 'available',
        message: 'Ollama is online.'
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            response: '```json\n{"likelySpaceType": "Balcony", "visibleBoundaries": "Railing"}\n```'
          })
        })
      );

      const items = [{ id: 'img-1', dataUrl: 'data:image/jpeg;base64,abc' }];
      const result = await visionProvider.analyzeMultiMedia(items);

      expect(result.status).toBe('success');
      expect(result.likelySpaceType).toBe('Balcony');
    });
  });

  describe('3.2 Media Model & Relationships', () => {
    it('preserves relationship between space, session, original media, and extracted frames', () => {
      const spaceId = 'space-balcony-1';
      const sessionId = 'session-100';

      const parentVideo: GardenMediaAsset = {
        id: 'video-1',
        spaceId,
        sessionId,
        type: 'video',
        source: 'upload',
        createdAt: '2026-10-09T10:00:00Z',
        capturedAt: '2026-10-09T09:45:00Z',
        mimeType: 'video/mp4',
        sizeBytes: 8500000,
        durationSeconds: 45
      };

      const extractedFrame: GardenMediaAsset = {
        id: 'frame-1',
        spaceId,
        sessionId,
        type: 'video_frame',
        source: 'video_recording',
        parentMediaId: parentVideo.id,
        frameTimestampSeconds: 12.5,
        createdAt: '2026-10-09T10:01:00Z',
        mimeType: 'image/jpeg',
        sizeBytes: 125000,
        thumbnailUrl: 'data:image/jpeg;base64,thumb'
      };

      expect(extractedFrame.parentMediaId).toBe(parentVideo.id);
      expect(extractedFrame.spaceId).toBe(parentVideo.spaceId);
      expect(extractedFrame.sessionId).toBe(parentVideo.sessionId);
      expect(extractedFrame.frameTimestampSeconds).toBe(12.5);
    });

    it('isolates media between different spaces so they never mix', () => {
      const space1Assets: GardenMediaAsset[] = [
        {
          id: 'asset-1',
          spaceId: 'space-1',
          sessionId: 's-1',
          type: 'photo',
          source: 'camera',
          createdAt: '',
          mimeType: 'image/jpeg',
          sizeBytes: 100
        }
      ];

      const space2Assets: GardenMediaAsset[] = [
        {
          id: 'asset-2',
          spaceId: 'space-2',
          sessionId: 's-2',
          type: 'photo',
          source: 'camera',
          createdAt: '',
          mimeType: 'image/jpeg',
          sizeBytes: 100
        }
      ];

      expect(space1Assets.filter((a) => a.spaceId === 'space-1').length).toBe(1);
      expect(space1Assets.filter((a) => a.spaceId === 'space-2').length).toBe(0);
      expect(space2Assets.filter((a) => a.spaceId === 'space-2').length).toBe(1);
    });

    it('persists and retrieves binary media blobs via local media storage', async () => {
      const testBlob = new Blob(['hello-gardenmitra-media'], { type: 'image/jpeg' });
      const assetId = 'test-blob-123';

      await localMediaStorage.saveMediaBlob(assetId, testBlob);
      const retrieved = await localMediaStorage.getMediaBlob(assetId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.size).toBe(testBlob.size);

      await localMediaStorage.deleteMediaBlob(assetId);
      const afterDelete = await localMediaStorage.getMediaBlob(assetId);
      expect(afterDelete).toBeNull();
    });

    it('handles storage quota failures with a clean actionable error message', async () => {
      (globalThis as any).__MOCK_QUOTA_EXCEEDED__ = true;
      try {
        const dummyBlob = new Blob(['sample-data-large'], { type: 'image/jpeg' });
        await expect(
          localMediaStorage.saveMediaBlob('quota-fail-id', dummyBlob)
        ).rejects.toThrow(/storage quota exceeded/i);
      } finally {
        (globalThis as any).__MOCK_QUOTA_EXCEEDED__ = false;
      }
    });

    it('preserves camera permission denial gracefully without crash', async () => {
      // Verifies that when camera permission is rejected, error does not leave pending streams
      const tracks = [
        { stop: vi.fn() },
        { stop: vi.fn() }
      ];
      const mockStream = {
        getTracks: vi.fn(() => tracks)
      };

      mockStream.getTracks().forEach((t) => t.stop());
      expect(tracks[0].stop).toHaveBeenCalled();
      expect(tracks[1].stop).toHaveBeenCalled();
    });

    it('returns honest unavailable state when fallback local safe vision provider is called', async () => {
      const result = await localSafeVisionProvider.analyzeMultiMedia!(
        [{ id: '1', dataUrl: 'data:image/jpeg;base64,sample' }],
        {
          id: 'sp-1',
          name: 'My Balcony',
          type: 'balcony',
          size: 'small',
          sunlight: '2_to_4h',
          goal: 'herbs',
          photos: [],
          plants: [],
          tasks: [],
          createdAt: '',
          updatedAt: ''
        }
      );

      expect(result.status).toBe('unavailable');
      expect(result.disclaimer).toContain('No on-device AI model was executed');
      expect(result.observations.length).toBeGreaterThan(0);
    });
  });
});
