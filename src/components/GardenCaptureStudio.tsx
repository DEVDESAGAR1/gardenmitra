import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGarden } from '../context/GardenContext';
import { useToast } from '../context/ToastContext';
import { captureGuidanceService } from '../services/captureGuidanceService';
import {
  GardenMediaAsset,
  MultiMediaAnalysisResult,
  SpaceCaptureChecklistItem
} from '../types';
import {
  Camera,
  Upload,
  Video,
  Sparkles,
  X,
  AlertCircle,
  Film,
  Square,
  Eye,
  Sliders,
  ShieldAlert,
  HelpCircle,
  Trash2,
  Info
} from 'lucide-react';

interface GardenCaptureStudioProps {
  onClose?: () => void;
}

export const GardenCaptureStudio: React.FC<GardenCaptureStudioProps> = ({ onClose }) => {
  const {
    selectedSpace,
    saveMediaAsset,
    deleteMediaAsset,
    extractVideoFrames,
    analyzeSpaceMedia,
    modelAvailability,
    checkModelAvailability
  } = useGarden();

  const { warning } = useToast();

  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'video'>('upload');
  const [checklist, setChecklist] = useState<SpaceCaptureChecklistItem[]>([]);
  const [showGuidance, setShowGuidance] = useState(true);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Camera Live Stream State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Video Recording & Extraction State
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<number | null>(null);
  const [selectedVideoForFrames, setSelectedVideoForFrames] = useState<GardenMediaAsset | null>(null);

  // Multi-Media AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MultiMediaAnalysisResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Stop camera tracks cleanly on unmount or tab switch
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Load space-specific capture checklist
  useEffect(() => {
    if (selectedSpace) {
      const items = captureGuidanceService.getChecklistForSpace(selectedSpace.type);
      setChecklist(items);
    }
  }, [selectedSpace]);

  // Recording timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  if (!selectedSpace) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please select a garden space first to launch the Capture Studio.</p>
      </div>
    );
  }

  const mediaAssets = selectedSpace.mediaAssets || [];
  const photosAndFrames = mediaAssets.filter((a) => a.type === 'photo' || a.type === 'video_frame');
  const videoAssets = mediaAssets.filter((a) => a.type === 'video');

  // Handle Photo File Upload (Multiple)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          continue;
        }

        const capturedAt =
          typeof file.lastModified === 'number' && file.lastModified > 0
            ? new Date(file.lastModified).toISOString()
            : new Date().toISOString();

        await saveMediaAsset({
          spaceId: selectedSpace.id,
          fileOrBlob: file,
          type: 'photo',
          source: 'upload',
          capturedAt
        });
      }
      setStatusMessage(`Successfully saved ${files.length} photo(s) to ${selectedSpace.name}.`);
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Start Camera Stream (Opt-in only)
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false // Silent garden capture by default
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission was denied. You can still upload photos from your device below.');
      } else {
        setCameraError(`Camera could not be started: ${err.message}`);
      }
      setIsCameraActive(false);
    }
  };

  // Capture Photo from Camera Stream
  const takeSnapshot = async () => {
    if (!videoRef.current || !streamRef.current) return;

    const videoEl = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await saveMediaAsset({
          spaceId: selectedSpace.id,
          fileOrBlob: blob,
          type: 'photo',
          source: 'camera',
          capturedAt: new Date().toISOString()
        });
        setStatusMessage('Captured snapshot saved directly to space.');
      } catch (err: any) {
        setStatusMessage(`Error saving photo: ${err.message}`);
      }
    }, 'image/jpeg', 0.88);
  };

  // Video Recording via In-Browser MediaRecorder
  const startRecording = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('MediaDevices is not supported in your browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false // Silent walkthrough
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const fullBlob = new Blob(chunks, { type: 'video/webm' });
        try {
          const asset = await saveMediaAsset({
            spaceId: selectedSpace.id,
            fileOrBlob: fullBlob,
            type: 'video',
            source: 'video_recording',
            capturedAt: new Date().toISOString()
          });
          setStatusMessage('Garden video walkthrough saved! Extracting frames is available.');
          setSelectedVideoForFrames(asset);
        } catch (e: any) {
          setStatusMessage(`Could not save video: ${e.message}`);
        }
        stopCameraStream();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError(`Could not begin video recording: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Video File Upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      warning('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setIsUploading(true);
    try {
      const asset = await saveMediaAsset({
        spaceId: selectedSpace.id,
        fileOrBlob: file,
        type: 'video',
        source: 'upload',
        capturedAt:
          typeof file.lastModified === 'number'
            ? new Date(file.lastModified).toISOString()
            : new Date().toISOString()
      });
      setSelectedVideoForFrames(asset);
      setStatusMessage('Video file uploaded! You can now sample representative frames.');
    } catch (err: any) {
      setStatusMessage(`Video upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // Video Frame Extraction
  const handleExtractFrames = async (videoAsset: GardenMediaAsset) => {
    setIsExtractingFrames(true);
    setExtractionProgress(0);
    setStatusMessage(`Sampling representative keyframes from video...`);

    try {
      const frames = await extractVideoFrames(selectedSpace.id, videoAsset.id, {
        maxFrames: 6,
        onProgress: (pct) => setExtractionProgress(pct)
      });
      setStatusMessage(`Extracted ${frames.length} keyframes successfully across walkthrough!`);
    } catch (err: any) {
      setStatusMessage(`Frame extraction failed: ${err.message}`);
    } finally {
      setIsExtractingFrames(false);
      setExtractionProgress(null);
    }
  };

  // Multi-Image Analysis Trigger
  const handleRunMultiMediaAnalysis = async () => {
    setIsAnalyzing(true);
    setStatusMessage('Analyzing media collection with on-device Vision AI...');
    try {
      const result = await analyzeSpaceMedia(selectedSpace.id);
      setAnalysisResult(result);
      if (result.status === 'success') {
        setStatusMessage('AI observation complete! Review findings and safety notes below.');
      } else {
        setStatusMessage(result.message || 'Analysis could not be completed.');
      }
    } catch (err: any) {
      setStatusMessage(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
    );
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        backgroundColor: '#FFFFFF',
        border: '1.5px solid var(--color-primary-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '2rem'
      }}
    >
      {/* Studio Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-green">GARDEN CAPTURE STUDIO</span>
            <span className="badge badge-neutral">{selectedSpace.name}</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary-dark)', margin: 0 }}>
            Space Capture &amp; Intelligence 🌱
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'var(--color-text-subtle)' }}>
            Upload multiple photos, snap direct camera shots, or record a walkthrough video. Stored privately on your device.
          </p>
        </div>

        {onClose && (
          <button onClick={onClose} className="btn btn-secondary btn-sm" title="Close Studio">
            <X size={16} />
            <span>Close</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '0.65rem 0.9rem',
            marginBottom: '1rem',
            backgroundColor: 'var(--color-bg-base)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.825rem',
            color: 'var(--color-primary-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Info size={16} color="var(--color-primary)" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Capture Mode Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            stopCameraStream();
            setActiveTab('upload');
          }}
          className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Upload size={16} />
          <span>Upload Photos</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('camera');
            if (!isCameraActive) startCamera();
          }}
          className={`btn ${activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Camera size={16} />
          <span>Take Photos</span>
        </button>

        <button
          onClick={() => {
            stopCameraStream();
            setActiveTab('video');
          }}
          className={`btn ${activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Video size={16} />
          <span>Upload or Record Video</span>
        </button>
      </div>

      {/* TAB 1: Multiple Photo Upload */}
      {activeTab === 'upload' && (
        <div
          style={{
            padding: '1.75rem',
            border: '2px dashed var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-base)',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}
        >
          <Upload size={32} color="var(--color-primary)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--color-text-main)' }}>
            Choose photos of your {selectedSpace.name}
          </h4>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
            Select multiple perspectives (entrance, walls, railing, floor). JPEG, PNG, or WebP.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn btn-primary"
          >
            <span>{isUploading ? 'Saving Photos...' : 'Select Photos from Device'}</span>
          </button>
        </div>
      )}

      {/* TAB 2: Camera Live Capture */}
      {activeTab === 'camera' && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#1A202C',
            borderRadius: 'var(--radius-md)',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}
        >
          {cameraError ? (
            <div style={{ padding: '2rem 1rem' }}>
              <AlertCircle size={32} color="#FEB2B2" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ color: '#FEB2B2', fontSize: '0.9rem', marginBottom: '1rem' }}>{cameraError}</p>
              <button
                onClick={() => {
                  stopCameraStream();
                  setActiveTab('upload');
                }}
                className="btn btn-secondary btn-sm"
              >
                Switch to Device File Upload
              </button>
            </div>
          ) : (
            <div>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  maxHeight: '380px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#000000',
                  objectFit: 'cover'
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '0.75rem'
                }}
              >
                <button onClick={takeSnapshot} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                  <Camera size={18} />
                  <span>Capture Photo</span>
                </button>

                <button onClick={stopCameraStream} className="btn btn-secondary btn-sm">
                  <span>Stop Camera</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Video Walkthrough & Sampling */}
      {activeTab === 'video' && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--color-bg-base)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={isUploading || isRecording}
              className="btn btn-secondary btn-sm"
            >
              <Upload size={14} />
              <span>Upload Video File (MP4/WebM)</span>
            </button>

            {!isRecording ? (
              <button onClick={startRecording} className="btn btn-primary btn-sm">
                <Video size={14} />
                <span>Record Garden Walkthrough</span>
              </button>
            ) : (
              <button onClick={stopRecording} className="btn btn-sm" style={{ backgroundColor: '#E53E3E', color: '#FFF' }}>
                <Square size={14} />
                <span>Stop Recording ({recordingSeconds}s)</span>
              </button>
            )}
          </div>

          {isRecording && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', maxHeight: '280px', borderRadius: 'var(--radius-sm)' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#E53E3E', fontWeight: 600 }}>
                ● Recording silent garden walkthrough ({recordingSeconds}s)
              </span>
            </div>
          )}

          {/* Videos List with Extract Frames action */}
          {videoAssets.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Saved Walkthrough Videos ({videoAssets.length}):
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {videoAssets.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Film size={18} color="var(--color-primary)" />
                      <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>
                          Garden Video ({Math.round(v.sizeBytes / (1024 * 1024))}MB)
                        </strong>
                        <span style={{ fontSize: '0.725rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                          Saved {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleExtractFrames(v)}
                        disabled={isExtractingFrames}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                      >
                        <Sliders size={12} />
                        <span>
                          {isExtractingFrames && selectedVideoForFrames?.id === v.id
                            ? `Extracting ${extractionProgress || 0}%`
                            : 'Sample Keyframes'}
                        </span>
                      </button>

                      <button
                        onClick={() => deleteMediaAsset(selectedSpace.id, v.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.45rem', color: 'var(--color-danger)' }}
                        title="Delete video"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capture Guidance Checklist (Skippable) */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--color-bg-base)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => setShowGuidance(!showGuidance)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HelpCircle size={16} color="var(--color-primary)" />
            <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
              Recommended Angles for {selectedSpace.name} ({selectedSpace.type})
            </strong>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
            {showGuidance ? 'Hide' : 'Show Guidance'}
          </span>
        </div>

        {showGuidance && (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
              These views help GardenMitra identify sun traps, obstacles, and drainage. They are completely optional!
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.4rem'
              }}
            >
              {checklist.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.45rem',
                    padding: '0.45rem 0.6rem',
                    backgroundColor: item.completed ? '#F0FDF4' : '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklistItem(item.id)}
                    style={{ marginTop: '0.15rem' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)', display: 'block' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                      {item.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Captured Media Gallery */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.6rem'
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Captured Images &amp; Video Keyframes ({photosAndFrames.length})
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
            Stored locally in IndexedDB
          </span>
        </div>

        {photosAndFrames.length === 0 ? (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--color-text-subtle)'
            }}
          >
            No photos or video frames added yet. Use the upload or camera options above to get started.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.75rem'
            }}
          >
            {photosAndFrames.map((asset) => (
              <div
                key={asset.id}
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: '#000000'
                }}
              >
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.type}
                    style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      height: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF'
                    }}
                  >
                    <Eye size={20} />
                  </div>
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '0.2rem 0.35rem',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    color: '#FFF',
                    fontSize: '0.68rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>
                    {asset.type === 'video_frame'
                      ? `Frame ${asset.frameTimestampSeconds?.toFixed(1)}s`
                      : 'Photo'}
                  </span>
                  <button
                    onClick={() => deleteMediaAsset(selectedSpace.id, asset.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FEB2B2',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title="Remove item"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Image AI Analysis Section */}
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.85rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={18} color="var(--color-primary)" />
              <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
                Multi-View Space Intelligence
              </strong>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
              Analyzes up to 5 photos &amp; video frames together using on-device Ollama/Gemma
            </span>
          </div>

          <button
            onClick={handleRunMultiMediaAnalysis}
            disabled={isAnalyzing || photosAndFrames.length === 0}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Sparkles size={15} />
            <span>{isAnalyzing ? 'Analyzing Views...' : 'Analyze Space Media'}</span>
          </button>
        </div>

        {/* Vision AI Availability Badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span
            className={`badge ${modelAvailability.status === 'available' ? 'badge-green' : 'badge-neutral'}`}
            style={{ fontSize: '0.72rem' }}
          >
            {modelAvailability.status === 'available'
              ? 'Local Vision AI Connected'
              : 'Local Vision AI Offline (Honest fallbacks)'}
          </span>
          <button
            onClick={() => checkModelAvailability()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              textDecoration: 'underline'
            }}
          >
            Check status
          </button>
        </div>

        {/* AI Analysis Findings Display */}
        {analysisResult && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: '0.825rem'
            }}
          >
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--color-primary-dark)', fontSize: '0.95rem', display: 'block' }}>
                Assessment: {analysisResult.likelySpaceType || selectedSpace.type}
              </strong>
              <p style={{ margin: '0.25rem 0', color: 'var(--color-text-main)' }}>
                {analysisResult.visibleBoundaries}
              </p>
            </div>

            {/* Observations list */}
            {analysisResult.observations && analysisResult.observations.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Observed Features:
                </span>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {analysisResult.observations.map((obs, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>
                      <strong>{obs.category}:</strong> {obs.description}
                      {obs.requiresUserConfirmation && (
                        <span
                          className="badge"
                          style={{
                            marginLeft: '0.4rem',
                            fontSize: '0.68rem',
                            backgroundColor: '#FEFCBF',
                            color: '#975A16'
                          }}
                        >
                          Verify in real garden
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structural details */}
            {analysisResult.surfacesAndStructures && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}
              >
                {analysisResult.surfacesAndStructures.railings && (
                  <div style={{ padding: '0.4rem 0.6rem', backgroundColor: '#FFF', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                      Railings &amp; Boundaries
                    </span>
                    <span>{analysisResult.surfacesAndStructures.railings}</span>
                  </div>
                )}
                {analysisResult.surfacesAndStructures.floor && (
                  <div style={{ padding: '0.4rem 0.6rem', backgroundColor: '#FFF', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                      Floor &amp; Ground
                    </span>
                    <span>{analysisResult.surfacesAndStructures.floor}</span>
                  </div>
                )}
                {analysisResult.surfacesAndStructures.ceilingOrOverhead && (
                  <div style={{ padding: '0.4rem 0.6rem', backgroundColor: '#FFF', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                      Overhead Shelter
                    </span>
                    <span>{analysisResult.surfacesAndStructures.ceilingOrOverhead}</span>
                  </div>
                )}
              </div>
            )}

            {/* Safety & Physical Limitations Notice */}
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 'var(--radius-sm)',
                color: '#92400E',
                marginBottom: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                <ShieldAlert size={14} />
                <span>Physical Safety &amp; Uncertainty</span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem' }}>
                Photographs cannot confirm load-bearing capacity, soil microbiology, or exact millimeter dimensions. Never hang heavy pots from railings without verifying bracket strength.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
