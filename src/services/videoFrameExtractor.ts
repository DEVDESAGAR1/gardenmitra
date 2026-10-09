import { ExtractedVideoFrame } from '../types';

export interface VideoExtractionOptions {
  maxFrames?: number;
  intervalSeconds?: number;
  maxDimension?: number;
  maxDurationSeconds?: number;
  maxSizeBytes?: number;
  signal?: AbortSignal;
  onProgress?: (progress: number, currentFrame: number, totalFrames: number) => void;
}

export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  sizeBytes: number;
}

const DEFAULT_MAX_FRAMES = 6;
const DEFAULT_MAX_DIMENSION = 960;
const DEFAULT_MAX_DURATION = 180; // 3 minutes max
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Browser Video Frame Extractor (Milestone 8)
 * Extracts keyframes deterministically across a video walkthrough of a garden space.
 * Clean, safe, and memory-efficient.
 */
export class VideoFrameExtractor {
  /**
   * Read video metadata before frame extraction
   */
  async getVideoMetadata(videoBlob: Blob): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(videoBlob);

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.src = '';
        video.load();
      };

      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          durationSeconds: video.duration || 0,
          width: video.videoWidth || 640,
          height: video.videoHeight || 480,
          sizeBytes: videoBlob.size
        };
        cleanup();
        resolve(metadata);
      };

      video.onerror = () => {
        cleanup();
        reject(
          new Error(
            'Cannot decode video format. Your browser might not support this video codec or the file is corrupted.'
          )
        );
      };

      video.src = url;
    });
  }

  /**
   * Extracts sampled frames across video duration
   */
  async extractFrames(
    videoBlob: Blob,
    options: VideoExtractionOptions = {}
  ): Promise<ExtractedVideoFrame[]> {
    const maxFrames = options.maxFrames ?? DEFAULT_MAX_FRAMES;
    const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
    const maxDuration = options.maxDurationSeconds ?? DEFAULT_MAX_DURATION;
    const maxSize = options.maxSizeBytes ?? DEFAULT_MAX_SIZE;
    const signal = options.signal;

    if (videoBlob.size > maxSize) {
      throw new Error(
        `Video size (${Math.round(videoBlob.size / (1024 * 1024))}MB) exceeds maximum limit (${Math.round(
          maxSize / (1024 * 1024)
        )}MB). Please choose a shorter or compressed clip.`
      );
    }

    const metadata = await this.getVideoMetadata(videoBlob);
    if (metadata.durationSeconds <= 0) {
      throw new Error('Video duration could not be determined or is zero.');
    }

    if (metadata.durationSeconds > maxDuration) {
      throw new Error(
        `Video duration (${Math.round(metadata.durationSeconds)}s) exceeds maximum allowed (${maxDuration}s). GardenMitra recommends short 30-90s garden walkarounds.`
      );
    }

    // Determine target sample timestamps
    const sampleCount = Math.min(maxFrames, Math.max(2, Math.floor(metadata.durationSeconds / 3)));
    const targetTimestamps: number[] = [];

    // Avoid taking frame at exactly 0.0s (often black / blank) or right at end
    const startOffset = Math.min(0.5, metadata.durationSeconds * 0.05);
    const endOffset = Math.max(metadata.durationSeconds - 0.5, metadata.durationSeconds * 0.95);
    const step = (endOffset - startOffset) / (sampleCount - 1 || 1);

    for (let i = 0; i < sampleCount; i++) {
      targetTimestamps.push(Number((startOffset + i * step).toFixed(2)));
    }

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const videoUrl = URL.createObjectURL(videoBlob);
    video.src = videoUrl;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(videoUrl);
      throw new Error('Unable to create canvas rendering context for video frame processing.');
    }

    // Calculate scaled dimensions
    let targetWidth = metadata.width;
    let targetHeight = metadata.height;
    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
        targetHeight = maxDimension;
      }
    }
    canvas.width = Math.max(1, targetWidth);
    canvas.height = Math.max(1, targetHeight);

    const extractedFrames: ExtractedVideoFrame[] = [];

    try {
      // Wait for canplay / seekable
      await new Promise<void>((res, rej) => {
        video.onloadeddata = () => res();
        video.onerror = () => rej(new Error('Video loading failed during frame extraction.'));
      });

      for (let idx = 0; idx < targetTimestamps.length; idx++) {
        if (signal?.aborted) {
          throw new Error('Frame extraction cancelled by user.');
        }

        const targetTime = targetTimestamps[idx];

        // Seek video
        await new Promise<void>((seekRes) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            seekRes();
          };
          video.addEventListener('seeked', onSeeked);
          video.currentTime = targetTime;
        });

        // Draw frame to scaled canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to Blob & DataURL
        const frameBlob = await new Promise<Blob | null>((blobRes) => {
          canvas.toBlob((b) => blobRes(b), 'image/jpeg', 0.85);
        });

        if (!frameBlob) {
          continue;
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        extractedFrames.push({
          timestampSeconds: targetTime,
          blob: frameBlob,
          width: canvas.width,
          height: canvas.height,
          dataUrl
        });

        if (options.onProgress) {
          const progressPercent = Math.round(((idx + 1) / targetTimestamps.length) * 100);
          options.onProgress(progressPercent, idx + 1, targetTimestamps.length);
        }
      }
    } finally {
      URL.revokeObjectURL(videoUrl);
      video.src = '';
      video.load();
    }

    return extractedFrames;
  }
}

export const videoFrameExtractor = new VideoFrameExtractor();
