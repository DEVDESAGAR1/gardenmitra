import React, { useState, useRef } from 'react';
import { useGarden } from '../context/GardenContext';
import { useToast } from '../context/ToastContext';
import { localOllamaVisionProvider } from '../services/localOllamaVisionProvider';
import { GardenPhotoAnalysisResult, VisionAnalysisResult } from '../types';
import {
  Camera,
  UploadCloud,
  X,
  RefreshCw,
  Info,
  ArrowRight,
  Sparkles,
  Loader2,
  Cpu,
  Layers,
  Eye,
  Film
} from 'lucide-react';
import { GardenCaptureStudio } from './GardenCaptureStudio';

export const PhotoUploader: React.FC = () => {
  const {
    photo,
    savePhoto,
    removePhoto,
    profile,
    selectedSpace,
    setActiveTab,
    modelAvailability,
    checkModelAvailability,
    saveAIObservation,
    addSpaceZone
  } = useGarden();

  const { warning, success } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<
    GardenPhotoAnalysisResult | VisionAnalysisResult | null
  >(null);
  const [showStudio, setShowStudio] = useState(false);

  // SVG Data URL presets for quick one-click testing
  const sampleSpaces = [
    {
      title: 'Sunny Balcony',
      desc: 'Railing & small pots',
      svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23E2E8F0"/><rect y="220" width="600" height="180" fill="%23CBD5E1"/><rect x="80" y="160" width="440" height="12" fill="%2364748B"/><line x1="120" y1="172" x2="120" y2="350" stroke="%2364748B" stroke-width="8"/><line x1="200" y1="172" x2="200" y2="350" stroke="%2364748B" stroke-width="8"/><line x1="280" y1="172" x2="280" y2="350" stroke="%2364748B" stroke-width="8"/><line x1="360" y1="172" x2="360" y2="350" stroke="%2364748B" stroke-width="8"/><line x1="440" y1="172" x2="440" y2="350" stroke="%2364748B" stroke-width="8"/><circle cx="500" cy="80" r="40" fill="%23FBBF24"/><rect x="140" y="260" width="70" height="90" rx="6" fill="%23C05621"/><circle cx="175" cy="240" r="30" fill="%2322543D"/><rect x="300" y="280" width="90" height="70" rx="6" fill="%234A5568"/><circle cx="345" cy="255" r="35" fill="%232F855A"/><text x="300" y="385" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="middle">Sample Balcony Space</text></svg>'
    },
    {
      title: 'Kitchen Windowsill',
      desc: 'Compact sunny ledge',
      svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23F1F5F9"/><rect x="100" y="40" width="400" height="260" rx="10" fill="%2393C5FD"/><line x1="300" y1="40" x2="300" y2="300" stroke="%23FFFFFF" stroke-width="12"/><line x1="100" y1="180" x2="500" y2="180" stroke="%23FFFFFF" stroke-width="12"/><rect x="60" y="300" width="480" height="35" rx="4" fill="%23E2E8F0"/><rect x="140" y="240" width="60" height="65" rx="4" fill="%23D97706"/><circle cx="170" cy="215" r="28" fill="%2316A34A"/><rect x="250" y="240" width="60" height="65" rx="4" fill="%23C05621"/><circle cx="280" cy="215" r="28" fill="%2315803D"/><rect x="360" y="250" width="70" height="55" rx="4" fill="%23475569"/><circle cx="395" cy="225" r="26" fill="%2322C55E"/><text x="300" y="380" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="middle">Sample Windowsill Ledge</text></svg>'
    },
    {
      title: 'Open Terrace',
      desc: 'Generous sunlight & floor',
      svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23BAE6FD"/><polygon points="0,220 600,220 600,400 0,400" fill="%23E5E7EB"/><circle cx="100" cy="80" r="45" fill="%23F59E0B"/><rect x="220" y="250" width="160" height="90" rx="8" fill="%2365A30D"/><circle cx="270" cy="220" r="35" fill="%2315803D"/><circle cx="330" cy="215" r="40" fill="%2316A34A"/><rect x="440" y="240" width="90" height="110" rx="8" fill="%23EA580C"/><circle cx="485" cy="210" r="35" fill="%2314532D"/><text x="300" y="380" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="middle">Sample Rooftop Terrace</text></svg>'
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      warning('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Requirement 4: PHOTO TIMESTAMP
      // Preserve photo timestamp if available; do not invent one
      const photoTimestamp =
        typeof file.lastModified === 'number' && file.lastModified > 0
          ? new Date(file.lastModified).toISOString()
          : undefined;
      savePhoto(dataUrl, file.name, photoTimestamp);
      // Requirement 25: Do NOT automatically analyze every uploaded image!
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: { title: string; svg: string }) => {
    // Template samples have unknown photo capture time
    savePhoto(sample.svg, `${sample.title}.svg`, undefined);
    setAnalysisResult(null);
  };

  const runVisionAnalysis = async () => {
    if (!photo) return;
    setIsAnalyzing(true);

    try {
      const result = await localOllamaVisionProvider.analyzeGardenPhoto(
        photo,
        profile,
        selectedSpace
      );
      setAnalysisResult(result);

      if (result.status === 'success' && 'observations' in result) {
        saveAIObservation({
          id: 'obs-' + Date.now(),
          photoId: photo.id,
          timestamp: new Date().toISOString(),
          spaceId: selectedSpace?.id,
          model: ('modelName' in result && result.modelName) || 'local-vision',
          type: 'garden_space',
          observations: result.observations,
          status: 'success'
        });
      }
    } catch (e: any) {
      setAnalysisResult({
        status: 'error',
        providerId: 'local-ollama-vision',
        timestamp: new Date().toISOString(),
        observations: {
          generalVisualObservations: ['Vision analysis could not be completed.']
        },
        disclaimer: 'Connection error.',
        message: e?.message || 'Failed to analyze'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (showStudio) {
    return <GardenCaptureStudio onClose={() => setShowStudio(false)} />;
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Camera size={24} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Show GardenMitra your space</h2>
        </div>

        {/* Capture Studio Launcher & Local AI Availability Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowStudio(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Film size={14} color="var(--color-primary)" />
            <span>Launch Capture Studio (M8)</span>
          </button>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor:
                modelAvailability.status === 'available'
                  ? 'rgba(40, 167, 69, 0.12)'
                  : 'rgba(108, 117, 125, 0.12)',
              color:
                modelAvailability.status === 'available'
                  ? '#1E7E34'
                  : 'var(--color-text-muted)',
              border: `1px solid ${
                modelAvailability.status === 'available'
                  ? 'rgba(40, 167, 69, 0.3)'
                  : 'var(--color-border-subtle)'
              }`
            }}
          >
            <Cpu size={13} />
            <span>
              Local AI:{' '}
              {modelAvailability.status === 'available' ? '● Available' : '○ Not connected'}
            </span>
          </div>
          <button
            type="button"
            onClick={checkModelAvailability}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            title="Check connection to Ollama/Gemma"
          >
            <RefreshCw size={11} />
            <span>Check</span>
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
        Take a photo of your {selectedSpace?.name || 'balcony, terrace, or garden'}. Photos remain safely on your device.
      </p>

      {/* Upload Zone */}
      {!photo ? (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isDragging ? 'var(--color-primary-subtle)' : 'var(--color-bg-base)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '1.25rem'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <UploadCloud size={26} />
            </div>
            <h4 style={{ marginBottom: '0.35rem' }}>Upload or drag &amp; drop a space photo</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', margin: 0 }}>
              Supports JPG, PNG, WEBP (stored locally on your device)
            </p>
          </div>

          {/* Quick preset samples */}
          <div style={{ marginTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Or test with a sample space:
            </span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                marginTop: '0.5rem'
              }}
            >
              {sampleSpaces.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="card card-interactive"
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                    {sample.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                    {sample.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Photo Preview & Controls */
        <div>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--color-border-subtle)',
              marginBottom: '1.25rem',
              maxHeight: 340,
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={photo.dataUrl}
              alt="Your garden space"
              style={{ width: '100%', height: 'auto', maxHeight: 340, objectFit: 'contain' }}
            />
            {/* Quick action buttons */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                display: 'flex',
                gap: '0.5rem'
              }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                title="Replace photo"
              >
                <RefreshCw size={14} />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  removePhoto();
                  setAnalysisResult(null);
                }}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#C53030' }}
                title="Remove photo"
              >
                <X size={14} />
                <span>Remove</span>
              </button>
            </div>
            {/* Requirement 4: Honest Photo Timestamp Evidence */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                backgroundColor: 'rgba(0, 0, 0, 0.72)',
                color: '#FFFFFF',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Info size={12} />
              <span>
                {photo.photoTimestamp
                  ? `Captured: ${new Date(photo.photoTimestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${new Date(photo.photoTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Photo time unknown.'}
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* Explicit AI Trigger Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-subtle)',
              marginBottom: '1.25rem',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                <Eye size={17} color="var(--color-primary)" />
                <span>Visual Space Understanding</span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {modelAvailability.status === 'available'
                  ? 'Analyze visible growing containers and areas using on-device Gemma / Ollama.'
                  : 'Start Ollama on your device for on-device AI vision, or proceed with profile rules.'}
              </p>
            </div>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={runVisionAnalysis}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Analyzing your garden photo…</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Analyze with Garden AI</span>
                </>
              )}
            </button>
          </div>

          {/* Structured Observations Display */}
          {analysisResult && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid var(--color-primary-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {'observations' in analysisResult && analysisResult.observations ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={18} color="var(--color-primary)" />
                      <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                        📸 Garden Observations
                      </strong>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '0.725rem' }}>
                      {analysisResult.status === 'success' ? 'AI OBSERVATIONS' : 'LOCAL SAFE MODE'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {analysisResult.observations.likelySpaceType && (
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Likely Space</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{analysisResult.observations.likelySpaceType}</div>
                      </div>
                    )}
                    {analysisResult.observations.visibleGrowingAreas && (
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Growing Areas</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{analysisResult.observations.visibleGrowingAreas}</div>
                      </div>
                    )}
                    {analysisResult.observations.visibleContainers && (
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Containers</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{analysisResult.observations.visibleContainers}</div>
                      </div>
                    )}
                    {analysisResult.observations.existingGreenery && (
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Greenery</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{analysisResult.observations.existingGreenery}</div>
                      </div>
                    )}
                    {analysisResult.observations.verticalPotential && (
                      <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Vertical Potential</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{analysisResult.observations.verticalPotential}</div>
                      </div>
                    )}
                  </div>

                  {Array.isArray(analysisResult.observations.generalVisualObservations) &&
                    analysisResult.observations.generalVisualObservations.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                          Visual details:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                          {analysisResult.observations.generalVisualObservations.map((obs, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Requirement 23: User-confirmed observations */}
                  <div
                    style={{
                      marginBottom: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'var(--color-bg-base)',
                      border: '1px dashed var(--color-border-medium)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '0.35rem' }}>
                      Add confirmed elements to your Space Layout:
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedSpace) {
                            addSpaceZone(selectedSpace.id, {
                              name: 'Railing Space',
                              type: 'railing',
                              description: 'Confirmed balcony railing for planters'
                            });
                            success('Added "Railing Space" to your layout zones!');
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      >
                        + Add Railing Zone
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedSpace) {
                            addSpaceZone(selectedSpace.id, {
                              name: 'Wall Area',
                              type: 'wall',
                              description: 'Confirmed wall area for vertical greening'
                            });
                            success('Added "Wall Area" to your layout zones!');
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      >
                        + Add Wall Zone
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--color-text-subtle)', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <Info size={14} />
                    <span>AI observations are supporting evidence — never exact CAD geometry.</span>
                  </div>
                </>
              ) : (
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {analysisResult.message || 'Photo safely saved on your device.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Continue CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('plants')}
              className="btn btn-primary"
            >
              <span>Explore Recommended Plants</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
