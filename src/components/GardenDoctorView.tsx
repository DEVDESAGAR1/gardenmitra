import React, { useState, useRef } from 'react';
import { useGarden } from '../context/GardenContext';
import { localOllamaVisionProvider } from '../services/localOllamaVisionProvider';
import { visionProvider } from '../services/localVisionProvider';
import {
  PlantHealthGuidance,
  PlantSymptom,
  PlantPhotoAnalysisResult
} from '../types';
import {
  Stethoscope,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  X,
  Sparkles,
  Loader2,
  Cpu,
  RefreshCw,
  Layers,
  Leaf
} from 'lucide-react';

export const GardenDoctorView: React.FC = () => {
  const {
    spaces,
    selectedSpace,
    selectSpace,
    environmentalContext,
    modelAvailability,
    checkModelAvailability,
    saveAIObservation
  } = useGarden();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('unknown');
  const [selectedSymptom, setSelectedSymptom] = useState<PlantSymptom>('yellow_leaves');
  const [guidance, setGuidance] = useState<PlantHealthGuidance | null>(null);
  const [aiVisionResult, setAiVisionResult] = useState<PlantPhotoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userVerified, setUserVerified] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const symptoms: { id: PlantSymptom; label: string; desc: string }[] = [
    { id: 'yellow_leaves', label: 'Yellow leaves', desc: 'Lower or upper leaves losing green' },
    { id: 'brown_leaves', label: 'Brown leaves', desc: 'Crispy or dark edges/tips' },
    { id: 'wilting', label: 'Wilting / Drooping', desc: 'Stems or leaves hanging limp' },
    { id: 'spots', label: 'Spots on leaves', desc: 'Black, brown, or white specks' },
    { id: 'insects', label: 'Visible insects', desc: 'Tiny bugs, webbing, or aphids' },
    { id: 'not_growing', label: 'Not growing', desc: 'Stunted or stalled for weeks' },
    { id: 'not_flowering', label: 'Not flowering', desc: 'Green foliage but zero blooms' },
    { id: 'other', label: 'Other concern', desc: 'General observation check' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
        setAiVisionResult(null);
        setUserVerified(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedGardenPlant = selectedSpace?.plants.find(
    (gp) => gp.plantId === selectedPlantId
  );

  // 1. Local Safe Guidance (Deterministic rules, always works)
  const handleGetLocalGuidance = async () => {
    const res = await visionProvider.analyzePlantHealth(photoUrl || '', selectedSymptom);
    setGuidance(res);
    setAiVisionResult(null);
    setUserVerified(null);
  };

  // 2. Explicit Local Vision AI Analysis (Ollama / Gemma)
  const handleRunAiAnalysis = async () => {
    if (!photoUrl) {
      handleGetLocalGuidance();
      return;
    }

    setIsAnalyzing(true);
    setUserVerified(null);

    try {
      const res = await localOllamaVisionProvider.analyzePlantPhoto(photoUrl, {
        plant: selectedGardenPlant || null,
        symptom: selectedSymptom,
        space: selectedSpace,
        environmentalContext
      });

      setAiVisionResult(res);

      // Map to guidance display structure
      setGuidance({
        symptomTitle: symptoms.find((s) => s.id === selectedSymptom)?.label || 'Plant Health Check',
        possibleCauses: res.possibleCauses,
        investigationSteps: [
          'Push your finger 1 inch into the pot soil. Is it soggy or bone dry?',
          'Check if container drainage holes are clear.',
          'Observe whether discolored leaves are at the bottom or top of the plant.'
        ],
        immediateSafeActions: res.safeNextSteps,
        disclaimer: res.disclaimer
      });

      if (res.status === 'success') {
        saveAIObservation({
          id: 'obs-doctor-' + Date.now(),
          photoId: 'photo-doctor',
          timestamp: new Date().toISOString(),
          spaceId: selectedSpace?.id,
          plantId: selectedGardenPlant?.plantId,
          model: res.modelName || 'local-vision',
          type: 'plant_health',
          observations: res.observations,
          status: 'success'
        });
      }
    } catch {
      // Graceful fallback to deterministic rule guidance
      await handleGetLocalGuidance();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Header */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Stethoscope size={28} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.9rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              Garden Doctor 🩺
            </h1>
          </div>

          {/* Model Availability Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              title="Check Ollama connection"
            >
              <RefreshCw size={11} />
              <span>Check</span>
            </button>
          </div>
        </div>
        <p style={{ margin: 0 }}>
          Gentle troubleshooting for when plants look sad. No scary chemical prescriptions—just calm, practical steps.
        </p>
      </div>

      {/* Space & Plant Selector */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#FFFFFF',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          border: '1px solid var(--color-border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Space:</span>
          <select
            value={selectedSpace?.id || ''}
            onChange={(e) => selectSpace(e.target.value)}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-medium)',
              fontSize: '0.85rem'
            }}
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Leaf size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Plant:</span>
          <select
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-medium)',
              fontSize: '0.85rem'
            }}
          >
            <option value="unknown">Unspecified / Other Plant</option>
            {selectedSpace?.plants.map((gp) => (
              <option key={gp.plantId} value={gp.plantId}>
                {gp.plant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Column Layout: Photo + Symptoms */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        {/* Step 1: Upload a Plant Photo */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Camera size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>1. Upload a plant photo (Optional)</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Take a clear close-up of the leaf, stem, or pot soil.
          </p>

          {!photoUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-border-medium)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-base)',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <Upload size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tap to choose photo</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                Saved locally on your device
              </span>
            </div>
          ) : (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img
                src={photoUrl}
                alt="Plant health inspection"
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoUrl(null);
                  setAiVisionResult(null);
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#C53030'
                }}
              >
                <X size={14} />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>

        {/* Step 2: What are you noticing? */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <HelpCircle size={20} color="var(--color-terracotta)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>2. What are you noticing?</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Select the symptom that best describes what you see:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            {symptoms.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSymptom(s.id)}
                className={`option-tile ${selectedSymptom === s.id ? 'selected' : ''}`}
                style={{ padding: '0.6rem 0.5rem' }}
              >
                <span className="option-tile-title" style={{ fontSize: '0.8rem' }}>{s.label}</span>
                <span className="option-tile-subtitle" style={{ fontSize: '0.7rem' }}>{s.desc}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {photoUrl && modelAvailability.status === 'available' ? (
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={handleRunAiAnalysis}
                className="btn btn-primary"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Analyzing with Local AI…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Analyze with Garden AI</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGetLocalGuidance}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <span>Get Calm Guidance</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guidance Results Box */}
      {guidance && (
        <div className="card" style={{ padding: '1.75rem', border: '1.5px solid var(--color-primary-border)', backgroundColor: '#FFFFFF' }}>
          {/* Disclaimer Header */}
          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
              backgroundColor: '#FFFDF0',
              border: '1px solid #FEF3C7',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#92400E'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Important honest note:</strong> {guidance.disclaimer}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {guidance.symptomTitle}
            </h2>
            <span className="badge badge-green">
              {aiVisionResult?.status === 'success' ? 'AI VISION OBSERVATIONS' : 'LOCAL SAFE GUIDANCE'}
            </span>
          </div>

          {/* AI Observations (if available) */}
          {aiVisionResult && aiVisionResult.observations && (
            <div
              style={{
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '0.4rem' }}>
                📸 Visible Observations:
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                {aiVisionResult.observations.leafCondition ||
                  'Observation completed with conservative visual cues.'}
              </p>
            </div>
          )}

          {/* Possible causes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--color-text-main)' }}>
              Possible causes include:
            </h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {guidance.possibleCauses.map((cause, idx) => (
                <li key={idx} style={{ marginBottom: '0.35rem' }}>{cause}</li>
              ))}
            </ul>
          </div>

          {/* Investigation Steps */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--color-text-main)' }}>
              Let&apos;s check:
            </h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {guidance.investigationSteps.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '0.35rem' }}>{step}</li>
              ))}
            </ul>
          </div>

          {/* Safe Next Steps */}
          <div
            style={{
              backgroundColor: 'var(--color-primary-subtle)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={18} color="var(--color-primary)" />
              <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                Safe first steps right now
              </strong>
            </div>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {guidance.immediateSafeActions.map((action, idx) => (
                <li key={idx} style={{ marginBottom: '0.35rem' }}>{action}</li>
              ))}
            </ul>
          </div>

          {/* User Verification Prompt */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-base)',
              fontSize: '0.825rem',
              color: 'var(--color-text-muted)',
              flexWrap: 'wrap'
            }}
          >
            <span>Does this match what you observe in your plant?</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setUserVerified(true)}
                className={`btn btn-sm ${userVerified === true ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.775rem' }}
              >
                Yes, helpful
              </button>
              <button
                type="button"
                onClick={() => setUserVerified(false)}
                className={`btn btn-sm ${userVerified === false ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.775rem' }}
              >
                Needs more info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
