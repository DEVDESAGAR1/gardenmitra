import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import {
  PlantLifecycleStage,
  PlantJournalEntryType
} from '../types';
import { growthTrackingEngine } from '../services/growthTrackingEngine';
import {
  BookOpen,
  Sparkles,
  Ruler,
  TrendingUp,
  Camera,
  Plus,
  Filter,
  Info,
  Clock,
  ChevronRight,
  Sprout
} from 'lucide-react';

export const GardenJournalView: React.FC = () => {
  const {
    spaces,
    gardenInsights,
    addJournalEntry,
    updatePlantLifecycleStage,
    addPlantHeightMeasurement,
    getAllGardenJournalEntries,
    setSelectedPlantForDetail
  } = useGarden();

  // Filter states
  const [filterSpaceId, setFilterSpaceId] = useState<string>('all');
  const [filterPlantId, setFilterPlantId] = useState<string>('all');
  const [filterType, setFilterType] = useState<PlantJournalEntryType | 'all'>('all');
  const [activeViewMode, setActiveViewMode] = useState<'timeline' | 'compare' | 'height'>('timeline');

  // New Entry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<PlantJournalEntryType>('user_note');
  const [selectedPlantInstanceId, setSelectedPlantInstanceId] = useState<string>('');
  const [entryNote, setEntryNote] = useState('');
  const [entryHeight, setEntryHeight] = useState('');
  const [entryStage, setEntryStage] = useState<PlantLifecycleStage>('vegetative');

  // Photo Comparison state
  const [compareFirstId, setCompareFirstId] = useState<string>('');
  const [compareSecondId, setCompareSecondId] = useState<string>('');

  // Collect all plants across all spaces
  const allPlants = useMemo(() => {
    return spaces.flatMap((s) => (s.plants || []).map((p) => ({ ...p, spaceName: s.name })));
  }, [spaces]);

  // All journal entries
  const allEntries = useMemo(() => {
    return getAllGardenJournalEntries();
  }, [getAllGardenJournalEntries, allPlants]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (filterSpaceId !== 'all' && entry.spaceId !== filterSpaceId) return false;
      if (filterPlantId !== 'all' && entry.plantId !== filterPlantId && entry.plantInstanceId !== filterPlantId) return false;
      if (filterType !== 'all' && entry.type !== filterType) return false;
      return true;
    });
  }, [allEntries, filterSpaceId, filterPlantId, filterType]);

  // Comparison result
  const comparisonResult = useMemo(() => {
    if (!compareFirstId || !compareSecondId || compareFirstId === compareSecondId) return null;
    const first = allEntries.find((e) => e.id === compareFirstId);
    const second = allEntries.find((e) => e.id === compareSecondId);
    if (!first || !second) return null;

    // Sort so earlier is first
    const isFirstEarlier = new Date(first.occurredAt).getTime() <= new Date(second.occurredAt).getTime();
    const earlier = isFirstEarlier ? first : second;
    const later = isFirstEarlier ? second : first;

    return growthTrackingEngine.compareObservations(
      {
        occurredAt: earlier.occurredAt,
        stage: earlier.stage,
        heightCm: earlier.heightCm,
        mediaId: earlier.mediaIds?.[0]
      },
      {
        occurredAt: later.occurredAt,
        stage: later.stage,
        heightCm: later.heightCm,
        mediaId: later.mediaIds?.[0]
      }
    );
  }, [compareFirstId, compareSecondId, allEntries]);

  const handleOpenAddModal = (type: PlantJournalEntryType = 'user_note') => {
    setModalType(type);
    setEntryNote('');
    setEntryHeight('');
    const defaultInst = allPlants[0]?.instanceId || '';
    setSelectedPlantInstanceId(defaultInst);
    setIsModalOpen(true);
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlant = allPlants.find((p) => p.instanceId === selectedPlantInstanceId);
    if (!targetPlant || !targetPlant.spaceId) return;

    if (modalType === 'stage_changed') {
      updatePlantLifecycleStage(targetPlant.instanceId || targetPlant.plantId, entryStage, entryNote);
    } else if (modalType === 'height_measured') {
      const parsedHeight = parseFloat(entryHeight);
      if (!isNaN(parsedHeight) && parsedHeight > 0) {
        addPlantHeightMeasurement(targetPlant.instanceId || targetPlant.plantId, parsedHeight, entryNote);
      }
    } else {
      addJournalEntry({
        plantInstanceId: targetPlant.instanceId || targetPlant.plantId,
        plantId: targetPlant.plantId,
        spaceId: targetPlant.spaceId,
        type: modalType,
        note: entryNote,
        source: 'user',
        stage: entryStage
      });
    }

    setIsModalOpen(false);
    setEntryNote('');
    setEntryHeight('');
  };

  const getEntryBadge = (type: PlantJournalEntryType) => {
    switch (type) {
      case 'planted':
        return <span className="badge badge-green">🌱 Planted</span>;
      case 'watered':
        return <span className="badge" style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0' }}>💧 Watered</span>;
      case 'stage_changed':
        return <span className="badge badge-gold">🌿 Stage Milestone</span>;
      case 'height_measured':
        return <span className="badge" style={{ backgroundColor: '#FAF5FF', color: '#6B46C1' }}>📏 Height Log</span>;
      case 'flowering':
        return <span className="badge" style={{ backgroundColor: '#FFF5F5', color: '#C53030' }}>🌸 Flowering</span>;
      case 'harvested':
        return <span className="badge badge-green">🧺 Harvested</span>;
      default:
        return <span className="badge badge-neutral">📝 Observation</span>;
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={26} color="var(--color-primary)" />
              Garden Memory &amp; Growth Tracking
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', color: 'var(--color-text-muted)' }}>
              Your garden's living history: every watering, growth stage, measurement, and photo remembered.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleOpenAddModal('user_note')}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={16} />
              Log Observation
            </button>
            <button
              onClick={() => handleOpenAddModal('height_measured')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Ruler size={16} />
              Log Height (cm)
            </button>
          </div>
        </div>
      </div>

      {/* Space Selector toolbar if multi-space */}
      {spaces.length > 1 && <SpaceSelector />}

      {/* Garden Insights Banner */}
      {gardenInsights.length > 0 && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <Sparkles size={18} color="var(--color-primary)" />
            <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
              Garden Memory Insights
            </strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {gardenInsights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-main)'
                }}
              >
                <ChevronRight size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 4 }} />
                <div>
                  <strong>{insight.title}: </strong>
                  <span>{insight.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveViewMode('timeline')}
          className={`btn btn-sm ${activeViewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <Clock size={15} style={{ marginRight: 4 }} />
          Chronological Timeline ({filteredEntries.length})
        </button>
        <button
          onClick={() => setActiveViewMode('compare')}
          className={`btn btn-sm ${activeViewMode === 'compare' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <Camera size={15} style={{ marginRight: 4 }} />
          Growth Photo Comparison
        </button>
        <button
          onClick={() => setActiveViewMode('height')}
          className={`btn btn-sm ${activeViewMode === 'height' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <Ruler size={15} style={{ marginRight: 4 }} />
          Height &amp; Rates Log
        </button>
      </div>

      {/* Timeline View */}
      {activeViewMode === 'timeline' && (
        <>
          {/* Filters Bar */}
          <div
            className="card"
            style={{
              padding: '0.85rem 1.15rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              backgroundColor: '#FAFCFA'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <Filter size={15} color="var(--color-primary)" />
              <span>Filters:</span>
            </div>

            {/* Space Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Space:</span>
              <select
                value={filterSpaceId}
                onChange={(e) => setFilterSpaceId(e.target.value)}
                style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              >
                <option value="all">All Spaces</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Plant Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Plant:</span>
              <select
                value={filterPlantId}
                onChange={(e) => setFilterPlantId(e.target.value)}
                style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              >
                <option value="all">All Plants</option>
                {allPlants.map((p) => (
                  <option key={p.instanceId || p.plantId} value={p.instanceId || p.plantId}>
                    {p.plant.name} ({p.spaceName})
                  </option>
                ))}
              </select>
            </div>

            {/* Entry Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Action:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              >
                <option value="all">All Actions</option>
                <option value="planted">Planted</option>
                <option value="watered">Watered</option>
                <option value="stage_changed">Stage Changes</option>
                <option value="height_measured">Height Measurements</option>
                <option value="flowering">Flowering</option>
                <option value="harvested">Harvested</option>
                <option value="user_note">User Notes</option>
              </select>
            </div>
          </div>

          {/* Timeline List */}
          {filteredEntries.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--color-bg-base)',
                border: '1px dashed var(--color-border-subtle)'
              }}
            >
              <Sprout size={40} color="var(--color-primary-light)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
                No journal entries found
              </h3>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: 450, margin: '0 auto 1.5rem' }}>
                Your plants will remember every milestone as you care for them. Record a quick note or watering action to start!
              </p>
              <button onClick={() => handleOpenAddModal('user_note')} className="btn btn-primary btn-sm">
                <Plus size={16} /> Log First Observation
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredEntries.map((entry) => {
                const plant = allPlants.find((p) => p.instanceId === entry.plantInstanceId || p.plantId === entry.plantId);
                const space = spaces.find((s) => s.id === entry.spaceId);
                const formattedDate = new Date(entry.occurredAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={entry.id}
                    className="card"
                    style={{
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      borderLeft: '4px solid var(--color-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getEntryBadge(entry.type)}
                        <strong
                          onClick={() => plant && setSelectedPlantForDetail(plant.plant)}
                          style={{
                            fontSize: '0.95rem',
                            color: 'var(--color-primary-dark)',
                            cursor: plant ? 'pointer' : 'default'
                          }}
                        >
                          {plant?.plant.name || 'Plant'}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                          in {space?.name || 'Space'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          Source: {entry.source}
                        </span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Entry Details */}
                    {entry.note && (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                        {entry.note}
                      </p>
                    )}

                    {/* Metadata tags: Stage, Height, Weather */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {entry.stage && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          Stage: {entry.stage}
                        </span>
                      )}
                      {entry.heightCm !== undefined && (
                        <span className="badge" style={{ backgroundColor: '#FAF5FF', color: '#6B46C1', fontSize: '0.75rem' }}>
                          Height: {entry.heightCm} cm
                        </span>
                      )}
                      {entry.environmentalSnapshot ? (
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          Weather at observation: {entry.environmentalSnapshot.temperatureC}°C ({entry.environmentalSnapshot.weatherCondition})
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
                          Historical weather unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Comparison View */}
      {activeViewMode === 'compare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
              Qualitative Growth Comparison
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Select two historical entries or photos to evaluate progression over time.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  First Observation / Photo:
                </label>
                <select
                  value={compareFirstId}
                  onChange={(e) => setCompareFirstId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="">Select an observation...</option>
                  {allEntries.map((e) => (
                    <option key={e.id} value={e.id}>
                      {new Date(e.occurredAt).toLocaleDateString('en-IN')} - {e.type} ({e.note || e.stage || 'Entry'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Second Observation / Photo:
                </label>
                <select
                  value={compareSecondId}
                  onChange={(e) => setCompareSecondId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="">Select a later observation...</option>
                  {allEntries.map((e) => (
                    <option key={e.id} value={e.id}>
                      {new Date(e.occurredAt).toLocaleDateString('en-IN')} - {e.type} ({e.note || e.stage || 'Entry'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Intelligence Output */}
            {comparisonResult && (
              <div
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <TrendingUp size={18} color="var(--color-primary)" />
                  <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                    Growth Analysis ({comparisonResult.daysElapsed} days elapsed)
                  </strong>
                </div>

                <p style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
                  {comparisonResult.qualitativeSummary}
                </p>

                {comparisonResult.heightDeltaCm !== undefined && (
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                    <span className="badge badge-green">
                      Net Height Change: {comparisonResult.heightDeltaCm > 0 ? `+${comparisonResult.heightDeltaCm}` : comparisonResult.heightDeltaCm} cm
                    </span>
                    {comparisonResult.growthRateCmPerDay !== undefined && (
                      <span className="badge badge-neutral">
                        Growth Rate: ~{comparisonResult.growthRateCmPerDay} cm/day
                      </span>
                    )}
                  </div>
                )}

                {comparisonResult.perspectiveDisclaimer && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.4rem',
                      backgroundColor: '#FFFDF0',
                      border: '1px solid #FEF3C7',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.6rem 0.8rem',
                      fontSize: '0.8rem',
                      color: '#92400E'
                    }}
                  >
                    <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{comparisonResult.perspectiveDisclaimer}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Height Trends View */}
      {activeViewMode === 'height' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
              Plant Height &amp; Measurement Log
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Track real physical growth measurements recorded in centimetres.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {allPlants.map((gp) => {
                const measurements = gp.heightMeasurements || [];
                const analysis = growthTrackingEngine.analyzeHeightMeasurements(measurements);

                return (
                  <div
                    key={gp.instanceId || gp.plantId}
                    className="card"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                        {gp.plant.name} ({gp.spaceName})
                      </strong>
                      <button
                        onClick={() => {
                          setSelectedPlantInstanceId(gp.instanceId || gp.plantId);
                          handleOpenAddModal('height_measured');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        + Log Measurement
                      </button>
                    </div>

                    {analysis.measurementCount === 0 ? (
                      <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                        No height measurements logged yet. Use a ruler to record stem height in cm.
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.825rem' }}>
                          Current: {analysis.latestHeightCm} cm
                        </span>
                        {analysis.totalGrowthCm !== undefined && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.825rem' }}>
                            Total Growth: +{analysis.totalGrowthCm} cm
                          </span>
                        )}
                        {analysis.averageRateCmPerDay !== undefined && (
                          <span className="badge" style={{ backgroundColor: '#FAF5FF', color: '#6B46C1', fontSize: '0.825rem' }}>
                            Avg Rate: ~{analysis.averageRateCmPerDay} cm/day
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                          ({analysis.measurementCount} records)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Observation Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>
              {modalType === 'height_measured'
                ? 'Log Plant Height'
                : modalType === 'stage_changed'
                ? 'Update Growth Stage'
                : 'Log Garden Observation'}
            </h3>

            <form onSubmit={handleSubmitEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Plant Selector */}
              <div>
                <label htmlFor="journal-target-plant" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Target Plant:
                </label>
                <select
                  id="journal-target-plant"
                  value={selectedPlantInstanceId}
                  onChange={(e) => setSelectedPlantInstanceId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  {allPlants.map((p) => (
                    <option key={p.instanceId || p.plantId} value={p.instanceId || p.plantId}>
                      {p.plant.name} ({p.spaceName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type */}
              <div>
                <label htmlFor="journal-entry-type" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Entry Type:
                </label>
                <select
                  id="journal-entry-type"
                  value={modalType}
                  onChange={(e) => setModalType(e.target.value as any)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="user_note">General Note / Observation</option>
                  <option value="height_measured">Measured Height (cm)</option>
                  <option value="stage_changed">Growth Stage Transition</option>
                  <option value="flowering">Flowering Noticed</option>
                  <option value="harvested">Produce Harvested</option>
                  <option value="pruned">Pruned / Pinched</option>
                </select>
              </div>

              {/* Height Field */}
              {modalType === 'height_measured' && (
                <div>
                  <label htmlFor="journal-entry-height" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Height in Centimetres (cm):
                  </label>
                  <input
                    id="journal-entry-height"
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    placeholder="e.g. 14.5"
                    value={entryHeight}
                    onChange={(e) => setEntryHeight(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              )}

              {/* Stage Field */}
              {modalType === 'stage_changed' && (
                <div>
                  <label htmlFor="journal-entry-stage" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    New Lifecycle Stage:
                  </label>
                  <select
                    id="journal-entry-stage"
                    value={entryStage}
                    onChange={(e) => setEntryStage(e.target.value as any)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="seeded">Seeded / Sown</option>
                    <option value="germinated">Germinated / Sprouted</option>
                    <option value="seedling">Seedling</option>
                    <option value="vegetative">Vegetative (Active Foliage)</option>
                    <option value="flowering">Flowering</option>
                    <option value="fruiting">Fruiting</option>
                    <option value="harvest">Ready for Harvest</option>
                    <option value="dormant">Dormant</option>
                  </select>
                </div>
              )}

              {/* Notes Field */}
              <div>
                <label htmlFor="journal-entry-note" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Observation Notes (Optional):
                </label>
                <textarea
                  id="journal-entry-note"
                  rows={3}
                  placeholder="e.g. Healthy new side shoots visible. Soil was damp."
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
