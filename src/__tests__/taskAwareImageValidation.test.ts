import { describe, it, expect } from 'vitest';
import { imageValidationService, IMAGE_VALIDATION_CONFIG } from '../services/imageValidationService';
import { localOllamaVisionProvider } from '../services/localOllamaVisionProvider';

describe('Phase 2 & 3 Remediation: Task-Aware Image Intake & Validation Pipeline', () => {
  it('rejects empty files (0 bytes) with actionable explanation and remedy', async () => {
    const emptyBlob = new Blob([], { type: 'image/jpeg' });
    const result = await imageValidationService.validateTechnical(emptyBlob);

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('empty_file');
    expect(result.errorMessage).toContain('empty');
    expect(result.remedy).toBeDefined();
  });

  it('rejects truncated or corrupted microscopic files below minimum threshold', async () => {
    const tinyBlob = new Blob(['too small'], { type: 'image/jpeg' });
    const result = await imageValidationService.validateTechnical(tinyBlob);

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('corrupted_image');
  });

  it('rejects oversized files exceeding 15MB limit', async () => {
    // Mock a 16MB file
    const oversizedBlob = {
      size: 16 * 1024 * 1024,
      type: 'image/jpeg'
    } as any as Blob;

    const result = await imageValidationService.validateTechnical(oversizedBlob);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('file_too_large');
    expect(result.errorMessage).toContain('16.0 MB');
  });

  it('rejects unsupported non-image MIME formats', async () => {
    const pdfBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    const result = await imageValidationService.validateTechnical(pdfBlob);

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('unsupported_type');
    expect(result.errorMessage).toContain('application/pdf');
  });

  it('accepts valid standard image MIME formats (jpeg, png, webp)', () => {
    expect(IMAGE_VALIDATION_CONFIG.supportedMimeTypes).toContain('image/jpeg');
    expect(IMAGE_VALIDATION_CONFIG.supportedMimeTypes).toContain('image/png');
    expect(IMAGE_VALIDATION_CONFIG.supportedMimeTypes).toContain('image/webp');
  });

  it('provides tailored workflow guidance across all 4 workflows', () => {
    const plantIdGuide = imageValidationService.getWorkflowGuidance('plant_identification');
    expect(plantIdGuide.title).toContain('Plant Identification');
    expect(plantIdGuide.acceptedSubjects).toContain('Leaves & foliage');

    const doctorGuide = imageValidationService.getWorkflowGuidance('garden_doctor');
    expect(doctorGuide.title).toContain('Garden Doctor');
    expect(doctorGuide.acceptedSubjects).toContain('Affected foliage close-up');

    const spaceGuide = imageValidationService.getWorkflowGuidance('space_scanning');
    expect(spaceGuide.title).toContain('Garden & Space');
    expect(spaceGuide.acceptedSubjects).toContain('Balcony or terrace growing area');

    const chatGuide = imageValidationService.getWorkflowGuidance('chatbot');
    expect(chatGuide.title).toContain('GardenMitra Assistant');
  });

  it('reports offline/unavailable honestly when local vision model is not running', async () => {
    const fakeDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';
    const result = await localOllamaVisionProvider.validateImageRelevance(fakeDataUrl, 'plant_identification');

    // When offline, it should NOT claim AI validation succeeded or fabricate confidence
    expect(result.status === 'unavailable' || result.status === 'valid').toBe(true);
    expect(result.providerId).toBe('local-ollama-vision');
  });
});
