import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { useToast } from '../context/ToastContext';
import { localSunPositionProvider } from '../services/localSunPositionProvider';
import {
  Sun,
  Sunrise,
  Sunset,
  Clock,
  Compass,
  AlertCircle,
  Plus,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const SunlightIntelligenceCard: React.FC = () => {
  const {
    garden,
    selectedSpace,
    selectedSpaceSunlightEstimate,
    recordSunlightObservation,
    addSunlightZone
  } = useGarden();

  const { success } = useToast();

  const [isGuidedFlowOpen, setIsGuidedFlowOpen] = useState(false);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [selectedCondition, setSelectedCondition] = useState<'mostly_sunny' | 'partially_shaded' | 'mostly_shaded'>('mostly_sunny');
  const [observationNote, setObservationNote] = useState('');
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState<'sunny' | 'partial_shade' | 'shade'>('sunny');

  if (!selectedSpace) return null;

  const profile = selectedSpace.sunlightProfile;
  const estimate = selectedSpaceSunlightEstimate;
  const observations = profile?.observations || [];
  const zones = selectedSpace.sunlightZones || [];

  // Local astronomical solar position (computed deterministically on-device)
  const solarData = garden?.location
    ? localSunPositionProvider.calculatePosition(garden.location, new Date())
    : null;

  const handleRecordObservation = (e: React.FormEvent) => {
    e.preventDefault();
    recordSunlightObservation(selectedSpace.id, {
      timeOfDay: selectedTimeOfDay,
      condition: selectedCondition,
      notes: observationNote.trim() || undefined
    });
    setObservationNote('');
    success(`Recorded ${selectedTimeOfDay} observation! Your sunlight estimate has been updated.`);
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    addSunlightZone(selectedSpace.id, {
      name: newZoneName.trim(),
      type: newZoneType
    });
    setNewZoneName('');
    setShowAddZone(false);
  };

  const formatHoursDisplay = (hoursStr?: string) => {
    if (!hoursStr) return '2–4 hours';
    switch (hoursStr) {
      case 'less_than_2h':
        return '< 2 hours/day';
      case '2_to_4h':
        return '2–4 hours/day';
      case '4_to_6h':
        return '4–6 hours/day';
      case 'more_than_6h':
        return '6+ hours/day';
      case 'unknown':
        return 'Observation needed';
      default:
        return hoursStr.replace(/_/g, ' ');
    }
  };

  const formatSourceDisplay = (source?: string) => {
    switch (source) {
      case 'combined':
        return 'Your observations + garden baseline';
      case 'user_reported':
        return 'User reported baseline';
      case 'photo_estimate':
        return 'Photo observation estimate';
      case 'calculated':
        return 'Calculated solar position';
      default:
        return 'Reported profile';
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>Confidence: High</span>;
      case 'moderate':
        return <span className="badge badge-neutral" style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#92400E' }}>Confidence: Moderate</span>;
      default:
        return <span className="badge badge-neutral" style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', color: '#475569' }}>Confidence: Low</span>;
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        backgroundColor: '#FFFFFF',
        border: '1.5px solid var(--color-primary-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem'
      }}
    >
      {/* 1. Header & Primary Estimate */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Sun size={20} color="var(--color-sun-gold)" />
            <strong style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)' }}>
              Sunlight Intelligence
            </strong>
            {getConfidenceBadge(estimate?.confidence || profile?.confidence)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Source: <strong>{formatSourceDisplay(estimate?.source || profile?.source)}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGuidedFlowOpen(!isGuidedFlowOpen)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
        >
          <span>{isGuidedFlowOpen ? 'Close Observations' : 'Check Sunlight'}</span>
          {isGuidedFlowOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 2. Main Estimate Metric Badge */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          backgroundColor: 'var(--color-bg-base)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-subtle)', fontWeight: 700 }}>
            Estimated Sunlight
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary-dark)', margin: '0.2rem 0' }}>
            ☀️ {formatHoursDisplay(estimate?.estimatedHours || profile?.estimatedDailyHours)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {observations.length === 0
              ? 'Based on your reported setup answer.'
              : `Based on ${observations.length} recorded sunlight observation${observations.length === 1 ? '' : 's'}.`}
          </span>
        </div>

        {/* Solar Calculations (Astronomical on-device) */}
        {solarData && (
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-subtle)', fontWeight: 700 }}>
              Astronomical Solar Times ({garden?.location.city})
            </span>
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.4rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sunrise size={14} color="#D97706" />
                <span>Sunrise: <strong>{solarData.approxSunriseTime}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sunset size={14} color="#C05621" />
                <span>Sunset: <strong>{solarData.approxSunsetTime}</strong></span>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '0.25rem' }}>
              Total daylight today: ~{solarData.daylightHours}h
            </div>
          </div>
        )}
      </div>

      {/* 3. Sunlight Zones (Milestone 5 Requirement 8) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
            Sunlight Zones in {selectedSpace.name} ({zones.length})
          </strong>
          <button
            type="button"
            onClick={() => setShowAddZone(!showAddZone)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--color-primary)' }}
          >
            <Plus size={13} /> {showAddZone ? 'Cancel' : 'Add Zone'}
          </button>
        </div>

        {showAddZone && (
          <form onSubmit={handleAddZone} style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              id="zone-name-input"
              aria-label="Micro-climate zone name"
              type="text"
              placeholder="Zone name (e.g. West Railing)"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="input-field"
              style={{ flex: 1, minWidth: 160, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              required
            />
            <select
              aria-label="Micro-climate zone sunlight type"
              value={newZoneType}
              onChange={(e) => setNewZoneType(e.target.value as any)}
              className="input-field"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            >
              <option value="sunny">☀️ Sunny (Direct)</option>
              <option value="partial_shade">🌤️ Partial Shade</option>
              <option value="shade">🌥️ Shade</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
              Save Zone
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {zones.map((zone) => (
            <div
              key={zone.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                backgroundColor:
                  zone.type === 'sunny'
                    ? '#FEF3C7'
                    : zone.type === 'partial_shade'
                    ? '#F0FDF4'
                    : '#F1F5F9',
                color:
                  zone.type === 'sunny'
                    ? '#92400E'
                    : zone.type === 'partial_shade'
                    ? '#166534'
                    : '#475569',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <span>{zone.type === 'sunny' ? '☀️' : zone.type === 'partial_shade' ? '🌤️' : '🌥️'}</span>
              <strong>{zone.name}</strong>
              <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({zone.type.replace(/_/g, ' ')})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Guided Sunlight Check Collapsible (Milestone 5 Requirement 3 & 7) */}
      {isGuidedFlowOpen && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginTop: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Compass size={18} color="var(--color-primary)" />
            <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
              Help GardenMitra understand your sunlight
            </strong>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
            Log what light reaches this space at different times of day. You don&apos;t need complex tools—just glance outside!
          </p>

          <form onSubmit={handleRecordObservation}>
            {/* Time of Day selection */}
            <div style={{ marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Time of Day:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['morning', 'afternoon', 'evening'] as const).map((tod) => (
                  <button
                    key={tod}
                    type="button"
                    onClick={() => setSelectedTimeOfDay(tod)}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      textTransform: 'capitalize',
                      backgroundColor: selectedTimeOfDay === tod ? 'var(--color-primary)' : 'var(--color-bg-base)',
                      color: selectedTimeOfDay === tod ? '#FFFFFF' : 'var(--color-text-main)',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    {tod}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition selection */}
            <div style={{ marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Observed Sunlight:
              </span>
              <div role="group" aria-label="Observed sunlight condition" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCondition('mostly_sunny')}
                  aria-pressed={selectedCondition === 'mostly_sunny'}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: selectedCondition === 'mostly_sunny' ? '#FEF3C7' : 'var(--color-bg-base)',
                    color: selectedCondition === 'mostly_sunny' ? '#92400E' : 'var(--color-text-main)',
                    border: `1px solid ${selectedCondition === 'mostly_sunny' ? '#F59E0B' : 'var(--color-border-subtle)'}`
                  }}
                >
                  ☀️ Mostly sunny
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCondition('partially_shaded')}
                  aria-pressed={selectedCondition === 'partially_shaded'}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: selectedCondition === 'partially_shaded' ? '#F0FDF4' : 'var(--color-bg-base)',
                    color: selectedCondition === 'partially_shaded' ? '#166534' : 'var(--color-text-main)',
                    border: `1px solid ${selectedCondition === 'partially_shaded' ? '#22C55E' : 'var(--color-border-subtle)'}`
                  }}
                >
                  🌤️ Partially shaded
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCondition('mostly_shaded')}
                  aria-pressed={selectedCondition === 'mostly_shaded'}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: selectedCondition === 'mostly_shaded' ? '#F1F5F9' : 'var(--color-bg-base)',
                    color: selectedCondition === 'mostly_shaded' ? '#475569' : 'var(--color-text-main)',
                    border: `1px solid ${selectedCondition === 'mostly_shaded' ? '#94A3B8' : 'var(--color-border-subtle)'}`
                  }}
                >
                  🌥️ Mostly shaded
                </button>
              </div>
            </div>

            {/* Notes input */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                id="observation-note-input"
                aria-label="Sunlight observation note"
                type="text"
                placeholder="Optional notes (e.g. shadow from neighboring building)"
                value={observationNote}
                onChange={(e) => setObservationNote(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                + Save Sunlight Observation
              </button>
            </div>
          </form>

          {/* Past Observations List */}
          {observations.length > 0 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)', display: 'block', marginBottom: '0.4rem' }}>
                Recorded Observations ({observations.length}):
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 110, overflowY: 'auto' }}>
                {observations.map((obs) => (
                  <div
                    key={obs.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.6rem',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <span>
                      <strong>{obs.timeOfDay.toUpperCase()}</strong>: {obs.condition.replace(/_/g, ' ')}
                      {obs.notes && ` — ${obs.notes}`}
                    </span>
                    <span style={{ color: 'var(--color-text-subtle)' }}>
                      <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                      {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Evidence & Limitations Honesty Note (Milestone 5 Requirement 12) */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-subtle)', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <AlertCircle size={13} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>
            {estimate?.limitations?.[0] || 'A single photograph is not treated as proof of exact daily sunlight. Measurements are estimated, explainable, and confidence-aware.'}
          </span>
        </div>
        {estimate?.evidence && estimate.evidence.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.2rem' }}>
            <HelpCircle size={13} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>Why: {estimate.evidence.slice(0, 2).join(' ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
