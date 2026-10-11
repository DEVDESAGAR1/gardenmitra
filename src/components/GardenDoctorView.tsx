import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { localOllamaVisionProvider } from '../services/localOllamaVisionProvider';
import { visionProvider } from '../services/localVisionProvider';
import { DoctorHistoryTab } from './doctor/DoctorHistoryTab';
import { DoctorFollowUpCard } from './doctor/DoctorFollowUpCard';
import { TaskAwareImageIntake } from './TaskAwareImageIntake';
import {
  PlantSymptom,
  PlantPhotoAnalysisResult,
  SymptomAffectedPart,
  SymptomProgression,
  SymptomDistribution,
  StructuredSymptomReport,
  ContextualDiagnosisReport
} from '../types';
import {
  Stethoscope,
  Camera,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Loader2,
  Cpu,
  RefreshCw,
  Layers,
  Leaf,
  Calendar,
  CheckSquare,
  ShieldCheck,
  History,
  Activity,
  Droplets,
  Thermometer,
  Info
} from 'lucide-react';

export const GardenDoctorView: React.FC = () => {
  const {
    spaces,
    selectedSpace,
    selectSpace,
    environmentalContext,
    modelAvailability,
    checkModelAvailability,
    saveAIObservation,
    diagnosePlantHealth,
    saveDiagnosisRecord,
    convertDiagnosisToCareTask,
    recordDiagnosisFollowUp,
    diagnosisHistory,
    environmentalObservations
  } = useGarden();

  // Tab: 'diagnose' or 'history'
  const [activeDoctorTab, setActiveDoctorTab] = useState<'diagnose' | 'history'>('diagnose');

  // Diagnosis Input State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('unknown');
  const [selectedSymptom, setSelectedSymptom] = useState<PlantSymptom>('yellow_leaves');
  const [affectedPart, setAffectedPart] = useState<SymptomAffectedPart>('whole_plant');
  const [progression, setProgression] = useState<SymptomProgression>('gradual_past_week');
  const [distribution, setDistribution] = useState<SymptomDistribution>('few_leaves');
  const [recentChanges, setRecentChanges] = useState<string[]>([]);
  const [userNotes, setUserNotes] = useState<string>('');

  // Results & Tracking State
  const [currentReport, setCurrentReport] = useState<ContextualDiagnosisReport | null>(null);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [aiVisionResult, setAiVisionResult] = useState<PlantPhotoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userVerified, setUserVerified] = useState<boolean | null>(null);

  // Care Planner integration state
  const [addedTasks, setAddedTasks] = useState<Record<string, string>>({}); // causeId -> taskId
  const [taskMessage, setTaskMessage] = useState<string | null>(null);

  // Follow-up state
  const [selectedFollowUpStatus, setSelectedFollowUpStatus] = useState<
    'resolved' | 'improved' | 'no_change' | 'declined' | null
  >(null);
  const [followUpNotesInput, setFollowUpNotesInput] = useState<string>('');
  const [followUpSuccess, setFollowUpSuccess] = useState<boolean>(false);

  const symptomsList: { id: PlantSymptom; label: string; desc: string }[] = [
    { id: 'yellow_leaves', label: 'Yellow leaves', desc: 'Lower or upper leaves losing green' },
    { id: 'brown_leaves', label: 'Brown leaves', desc: 'Crispy or dark edges/tips' },
    { id: 'wilting', label: 'Wilting / Drooping', desc: 'Stems or leaves hanging limp' },
    { id: 'spots', label: 'Spots on leaves', desc: 'Black, brown, or white specks' },
    { id: 'insects', label: 'Visible insects', desc: 'Tiny bugs, webbing, or aphids' },
    { id: 'curling', label: 'Leaf curling', desc: 'Inward cupping or twisted growth' },
    { id: 'leaf_drop', label: 'Leaf drop', desc: 'Premature shedding of foliage' },
    { id: 'not_growing', label: 'Not growing', desc: 'Stunted or stalled for weeks' },
    { id: 'root_concerns', label: 'Root & base concerns', desc: 'Soggy base, bad odor, poor drainage' },
    { id: 'not_flowering', label: 'Not flowering', desc: 'Green foliage but zero blooms' },
    { id: 'abnormal_flowering_fruiting', label: 'Abnormal blooms / fruit', desc: 'Flower drop, blossom end rot' },
    { id: 'other', label: 'Other concern', desc: 'General observation check' }
  ];

  const affectedPartsList: { id: SymptomAffectedPart; label: string }[] = [
    { id: 'whole_plant', label: 'Whole Plant' },
    { id: 'leaves_lower', label: 'Lower / Older Leaves' },
    { id: 'leaves_upper', label: 'Upper / Top Leaves' },
    { id: 'new_growth', label: 'New Shoots & Buds' },
    { id: 'stems', label: 'Stems / Branches' },
    { id: 'roots_base', label: 'Root Zone / Base' },
    { id: 'flowers_fruit', label: 'Flowers / Fruit' }
  ];

  const progressionList: { id: SymptomProgression; label: string }[] = [
    { id: 'sudden_1_2_days', label: 'Sudden (1–2 days)' },
    { id: 'gradual_past_week', label: 'Gradual (Past week)' },
    { id: 'chronic_weeks', label: 'Chronic (Weeks)' }
  ];

  const distributionList: { id: SymptomDistribution; label: string }[] = [
    { id: 'few_leaves', label: 'A Few Leaves' },
    { id: 'single_leaf', label: 'Single Leaf' },
    { id: 'new_shoots', label: 'New Shoots Only' },
    { id: 'old_leaves', label: 'Old Foliage Only' },
    { id: 'entire_plant', label: 'Entire Plant' }
  ];

  const recentEventOptions = [
    { id: 'repotting', label: 'Recent Repotting' },
    { id: 'location_shift', label: 'Moved Location / Light' },
    { id: 'fertilizer', label: 'Fertilizer Applied' },
    { id: 'heatwave', label: 'Heatwave or Cold Draft' }
  ];

  const toggleRecentEvent = (id: string) => {
    setRecentChanges((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedGardenPlant = selectedSpace?.plants.find(
    (gp) => gp.plantId === selectedPlantId || gp.instanceId === selectedPlantId
  );

  // Active environmental readings
  const spaceObs = (environmentalObservations || []).filter(
    (o) => o.spaceId === selectedSpace?.id && o.dataQuality === 'valid'
  );
  const latestMoisture = spaceObs
    .filter((o) => o.type === 'soil_moisture')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  const latestTemp = spaceObs
    .filter((o) => o.type === 'air_temperature')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const isMoistureStale = latestMoisture
    ? Date.now() - new Date(latestMoisture.timestamp).getTime() > 24 * 3600 * 1000
    : false;
  const isTempStale = latestTemp
    ? Date.now() - new Date(latestTemp.timestamp).getTime() > 24 * 3600 * 1000
    : false;

  // Execute Contextual Diagnosis
  const handleDiagnose = async (withVisionAI: boolean = false) => {
    const activeSpace = selectedSpace || spaces[0] || {
      id: 'default-space',
      name: 'General Garden Space',
      type: 'outdoor_ground' as const,
      size: 'medium' as const,
      sunlight: 'partial_sun' as const,
      sunlightZones: [],
      plants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsAnalyzing(true);
    setTaskMessage(null);
    setFollowUpSuccess(false);

    try {
      const structuredSymptoms: StructuredSymptomReport = {
        primarySymptom: selectedSymptom,
        affectedPart,
        progression,
        distribution,
        userNotes: userNotes.trim() || undefined,
        photoUrl: photoUrl || undefined,
        recentChanges: recentChanges.length > 0 ? recentChanges : undefined
      };

      let visionRes: PlantPhotoAnalysisResult | null = null;

      if (withVisionAI && photoUrl && modelAvailability.status === 'available') {
        try {
          visionRes = await localOllamaVisionProvider.analyzePlantPhoto(photoUrl, {
            plant: selectedGardenPlant || null,
            symptom: selectedSymptom,
            space: activeSpace,
            environmentalContext
          });
          setAiVisionResult(visionRes);

          if (visionRes.status === 'success') {
            saveAIObservation({
              id: 'obs-doctor-' + Date.now(),
              photoId: 'photo-doctor',
              timestamp: new Date().toISOString(),
              spaceId: activeSpace.id,
              plantId: selectedGardenPlant?.plantId,
              model: visionRes.modelName || 'local-vision',
              type: 'plant_health',
              observations: visionRes.observations,
              status: 'success'
            });
          }
        } catch (e) {
          console.warn('Local Ollama vision failed, falling back to deterministic diagnosis:', e);
        }
      }

      // Run Contextual Diagnosis Engine
      const report = diagnosePlantHealth({
        plantInstanceId: selectedGardenPlant?.instanceId,
        plantId: selectedGardenPlant?.plantId || (selectedPlantId !== 'unknown' ? selectedPlantId : undefined),
        symptoms: structuredSymptoms,
        visionResult: visionRes
      });

      setCurrentReport(report);

      // Save to Diagnosis History and Journal
      const savedRec = saveDiagnosisRecord(report);
      setCurrentRecordId(savedRec.id);
    } catch (err) {
      console.error('Diagnosis failed:', err);
      // Fallback to legacy rule provider
      const fallback = await visionProvider.analyzePlantHealth(photoUrl || '', selectedSymptom);
      setCurrentReport({
        id: `fallback-${Date.now()}`,
        spaceId: selectedSpace?.id || 'space-default',
        plantName: selectedGardenPlant?.plant.name || 'Your Plant',
        timestamp: new Date().toISOString(),
        symptoms: { primarySymptom: selectedSymptom },
        summary: fallback.symptomTitle,
        rankedCauses: fallback.possibleCauses.map((c, i) => ({
          id: `cause-fb-${i}`,
          title: c.split(':')[0] || c,
          explanation: c,
          strength: 'possible',
          supportingEvidence: [],
          conflictingEvidence: [],
          missingInformation: fallback.investigationSteps,
          safeTreatmentSteps: fallback.immediateSafeActions
        })),
        overallEvidenceStrength: 'possible',
        generalPrecautions: fallback.immediateSafeActions,
        followUpQuestions: fallback.investigationSteps,
        isOfflineDeterministic: true,
        disclaimer: fallback.disclaimer
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Convert recommended action to Care Planner Task
  const handleConvertToCareTask = (causeId: string) => {
    if (!currentRecordId) return;
    const res = convertDiagnosisToCareTask(currentRecordId, causeId);
    if (res.success && res.task) {
      setAddedTasks((prev) => ({ ...prev, [causeId]: res.task!.id }));
      setTaskMessage(res.message);
    } else {
      setTaskMessage(res.message);
    }
  };

  // Submit 48-72h Follow-up
  const handleFollowUpSubmit = () => {
    if (!currentRecordId || !selectedFollowUpStatus) return;
    recordDiagnosisFollowUp(currentRecordId, selectedFollowUpStatus, followUpNotesInput.trim() || undefined);
    setFollowUpSuccess(true);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.35rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981, #047857)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 700 }}>
                Plant Health Doctor
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Evidence-based botanical intelligence & calm recovery
              </span>
            </div>
          </div>

          {/* Model Availability Badge & Subtabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor:
                  modelAvailability.status === 'available'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(108, 117, 125, 0.12)',
                color:
                  modelAvailability.status === 'available'
                    ? '#047857'
                    : 'var(--color-text-muted)',
                border: `1px solid ${
                  modelAvailability.status === 'available'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'var(--color-border-subtle)'
                }`
              }}
            >
              <Cpu size={13} />
              <span>
                Vision AI: {modelAvailability.status === 'available' ? '● Connected' : '○ Offline Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={checkModelAvailability}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
              title="Check Ollama connection"
            >
              <RefreshCw size={11} />
              <span>Check</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div role="tablist" aria-label="Doctor view modes" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setActiveDoctorTab('diagnose')}
            aria-pressed={activeDoctorTab === 'diagnose'}
            className={`btn btn-sm ${activeDoctorTab === 'diagnose' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '0.35rem 1rem' }}
          >
            <Activity size={14} style={{ marginRight: '0.4rem' }} />
            New Diagnosis
          </button>
          <button
            type="button"
            onClick={() => setActiveDoctorTab('history')}
            aria-pressed={activeDoctorTab === 'history'}
            className={`btn btn-sm ${activeDoctorTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '0.35rem 1rem' }}
          >
            <History size={14} style={{ marginRight: '0.4rem' }} />
            Diagnosis Journal ({diagnosisHistory.length})
          </button>
        </div>
      </div>

      {activeDoctorTab === 'history' ? (
        <DoctorHistoryTab
          diagnosisHistory={diagnosisHistory}
          onSelectRecord={(rec) => {
            setCurrentReport(rec.report);
            setCurrentRecordId(rec.id);
            setActiveDoctorTab('diagnose');
          }}
        />
      ) : (
        /* ========================================================
           NEW DIAGNOSIS WORKFLOW
           ======================================================== */
        <div>
          {/* Garden Space & Plant Selection Bar */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#FFFFFF',
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Space:</span>
                <select
                  value={selectedSpace?.id || ''}
                  onChange={(e) => e.target.value && selectSpace(e.target.value)}
                  style={{
                    padding: '0.35rem 0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-medium)',
                    fontSize: '0.85rem'
                  }}
                  aria-label="Select garden space for diagnosis"
                >
                  {spaces.length === 0 ? (
                    <option value="">General Garden Space</option>
                  ) : (
                    spaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Leaf size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Plant:</span>
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
                  <option value="unknown">Unspecified / Unknown Plant</option>
                  {selectedSpace?.plants.map((gp) => (
                    <option key={gp.instanceId || gp.plantId} value={gp.instanceId || gp.plantId}>
                      {gp.plant.name} ({gp.lifecycleStage || 'vegetative'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Context Badge */}
            {selectedGardenPlant && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.775rem',
                  color: 'var(--color-text-muted)'
                }}
              >
                <Calendar size={13} />
                <span>
                  Stage: <strong>{selectedGardenPlant.lifecycleStage || 'vegetative'}</strong>
                </span>
                {selectedGardenPlant.lastWateredAt && (
                  <span>
                    • Last watered: {new Date(selectedGardenPlant.lastWateredAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Contextual Intelligence Banner (M13 Telemetry + Provenance) */}
          <div
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '10px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              fontSize: '0.8rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Droplets size={14} color="#0284C7" />
                <span>Soil Moisture:</span>
                {latestMoisture ? (
                  <span style={{ fontWeight: 600 }}>
                    {latestMoisture.value}%{' '}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        backgroundColor: isMoistureStale ? '#FEF3C7' : '#DCFCE7',
                        color: isMoistureStale ? '#92400E' : '#166534'
                      }}
                    >
                      {isMoistureStale ? 'Stale (>24h)' : 'Fresh'}
                    </span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-text-subtle)' }}>No sensor reading</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Thermometer size={14} color="#EA580C" />
                <span>Ambient Temp:</span>
                {latestTemp ? (
                  <span style={{ fontWeight: 600 }}>
                    {latestTemp.value}°C{' '}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        backgroundColor: isTempStale ? '#FEF3C7' : '#DCFCE7',
                        color: isTempStale ? '#92400E' : '#166534'
                      }}
                    >
                      {isTempStale ? 'Stale (>24h)' : 'Fresh'}
                    </span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-text-subtle)' }}>
                    {environmentalContext?.snapshot?.temperatureC !== undefined
                      ? `${environmentalContext.snapshot.temperatureC}°C (Weather)`
                      : 'No live temp'}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-subtle)' }}>
              <ShieldCheck size={14} color="#10B981" />
              <span>Botanical baseline: ICAR & TNAU peer-reviewed agronomy</span>
            </div>
          </div>

          {/* Input Section: 2 Columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            {/* Column 1: Photo & Notes */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Camera size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1rem', margin: 0 }}>1. Attach Photo (Optional)</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.85rem' }}>
                Close-up of affected leaf, shoot, or pot drainage line. Photos never leave your device without explicit consent.
              </p>

              <TaskAwareImageIntake
                workflow="garden_doctor"
                currentPhotoUrl={photoUrl}
                onPhotoSelected={(dataUrl) => {
                  setPhotoUrl(dataUrl);
                  setAiVisionResult(null);
                  setUserVerified(null);
                }}
                onPhotoRemoved={() => {
                  setPhotoUrl(null);
                  setAiVisionResult(null);
                  setUserVerified(null);
                }}
                disabled={isAnalyzing}
              />

              {/* Free-text Observation Notes */}
              <div>
                <label htmlFor="doctor-user-notes" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Additional Notes or Symptoms:
                </label>
                <textarea
                  id="doctor-user-notes"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="e.g. Started after 3 days of torrential rain, drainage holes felt slightly clogged..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-medium)',
                    fontSize: '0.825rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Recent Events Checkboxes */}
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                  Recent Changes in Care or Climate:
                </span>
                <div role="group" aria-label="Recent climate or care changes" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {recentEventOptions.map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      aria-pressed={recentChanges.includes(evt.id)}
                      onClick={() => toggleRecentEvent(evt.id)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '16px',
                        fontSize: '0.725rem',
                        border: recentChanges.includes(evt.id)
                          ? '1px solid var(--color-primary)'
                          : '1px solid var(--color-border-subtle)',
                        backgroundColor: recentChanges.includes(evt.id)
                          ? 'var(--color-primary-subtle)'
                          : '#FFFFFF',
                        color: recentChanges.includes(evt.id)
                          ? 'var(--color-primary-dark)'
                          : 'var(--color-text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {recentChanges.includes(evt.id) ? '✓ ' : '+ '}
                      {evt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Structured Symptoms Selection */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <HelpCircle size={18} color="var(--color-terracotta)" />
                <h3 style={{ fontSize: '1rem', margin: 0 }}>2. Primary Symptom</h3>
              </div>

              {/* Primary Symptom Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                  gap: '0.4rem',
                  maxHeight: 180,
                  overflowY: 'auto',
                  paddingRight: '0.25rem',
                  marginBottom: '1rem'
                }}
              >
                {symptomsList.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSymptom(s.id)}
                    aria-pressed={selectedSymptom === s.id}
                    className={`option-tile ${selectedSymptom === s.id ? 'selected' : ''}`}
                    style={{ padding: '0.45rem 0.5rem', textAlign: 'left' }}
                  >
                    <span className="option-tile-title" style={{ fontSize: '0.775rem' }}>{s.label}</span>
                    <span className="option-tile-subtitle" style={{ fontSize: '0.675rem' }}>{s.desc}</span>
                  </button>
                ))}
              </div>

              {/* Specificity Details (Affected Part, Progression, Distribution) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                    Affected Part:
                  </span>
                  <div role="group" aria-label="Affected plant part" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {affectedPartsList.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => setAffectedPart(part.id)}
                        aria-pressed={affectedPart === part.id}
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '14px',
                          fontSize: '0.725rem',
                          border: affectedPart === part.id
                            ? '1px solid var(--color-primary)'
                            : '1px solid var(--color-border-subtle)',
                          backgroundColor: affectedPart === part.id
                            ? 'var(--color-primary-subtle)'
                            : '#FFFFFF',
                          color: affectedPart === part.id
                            ? 'var(--color-primary-dark)'
                            : 'var(--color-text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {part.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label htmlFor="doctor-progression-select" style={{ fontSize: '0.775rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                      Progression:
                    </label>
                    <select
                      id="doctor-progression-select"
                      aria-label="Symptom progression speed"
                      value={progression}
                      onChange={(e) => setProgression(e.target.value as SymptomProgression)}
                      style={{
                        width: '100%',
                        padding: '0.3rem 0.45rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-medium)',
                        fontSize: '0.75rem'
                      }}
                    >
                      {progressionList.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.775rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                      Distribution:
                    </span>
                    <select
                      value={distribution}
                      onChange={(e) => setDistribution(e.target.value as SymptomDistribution)}
                      style={{
                        width: '100%',
                        padding: '0.3rem 0.45rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-medium)',
                        fontSize: '0.75rem'
                      }}
                    >
                      {distributionList.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleDiagnose(false)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Diagnosing…</span>
                    </>
                  ) : (
                    <>
                      <Stethoscope size={16} />
                      <span>Investigate Plant Health</span>
                    </>
                  )}
                </button>

                {photoUrl && modelAvailability.status === 'available' && (
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => handleDiagnose(true)}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    title="Enrich diagnosis with local Ollama vision"
                  >
                    <Sparkles size={15} color="#10B981" />
                    <span>Enrich with Vision AI</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DIAGNOSIS REPORT VIEW */}
          {currentReport && (
            <div
              className="card"
              style={{
                padding: '1.75rem',
                border: '1.5px solid var(--color-primary-border)',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Disclaimer */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                  backgroundColor: '#FFFDF0',
                  border: '1px solid #FEF3C7',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.825rem',
                  color: '#92400E'
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>Honest Botanical Note:</strong> {currentReport.disclaimer}
                </div>
              </div>

              {/* Summary Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  paddingBottom: '0.85rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h2 style={{ fontSize: '1.35rem', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 700 }}>
                      Health Diagnosis: {currentReport.plantName}
                    </h2>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                    {currentReport.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor:
                        currentReport.overallEvidenceStrength === 'likely'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : currentReport.overallEvidenceStrength === 'possible'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(100, 116, 139, 0.15)',
                      color:
                        currentReport.overallEvidenceStrength === 'likely'
                          ? '#047857'
                          : currentReport.overallEvidenceStrength === 'possible'
                          ? '#B45309'
                          : '#475569',
                      border: `1px solid ${
                        currentReport.overallEvidenceStrength === 'likely'
                          ? 'rgba(16, 185, 129, 0.3)'
                          : currentReport.overallEvidenceStrength === 'possible'
                          ? 'rgba(245, 158, 11, 0.3)'
                          : 'rgba(100, 116, 139, 0.3)'
                      }`
                    }}
                  >
                    Evidence Strength: {currentReport.overallEvidenceStrength.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Notification Message if Care Task Added */}
              {taskMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle size={16} />
                  <span>{taskMessage}</span>
                </div>
              )}

              {/* Vision AI visual observations (if applied) */}
              {aiVisionResult && aiVisionResult.observations && (
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong style={{ color: '#166534', display: 'block', marginBottom: '0.25rem' }}>
                    📸 Local AI Visual Observations:
                  </strong>
                  <span style={{ color: '#15803D' }}>
                    {aiVisionResult.observations.leafCondition || 'Conservative visual scan completed.'}
                  </span>
                </div>
              )}

              {/* RANKED CAUSES LIST */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
                  Ranked Possible Causes & Evidence
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {currentReport.rankedCauses.map((cause, idx) => {
                    const isTaskAdded = !!addedTasks[cause.id];

                    return (
                      <div
                        key={cause.id}
                        style={{
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: '10px',
                          padding: '1.15rem',
                          backgroundColor: idx === 0 ? '#FAFDFB' : '#FFFFFF'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-primary)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              #{idx + 1}
                            </span>
                            <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                              {cause.title}
                            </strong>
                          </div>

                          <span
                            style={{
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '12px',
                              backgroundColor:
                                cause.strength === 'likely'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : cause.strength === 'possible'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(100, 116, 139, 0.15)',
                              color:
                                cause.strength === 'likely'
                                  ? '#065F46'
                                  : cause.strength === 'possible'
                                  ? '#92400E'
                                  : '#334155'
                            }}
                          >
                            {cause.strength.toUpperCase()}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', margin: '0 0 0.75rem' }}>
                          {cause.explanation}
                        </p>

                        {/* Supporting Evidence */}
                        {cause.supportingEvidence.length > 0 && (
                          <div style={{ marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: '0.35rem' }}>
                              ✓ Supporting Evidence:
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {cause.supportingEvidence.map((ev, eIdx) => (
                                <div
                                  key={eIdx}
                                  style={{
                                    fontSize: '0.8rem',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '6px',
                                    backgroundColor: '#F0FDF4',
                                    border: '1px solid #DCFCE7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem'
                                  }}
                                >
                                  <span>{ev.description}</span>
                                  <span style={{ fontSize: '0.675rem', color: '#15803D', whiteSpace: 'nowrap' }}>
                                    [{ev.source.replace(/_/g, ' ')}]
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Conflicting Evidence */}
                        {cause.conflictingEvidence.length > 0 && (
                          <div style={{ marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B45309', display: 'block', marginBottom: '0.35rem' }}>
                              ⚡ Conflicting Evidence:
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {cause.conflictingEvidence.map((ev, cIdx) => (
                                <div
                                  key={cIdx}
                                  style={{
                                    fontSize: '0.8rem',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '6px',
                                    backgroundColor: '#FFFBEB',
                                    border: '1px solid #FEF3C7',
                                    color: '#92400E'
                                  }}
                                >
                                  {ev.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Information */}
                        {cause.missingInformation.length > 0 && (
                          <div style={{ marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.35rem' }}>
                              ? Information Still Missing:
                            </span>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.775rem', color: '#475569' }}>
                              {cause.missingInformation.map((m, mIdx) => (
                                <li key={mIdx}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Safe Reversible Treatment Steps */}
                        <div
                          style={{
                            backgroundColor: 'var(--color-bg-base)',
                            borderRadius: '8px',
                            padding: '0.75rem 0.85rem',
                            marginTop: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                            <ShieldCheck size={15} color="var(--color-primary)" />
                            <strong style={{ fontSize: '0.8rem', color: 'var(--color-primary-dark)' }}>
                              Safe Reversible Next Steps:
                            </strong>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-main)' }}>
                            {cause.safeTreatmentSteps.map((step, sIdx) => (
                              <li key={sIdx} style={{ marginBottom: '0.2rem' }}>{step}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Urgent Escalation Triggers */}
                        {cause.urgentEscalationTriggers && cause.urgentEscalationTriggers.length > 0 && (
                          <div
                            style={{
                              marginTop: '0.65rem',
                              padding: '0.6rem 0.85rem',
                              borderRadius: '6px',
                              backgroundColor: '#FEF2F2',
                              border: '1px solid #FEE2E2',
                              fontSize: '0.775rem',
                              color: '#991B1B'
                            }}
                          >
                            <strong>⚠️ Escalate or Isolate Plant If:</strong>{' '}
                            {cause.urgentEscalationTriggers.join(' • ')}
                          </div>
                        )}

                        {/* Care Planner Integration Action */}
                        {cause.suggestedCareAction && (
                          <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              disabled={isTaskAdded}
                              onClick={() => handleConvertToCareTask(cause.id)}
                              className={`btn btn-sm ${isTaskAdded ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem' }}
                            >
                              {isTaskAdded ? (
                                <>
                                  <CheckSquare size={14} />
                                  <span>Task Added to Care Planner</span>
                                </>
                              ) : (
                                <>
                                  <Calendar size={14} />
                                  <span>Add Action to Care Planner</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up Questions & Precautions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.825rem'
                }}
              >
                <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Info size={15} color="#0284C7" />
                    <strong>Follow-up Diagnostic Questions:</strong>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155' }}>
                    {currentReport.followUpQuestions.map((q, qIdx) => (
                      <li key={qIdx} style={{ marginBottom: '0.25rem' }}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <ShieldCheck size={15} color="#10B981" />
                    <strong>General Beginner Precautions:</strong>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155' }}>
                    {currentReport.generalPrecautions.map((p, pIdx) => (
                      <li key={pIdx} style={{ marginBottom: '0.25rem' }}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 48–72h Outcome Tracking Box */}
              <DoctorFollowUpCard
                selectedStatus={selectedFollowUpStatus}
                onStatusChange={setSelectedFollowUpStatus}
                notes={followUpNotesInput}
                onNotesChange={setFollowUpNotesInput}
                onSubmit={handleFollowUpSubmit}
                isSuccess={followUpSuccess}
                userVerified={userVerified}
                onUserVerified={setUserVerified}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
