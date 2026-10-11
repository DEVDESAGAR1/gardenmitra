import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';
import {
  imageValidationService,
  ImageWorkflow,
  ImageTechnicalValidationResult
} from '../services/imageValidationService';
import { localOllamaVisionProvider } from '../services/localOllamaVisionProvider';
import { ImageRelevanceValidationResult } from '../types';

export interface TaskAwareImageIntakeProps {
  workflow: ImageWorkflow;
  currentPhotoUrl: string | null;
  onPhotoSelected: (dataUrl: string, file?: File) => void;
  onPhotoRemoved: () => void;
  label?: string;
  disabled?: boolean;
}

export const TaskAwareImageIntake: React.FC<TaskAwareImageIntakeProps> = ({
  workflow,
  currentPhotoUrl,
  onPhotoSelected,
  onPhotoRemoved,
  label,
  disabled = false
}) => {
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [technicalResult, setTechnicalResult] = useState<ImageTechnicalValidationResult | null>(null);
  const [relevanceResult, setRelevanceResult] = useState<ImageRelevanceValidationResult | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const guidance = imageValidationService.getWorkflowGuidance(workflow);

  // Revoke object URL on unmount or replace
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported on this browser or requires an HTTPS / localhost connection.');
      return;
    }

    try {
      // Prefer rear environment camera on phones, fallback to user camera
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);

      // Attach stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings or use photo upload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected. Please use the Upload Photo button.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to open camera'}.`);
      }
      setIsCameraActive(false);
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();

    // Convert dataUrl to blob for validation
    canvas.toBlob((blob) => {
      if (blob) {
        handleFileProcessing(blob, dataUrl);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleFileProcessing(file, dataUrl, file);
    };
    reader.onerror = () => {
      setTechnicalResult({
        isValid: false,
        errorCode: 'corrupted_image',
        errorMessage: 'Unable to read the selected file.',
        remedy: 'Please choose another photograph.'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileProcessing = async (blob: Blob, dataUrl: string, originalFile?: File) => {
    setIsValidating(true);
    setTechnicalResult(null);
    setRelevanceResult(null);

    // 1. Technical validation
    const techRes = await imageValidationService.validateTechnical(blob);
    setTechnicalResult(techRes);

    if (!techRes.isValid) {
      setIsValidating(false);
      return;
    }

    // 2. Workflow Relevance Validation via Local Vision Model (or offline check)
    try {
      const relRes = await localOllamaVisionProvider.validateImageRelevance(dataUrl, workflow);
      setRelevanceResult(relRes);
    } catch {
      // Non-blocking
    }

    setIsValidating(false);
    onPhotoSelected(dataUrl, originalFile);
  };

  const handleRemove = () => {
    stopCamera();
    setTechnicalResult(null);
    setRelevanceResult(null);
    setCameraError(null);
    onPhotoRemoved();
  };

  return (
    <div className="task-aware-image-intake" style={{ width: '100%', marginBottom: '1rem' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-primary-dark)',
            marginBottom: '0.4rem'
          }}
        >
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        style={{ display: 'none' }}
        disabled={disabled}
        aria-label="Upload photo"
      />

      {/* Camera Live Preview Overlay */}
      {isCameraActive && (
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#000000',
            marginBottom: '0.75rem',
            textAlign: 'center'
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            <button
              type="button"
              onClick={captureCameraFrame}
              className="btn btn-primary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.6rem 1.4rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <Camera size={18} />
              <span>Capture Photo</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="btn btn-secondary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.6rem 1.1rem',
                backgroundColor: 'rgba(255,255,255,0.85)'
              }}
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Photo Preview Mode */}
      {currentPhotoUrl && !isCameraActive ? (
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-card)',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              maxHeight: 320,
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={currentPhotoUrl}
              alt="Selected subject preview"
              style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }}
            />
            {isValidating && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <Loader2 size={20} className="spin" />
                <span>Validating photo...</span>
              </div>
            )}
          </div>

          {/* Controls: Retake, Upload Another, Remove */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled || isValidating}
                className="btn btn-secondary btn-sm"
                title="Retake photo using camera"
              >
                <RefreshCw size={14} />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isValidating}
                className="btn btn-secondary btn-sm"
                title="Choose a different photo file"
              >
                <Upload size={14} />
                <span>Choose Another</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isValidating}
              className="btn btn-sm"
              style={{
                color: 'var(--color-terracotta)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
              aria-label="Remove photo"
            >
              <X size={14} />
              <span>Remove</span>
            </button>
          </div>

          {/* Validation Feedback Badges */}
          {technicalResult && technicalResult.isValid && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                color: 'var(--color-text-subtle)'
              }}
            >
              <CheckCircle2 size={13} color="#10B981" />
              <span>
                Decodable photo: {technicalResult.width}×{technicalResult.height}px
                {technicalResult.fileSizeBytes
                  ? ` (${(technicalResult.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)`
                  : ''}
              </span>
            </div>
          )}

          {/* Semantic relevance feedback */}
          {relevanceResult && !relevanceResult.isRelevant && (
            <div
              role="alert"
              style={{
                padding: '0.6rem 0.8rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#B91C1C',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>{relevanceResult.reason}</strong>
                <p style={{ margin: '0.2rem 0 0', opacity: 0.9 }}>
                  {relevanceResult.suggestedAction}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Empty State: Take Photo / Upload / Dropzone */}
      {!currentPhotoUrl && !isCameraActive ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: dragOver ? 'var(--color-primary-subtle)' : 'var(--color-bg-card)',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.6rem',
              maxWidth: 420,
              margin: '0 auto'
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Camera size={24} />
            </div>

            <div>
              <p style={{ fontWeight: 600, color: 'var(--color-primary-dark)', margin: '0 0 0.25rem' }}>
                {guidance.title}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                {guidance.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '0.6rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: '0.4rem'
              }}
            >
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled}
                className="btn btn-primary btn-sm"
              >
                <Camera size={16} />
                <span>Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="btn btn-secondary btn-sm"
              >
                <Upload size={16} />
                <span>Upload Photo</span>
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', margin: '0.35rem 0 0' }}>
              Drag and drop an image here (JPEG, PNG, WebP up to 15MB)
            </p>

            {/* Helpful workflow guidance tip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.4rem'
              }}
            >
              <Info size={13} style={{ flexShrink: 0 }} />
              <span>{guidance.tip}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Camera Error Message */}
      {cameraError && (
        <div
          role="alert"
          style={{
            marginTop: '0.5rem',
            padding: '0.55rem 0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#B91C1C',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Technical Error Message */}
      {technicalResult && !technicalResult.isValid && (
        <div
          role="alert"
          style={{
            marginTop: '0.5rem',
            padding: '0.55rem 0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#B91C1C',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.4rem'
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>{technicalResult.errorMessage}</strong>
            {technicalResult.remedy && (
              <p style={{ margin: '0.2rem 0 0', opacity: 0.9 }}>{technicalResult.remedy}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
