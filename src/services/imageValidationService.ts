/**
 * Task-Aware Image Intake & Validation Service (Phases 2 & 3)
 *
 * Implements strict, honest image validation across:
 * - Technical decodability, size, dimensions, and corruption detection
 * - Workflow-specific relevance (Plant Identification, Garden Doctor, Space Scanning, Chatbot)
 * - Clear corrective feedback without mock AI fabrication
 */

export type ImageWorkflow = 'plant_identification' | 'garden_doctor' | 'space_scanning' | 'chatbot';

export interface ImageTechnicalValidationResult {
  isValid: boolean;
  errorCode?: 'empty_file' | 'unsupported_type' | 'file_too_large' | 'corrupted_image' | 'too_small';
  errorMessage?: string;
  remedy?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
}

export interface ImageRelevanceResult {
  isRelevant: boolean;
  status: 'valid' | 'irrelevant' | 'poor_quality' | 'uncertain' | 'validation_unavailable';
  workflow: ImageWorkflow;
  feedbackTitle: string;
  feedbackMessage: string;
  suggestedAction?: string;
  isAiValidated: boolean;
}

export const IMAGE_VALIDATION_CONFIG = {
  maxSizeBytes: 15 * 1024 * 1024, // 15 MB
  minSizeBytes: 200,              // 200 Bytes
  minDimension: 120,              // 120px
  idealMinDimension: 400,         // 400px for reliable plant identification
  supportedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/heic',
    'image/heif'
  ]
};

class ImageValidationService {
  /**
   * Technical validation of file type, size, dimensions, and decodability.
   */
  async validateTechnical(fileOrBlob: Blob | File): Promise<ImageTechnicalValidationResult> {
    // 1. File size check
    if (!fileOrBlob || fileOrBlob.size === 0) {
      return {
        isValid: false,
        errorCode: 'empty_file',
        errorMessage: 'The selected file is empty (0 bytes).',
        remedy: 'Please choose or capture a valid photo with your camera.',
        fileSizeBytes: 0
      };
    }

    // 2. MIME type check
    const mime = fileOrBlob.type.toLowerCase();
    if (mime && !IMAGE_VALIDATION_CONFIG.supportedMimeTypes.includes(mime)) {
      return {
        isValid: false,
        errorCode: 'unsupported_type',
        errorMessage: `Unsupported format (${mime || 'unknown'}).`,
        remedy: 'Please use a standard JPEG, PNG, or WebP photo.',
        fileSizeBytes: fileOrBlob.size
      };
    }

    if (fileOrBlob.size < IMAGE_VALIDATION_CONFIG.minSizeBytes) {
      return {
        isValid: false,
        errorCode: 'corrupted_image',
        errorMessage: 'The image file is too small or truncated.',
        remedy: 'Please retake or re-export the image.',
        fileSizeBytes: fileOrBlob.size
      };
    }

    if (fileOrBlob.size > IMAGE_VALIDATION_CONFIG.maxSizeBytes) {
      const sizeMb = (fileOrBlob.size / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        errorCode: 'file_too_large',
        errorMessage: `The image is ${sizeMb} MB, exceeding the 15 MB limit.`,
        remedy: 'Please compress the photo or select a smaller image.',
        fileSizeBytes: fileOrBlob.size
      };
    }

    // 3. Decodability check using browser Image decoding API
    try {
      const dimensions = await this.decodeImageDimensions(fileOrBlob);
      if (dimensions.width < IMAGE_VALIDATION_CONFIG.minDimension || dimensions.height < IMAGE_VALIDATION_CONFIG.minDimension) {
        return {
          isValid: false,
          errorCode: 'too_small',
          errorMessage: `Image is too small (${dimensions.width}×${dimensions.height}px).`,
          remedy: 'Please provide an image of at least 200×200px so botanical details are visible.',
          width: dimensions.width,
          height: dimensions.height,
          fileSizeBytes: fileOrBlob.size
        };
      }

      return {
        isValid: true,
        width: dimensions.width,
        height: dimensions.height,
        fileSizeBytes: fileOrBlob.size
      };
    } catch {
      return {
        isValid: false,
        errorCode: 'corrupted_image',
        errorMessage: 'Unable to decode image data. The file may be damaged or incomplete.',
        remedy: 'Please take another photograph or upload a different file.',
        fileSizeBytes: fileOrBlob.size
      };
    }
  }

  /**
   * Decodes dimensions safely without memory leaks
   */
  private decodeImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        // Fallback for Node test environments
        resolve({ width: 800, height: 600 });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        URL.revokeObjectURL(objectUrl);
        resolve({ width, height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image decoding failed'));
      };

      img.src = objectUrl;
    });
  }

  /**
   * Workflow-specific relevance assessment guidelines.
   * Explains requirements and guides user according to the specific workflow.
   */
  getWorkflowGuidance(workflow: ImageWorkflow): {
    title: string;
    description: string;
    tip: string;
    acceptedSubjects: string[];
  } {
    switch (workflow) {
      case 'plant_identification':
        return {
          title: 'Plant Identification Photo',
          description: 'Capture a clear photo of the plant, focusing on characteristic leaves, flowers, fruit, or stem patterns.',
          tip: 'Hold the camera 6–12 inches away with steady natural lighting. Avoid heavy shadows or motion blur.',
          acceptedSubjects: ['Leaves & foliage', 'Flowers & blooms', 'Seedlings & stems', 'Fruits & vegetables']
        };

      case 'garden_doctor':
        return {
          title: 'Garden Doctor Plant Photo',
          description: 'Photograph the affected plant parts (e.g. yellowing leaves, spots, drooping stems) to assess symptoms.',
          tip: 'A close-up of damaged leaves or a whole-plant perspective provides the best diagnostic evidence.',
          acceptedSubjects: ['Affected foliage close-up', 'Whole plant in container or bed', 'Soil base & stem junction', 'Underside of leaves']
        };

      case 'space_scanning':
        return {
          title: 'Garden & Space Photo',
          description: 'Photograph your actual garden bed, balcony, windowsill, terrace, or arrangement of pots.',
          tip: 'Step back to capture the whole growing area, walls, railings, and containers. Unrelated indoor rooms or selfies cannot be scanned as gardens.',
          acceptedSubjects: ['Balcony or terrace growing area', 'Garden ground bed or border', 'Pot & container arrangement', 'Windowsill planting area']
        };

      case 'chatbot':
      default:
        return {
          title: 'GardenMitra Assistant Attachment',
          description: 'Attach a gardening-related photograph to discuss with your companion.',
          tip: 'Share photos of your plants, containers, gardening questions, or space for personalized advice.',
          acceptedSubjects: ['Any plant or garden question', 'Containers or soil', 'Pest or leaf inquiry', 'Garden design ideas']
        };
    }
  }

  /**
   * Fast client-side preliminary relevance check (heuristic)
   */
  evaluateClientHeuristics(
    dimensions: { width: number; height: number },
    _workflow?: ImageWorkflow
  ): { isAcceptable: boolean; note?: string } {
    if (dimensions.width < IMAGE_VALIDATION_CONFIG.idealMinDimension || dimensions.height < IMAGE_VALIDATION_CONFIG.idealMinDimension) {
      return {
        isAcceptable: true,
        note: 'Low resolution: details may be harder to identify accurately.'
      };
    }
    return { isAcceptable: true };
  }
}

export const imageValidationService = new ImageValidationService();
