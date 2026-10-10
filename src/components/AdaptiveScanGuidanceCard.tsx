import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import {
  Camera,
  Ruler,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus
} from 'lucide-react';

export const AdaptiveScanGuidanceCard: React.FC = () => {
  const {
    selectedSpace,
    spaceCoverage,
    usableSpace,
    userObservations,
    addSpaceMeasurement,
    confirmUserObservation,
    setActiveTab,
    saveMediaAsset
  } = useGarden();

  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const [isCalibratorOpen, setIsCalibratorOpen] = useState(false);
  const [tileCount, setTileCount] = useState('6');
  const [tileSizeCm, setTileSizeCm] = useState('60');
  const [dimensionName, setDimensionName] = useState('Balcony Width');

  // Manual measurement form
  const [isManualMeasureOpen, setIsManualMeasureOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [manualUnit, setManualUnit] = useState<'ft' | 'm' | 'cm'>('ft');

  // Dismissed views for the session (to allow user to skip freely without trapping)
  const [skippedViews, setSkippedViews] = useState<Set<string>>(new Set());

  if (!selectedSpace) return null;

  const coverage = spaceCoverage;
  const usable = usableSpace;

  // Next view recommendation that hasn't been skipped
  const nextView = coverage?.views
    .filter((v) => v.status !== 'covered' && !skippedViews.has(v.view))
    .sort((a, b) => (a.confidence < b.confidence ? -1 : 1))[0] || coverage?.nextRecommendedView;

  const handleSkipNextView = (viewName?: string) => {
    if (viewName) {
      setSkippedViews((prev) => new Set([...prev, viewName]));
    }
  };

  const handleTileCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseFloat(tileCount);
    const size = parseFloat(tileSizeCm);
    if (isNaN(count) || isNaN(size) || count <= 0 || size <= 0) return;

    const totalCm = count * size;
    const valueFt = Math.round((totalCm / 30.48) * 10) / 10;

    addSpaceMeasurement(selectedSpace.id, {
      name: dimensionName.trim() || 'Calibrated Dimension',
      value: valueFt,
      unit: 'ft',
      source: 'reference_calibrated',
      confidence: 0.85,
      notes: `Calibrated from ${count} floor tiles at ~${size}cm each`
    });

    setIsCalibratorOpen(false);
  };

  const handleManualMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualValue);
    if (!manualName.trim() || isNaN(val) || val <= 0) return;

    addSpaceMeasurement(selectedSpace.id, {
      name: manualName.trim(),
      value: val,
      unit: manualUnit,
      source: 'user_measured',
      confidence: 0.95,
      notes: 'Direct user measurement'
    });

    setManualName('');
    setManualValue('');
    setIsManualMeasureOpen(false);
  };

  const handleQuickConfirm = (
    category: 'rain_exposure' | 'walkway' | 'railing_safety' | 'drainage',
    question: string,
    value: string
  ) => {
    confirmUserObservation(selectedSpace.id, {
      category,
      question,
      value
    });
  };

  // Check if an observation category is already confirmed
  const getConfirmedValue = (category: string) => {
    const obs = userObservations.find((o) => o.category === category);
    return obs?.value;
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        backgroundColor: '#FFFFFF',
        border: '1.5px solid var(--color-primary-border)',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-dark)'
            }}
          >
            <Eye size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-primary-dark)' }}>
              Adaptive Space Scanning & Usable Space
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Guided progressive inspection for {selectedSpace.name} ({selectedSpace.type})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {coverage && (
            <span
              className={`badge ${
                coverage.overallConfidence >= 0.7
                  ? 'badge-green'
                  : coverage.overallConfidence >= 0.4
                  ? 'badge-terracotta'
                  : 'badge-neutral'
              }`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
            >
              Coverage: {coverage.coveredCount}/{coverage.totalRequiredViews} views ({Math.round(coverage.overallConfidence * 100)}% confidence)
            </span>
          )}
          <button
            onClick={() => setActiveTab('twin')}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
          >
            <span>Digital Twin</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Friendly Next Step Guide */}
      {nextView ? (
        <div
          style={{
            backgroundColor: 'rgba(254, 243, 199, 0.5)',
            border: '1px solid #FCD34D',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <Sparkles size={18} color="#D97706" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: '#92400E' }}>
                  Next Best Capture: {nextView.label}
                </h4>
                <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', color: '#78350F' }}>
                  "{nextView.directionPrompt || nextView.description}"
                </p>
                {nextView.whyItMatters && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#B45309', fontStyle: 'italic' }}>
                    <strong>Why this matters:</strong> {nextView.whyItMatters}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            <label
              className="btn btn-terracotta btn-sm"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <Camera size={14} />
              <span>Capture {nextView.label}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await saveMediaAsset({
                      spaceId: selectedSpace.id,
                      fileOrBlob: file,
                      type: 'photo',
                      source: 'camera',
                      direction: nextView.view
                    });
                  }
                }}
              />
            </label>

            <button
              onClick={() => handleSkipNextView(nextView.view)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Skip For Now
            </button>

            <button
              onClick={() => setActiveTab('twin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Continue With Current Info
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(240, 253, 244, 0.8)',
            border: '1px solid #86EFAC',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={20} color="#15803D" />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#166534' }}>
                Space Inspection Complete! 🌱
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803D' }}>
                Key perspectives documented. Ready to visualize your layout in the Digital Twin.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('twin')}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            Open Digital Twin
          </button>
        </div>
      )}

      {/* Usable Space & Walkway Metrics Bar */}
      {usable && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            backgroundColor: '#F8FAFC',
            padding: '0.85rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Total Floor Area
            </span>
            <strong style={{ fontSize: '1.1rem', color: '#0F172A' }}>
              {usable.totalFloorAreaSqFt} sq ft
            </strong>
            <span style={{ fontSize: '0.68rem', color: usable.confidence === 'rough_estimate' ? '#D97706' : '#15803D', display: 'block' }}>
              {usable.confidence === 'rough_estimate' ? '⚠️ Category estimate' : '✓ Geometry based'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Clear Walkway
            </span>
            <strong style={{ fontSize: '1.1rem', color: '#2563EB' }}>
              {usable.walkingAreaSqFt} sq ft
            </strong>
            <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
              Preserves 2ft central path
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Net Usable Planting
            </span>
            <strong style={{ fontSize: '1.1rem', color: '#15803D' }}>
              {usable.usablePlantingAreaSqFt} sq ft
            </strong>
            <span style={{ fontSize: '0.68rem', color: '#166534', display: 'block' }}>
              Safe perimeter area
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Container Occupied
            </span>
            <strong style={{ fontSize: '1.1rem', color: '#C2410C' }}>
              {usable.containerOccupiedAreaSqFt} sq ft
            </strong>
            <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>
              Current pots footprint
            </span>
          </div>
        </div>
      )}

      {/* Safety & Physical Constraint Warnings */}
      {usable && usable.warnings.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          {usable.warnings.map((w, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                backgroundColor: 'rgba(254, 242, 242, 0.7)',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                marginBottom: '0.35rem',
                fontSize: '0.8rem',
                color: '#991B1B'
              }}
            >
              <ShieldAlert size={15} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Tool Buttons: Measurements & Calibrations */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setIsCalibratorOpen(!isCalibratorOpen)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
        >
          <Ruler size={13} />
          <span>Calibrate from Floor Tiles</span>
        </button>

        <button
          onClick={() => setIsManualMeasureOpen(!isManualMeasureOpen)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
        >
          <Plus size={13} />
          <span>Add Known Dimension</span>
        </button>

        <button
          onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', marginLeft: 'auto' }}
        >
          <span>View All 7 Coverage Angles</span>
          {isChecklistExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Tile Calibrator Modal / Form */}
      {isCalibratorOpen && (
        <form
          onSubmit={handleTileCalibration}
          style={{
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Ruler size={15} color="#0F172A" />
            <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Tile Count Scale Calibration</strong>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#475569' }}>
            Count whole tiles across your space. Standard Indian apartment floor tiles are typically 60cm (2ft) or 30cm (1ft).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Dimension Name</label>
              <input
                type="text"
                className="input input-sm"
                value={dimensionName}
                onChange={(e) => setDimensionName(e.target.value)}
                placeholder="e.g. Balcony Width"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Number of Tiles</label>
              <input
                type="number"
                step="0.5"
                min="1"
                className="input input-sm"
                value={tileCount}
                onChange={(e) => setTileCount(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Tile Size (cm)</label>
              <select
                className="input input-sm"
                value={tileSizeCm}
                onChange={(e) => setTileSizeCm(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="60">60 cm (~2.0 ft)</option>
                <option value="30">30 cm (~1.0 ft)</option>
                <option value="40">40 cm (~1.3 ft)</option>
                <option value="80">80 cm (~2.6 ft)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
              Save Calibrated Measurement
            </button>
            <button
              type="button"
              onClick={() => setIsCalibratorOpen(false)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Manual Measurement Form */}
      {isManualMeasureOpen && (
        <form
          onSubmit={handleManualMeasurement}
          style={{
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Plus size={15} color="#0F172A" />
            <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Add Measured Dimension</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Name</label>
              <input
                type="text"
                className="input input-sm"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Wall Length"
                required
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Value</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                className="input input-sm"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="e.g. 8.5"
                required
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Unit</label>
              <select
                className="input input-sm"
                value={manualUnit}
                onChange={(e) => setManualUnit(e.target.value as any)}
                style={{ width: '100%', fontSize: '0.82rem' }}
              >
                <option value="ft">Feet (ft)</option>
                <option value="m">Meters (m)</option>
                <option value="cm">Centimeters (cm)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
              Save Measurement
            </button>
            <button
              type="button"
              onClick={() => setIsManualMeasureOpen(false)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Expanded Coverage Checklist */}
      {isChecklistExpanded && coverage && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '0.75rem',
            marginBottom: '1rem'
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#334155' }}>
            Space Perspectives & Evidence
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
            {coverage.views.map((item) => (
              <div
                key={item.view}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '6px',
                  backgroundColor: item.status === 'covered' ? '#F0FDF4' : '#F8FAFC',
                  border: `1px solid ${item.status === 'covered' ? '#BBF7D0' : '#E2E8F0'}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {item.status === 'covered' ? (
                      <CheckCircle2 size={13} color="#15803D" />
                    ) : item.status === 'partially_covered' ? (
                      <AlertCircle size={13} color="#D97706" />
                    ) : (
                      <HelpCircle size={13} color="#94A3B8" />
                    )}
                    <strong style={{ fontSize: '0.82rem', color: '#1E293B' }}>{item.label}</strong>
                  </div>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: '#64748B' }}>
                    {item.reason || item.description}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.35rem',
                    borderRadius: '4px',
                    textTransform: 'capitalize',
                    backgroundColor: item.status === 'covered' ? '#DCFCE7' : '#F1F5F9',
                    color: item.status === 'covered' ? '#166534' : '#64748B'
                  }}
                >
                  {item.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Confirmable Quick Observations */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '0.85rem',
          backgroundColor: '#FAF5FF',
          padding: '0.85rem',
          borderRadius: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
          <HelpCircle size={15} color="#7E22CE" />
          <strong style={{ fontSize: '0.85rem', color: '#581C87' }}>Help Mitra Verify Real Conditions</strong>
        </div>
        <p style={{ margin: '0 0 0.65rem 0', fontSize: '0.78rem', color: '#6B21A8' }}>
          Your confirmed answers guide drainage safety and shelter calculations without guessing.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
          {/* Question 1: Rain exposure */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '0.65rem', borderRadius: '6px', border: '1px solid #E9D5FF' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3B0764', display: 'block', marginBottom: '0.35rem' }}>
              Is this space exposed to rain?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {['Direct Rain', 'Partially Sheltered', 'Fully Sheltered'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleQuickConfirm('rain_exposure', 'Is this space exposed to rain?', opt)}
                  className={`btn btn-sm ${getConfirmedValue('rain_exposure') === opt ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Walkway */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '0.65rem', borderRadius: '6px', border: '1px solid #E9D5FF' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3B0764', display: 'block', marginBottom: '0.35rem' }}>
              Keep central 2-foot walking path open?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {['Yes, keep clear', 'No, entire floor usable'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleQuickConfirm('walkway', 'Keep central walking path open?', opt)}
                  className={`btn btn-sm ${getConfirmedValue('walkway') === opt ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
