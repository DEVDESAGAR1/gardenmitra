import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { useToast } from '../context/ToastContext';
import { gardenPerformanceService } from '../services/gardenPerformanceService';
import { PerformanceTimeWindow, PerformanceInsightCategory } from '../types';
import {
  TrendingUp,
  Sprout,
  CheckCircle2,
  Ruler,
  Activity,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  PlusCircle,
  CalendarCheck
} from 'lucide-react';

export const GardenPerformanceView: React.FC = () => {
  const {
    garden,
    spaces,
    adaptiveCareTasks,
    diagnosisHistory,
    environmentalObservations,
    environmentalContext,
    addJournalEntry,
    setActiveTab
  } = useGarden();

  const { warning, success } = useToast();

  // Filters
  const [filterSpaceId, setFilterSpaceId] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<PerformanceTimeWindow>('all_time');
  const [selectedCategory, setSelectedCategory] = useState<PerformanceInsightCategory | 'all'>('all');
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>('all');

  // Height Measurement Form Modal State
  const [showAddHeightModal, setShowAddHeightModal] = useState(false);
  const [selectedPlantForHeight, setSelectedPlantForHeight] = useState<string>('');
  const [newHeightCm, setNewHeightCm] = useState<string>('');
  const [measurementNote, setMeasurementNote] = useState<string>('');

  // Generate Report deterministically
  const report = useMemo(() => {
    return gardenPerformanceService.generatePerformanceReport({
      garden,
      spaces,
      selectedSpaceId: filterSpaceId,
      selectedPlantInstanceId: selectedPlantFilter !== 'all' ? selectedPlantFilter : null,
      timeWindow,
      adaptiveCareTasks,
      diagnosisHistory,
      environmentalObservations,
      environmentalContext
    });
  }, [
    garden,
    spaces,
    filterSpaceId,
    selectedPlantFilter,
    timeWindow,
    adaptiveCareTasks,
    diagnosisHistory,
    environmentalObservations,
    environmentalContext
  ]);

  // Filtered Insights
  const filteredInsights = useMemo(() => {
    if (selectedCategory === 'all') return report.insights;
    return report.insights.filter((i) => i.category === selectedCategory);
  }, [report.insights, selectedCategory]);

  // Available plant instances across current space selection
  const availablePlantInstances = useMemo(() => {
    const relevantSpaces = filterSpaceId
      ? spaces.filter((s) => s.id === filterSpaceId)
      : spaces;
    return relevantSpaces.flatMap((s) =>
      (s.plants || []).map((p) => ({
        instanceId: p.instanceId || `inst-${p.plantId}`,
        name: p.plant.name,
        spaceId: s.id,
        spaceName: s.name,
        plant: p.plant
      }))
    );
  }, [spaces, filterSpaceId]);

  // Submit new height measurement
  const handleSaveHeightMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const heightVal = parseFloat(newHeightCm);
    if (!selectedPlantForHeight || isNaN(heightVal) || heightVal <= 0) {
      warning('Please select a plant and enter a valid positive height measurement in cm.');
      return;
    }

    const target = availablePlantInstances.find((p) => p.instanceId === selectedPlantForHeight);
    if (!target) return;

    // Use existing addJournalEntry which safely updates heightMeasurements
    const nowIso = new Date().toISOString();
    addJournalEntry({
      plantInstanceId: target.instanceId,
      plantId: target.plant.id,
      spaceId: target.spaceId || spaces[0]?.id || 'default-space',
      type: 'height_measured',
      heightCm: heightVal,
      note: measurementNote.trim() ? measurementNote.trim() : `Recorded height: ${heightVal} cm`,
      source: 'user',
      occurredAt: nowIso
    });

    success(`Recorded height: ${heightVal} cm for ${target.plant.name}!`);
    setShowAddHeightModal(false);
    setNewHeightCm('');
    setMeasurementNote('');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <TrendingUp size={24} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--color-primary-dark)' }}>
              Garden Performance & Insights
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.925rem' }}>
            Evidence-based analytics derived from real journal entries, height measurements, care tasks, and health follow-ups.
          </p>
        </div>

        {/* Global Action: Log Height Measurement */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (availablePlantInstances.length > 0) {
                setSelectedPlantForHeight(availablePlantInstances[0].instanceId);
              }
              setShowAddHeightModal(true);
            }}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Ruler size={14} />
            <span>Add Height Measurement</span>
          </button>
        </div>
      </div>

      {/* Control Filters Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#FFFFFF',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Space Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Layers size={14} /> Space:
          </span>
          <select
            value={filterSpaceId || 'all'}
            onChange={(e) => setFilterSpaceId(e.target.value === 'all' ? null : e.target.value)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              backgroundColor: '#FAFAFA'
            }}
          >
            <option value="all">All Spaces ({spaces.length})</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.plants?.length || 0} plants)
              </option>
            ))}
          </select>

          {/* Plant Filter */}
          {availablePlantInstances.length > 0 && (
            <>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                Plant:
              </span>
              <select
                value={selectedPlantFilter}
                onChange={(e) => setSelectedPlantFilter(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <option value="all">All Plants ({availablePlantInstances.length})</option>
                {availablePlantInstances.map((p) => (
                  <option key={p.instanceId} value={p.instanceId}>
                    {p.name} ({p.spaceName})
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Time Window Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} /> Period:
          </span>
          {(['last_7_days', 'last_30_days', 'all_time'] as PerformanceTimeWindow[]).map((tw) => (
            <button
              key={tw}
              onClick={() => setTimeWindow(tw)}
              className={`btn btn-sm ${timeWindow === tw ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              {tw === 'last_7_days' ? '7 Days' : tw === 'last_30_days' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* 1. GARDEN VITALITY AT A GLANCE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {/* Living Plants Card */}
        <div className="card" style={{ padding: '1.15rem', backgroundColor: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Living Plants
            </span>
            <Sprout size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.2rem' }}>
            {report.inventory.activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {report.inventory.plannedCount > 0 ? `+${report.inventory.plannedCount} planned` : 'Active in growing spaces'}
          </div>
        </div>

        {/* Milestones Recorded Card */}
        <div className="card" style={{ padding: '1.15rem', backgroundColor: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Milestones Logged
            </span>
            <Sparkles size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.2rem' }}>
            {report.lifecycle.milestoneTimeline.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {report.lifecycle.confirmedMilestonesCount} user-confirmed
          </div>
        </div>

        {/* Care Tasks Completed Card */}
        <div className="card" style={{ padding: '1.15rem', backgroundColor: '#FFFFFF', borderLeft: '4px solid #2563EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Completed Care
            </span>
            <CheckCircle2 size={18} color="#2563EB" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.2rem' }}>
            {report.care.totalCompletedTasks}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {report.care.completionRatePercent !== null ? `${report.care.completionRatePercent}% completion rate` : 'No tasks scheduled'}
          </div>
        </div>

        {/* Height Observations Card */}
        <div className="card" style={{ padding: '1.15rem', backgroundColor: '#FFFFFF', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Growth Points
            </span>
            <Ruler size={18} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.2rem' }}>
            {report.growth.totalHeightMeasurements}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {report.growth.plantsWithSufficientData} plants with rate trend
          </div>
        </div>
      </div>

      {/* 2. EXPLAINABLE INSIGHTS FEED */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={18} color="var(--color-primary)" />
            Explainable Garden Insights
          </h2>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {(['all', 'milestone', 'growth', 'care', 'health', 'inventory'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredInsights.length === 0 ? (
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#FAFAFA' }}>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No insights in this category yet. Record more observations to generate explainable garden insights.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredInsights.map((insight) => {
              const isHigh = insight.priority === 'high';
              return (
                <div
                  key={insight.id}
                  className="card"
                  style={{
                    padding: '1.15rem',
                    backgroundColor: '#FFFFFF',
                    borderLeft: `4px solid ${isHigh ? '#EF4444' : insight.category === 'growth' ? '#8B5CF6' : insight.category === 'milestone' ? '#F59E0B' : 'var(--color-primary)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.675rem', textTransform: 'capitalize' }}>
                        {insight.category}
                      </span>
                      {insight.plantName && (
                        <span className="badge badge-green" style={{ fontSize: '0.675rem' }}>
                          {insight.plantName}
                        </span>
                      )}
                      <h3 style={{ fontSize: '1.025rem', fontWeight: 600, margin: 0, color: 'var(--color-primary-dark)' }}>
                        {insight.title}
                      </h3>
                    </div>

                    {insight.recommendedNextAction && (
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                        Action: {insight.recommendedNextAction}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#4B5563', margin: '0 0 0.5rem 0', lineHeight: 1.45 }}>
                    {insight.explanation}
                  </p>

                  {/* Supporting Context & Limitations */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                    <span>Records examined: {insight.recordsExamined}</span>
                    {insight.dataLimitations.length > 0 && (
                      <span style={{ color: '#92400E' }}>
                        ⚠️ Limitation: {insight.dataLimitations.join(', ')}
                      </span>
                    )}
                    {insight.latestEvidenceTimestamp && (
                      <span>Last evidence: {new Date(insight.latestEvidenceTimestamp).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. GROWTH TRACKING & PHYSICAL MEASUREMENTS */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Ruler size={18} color="#8B5CF6" />
            Physical Growth & Height Measurements
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Requires ≥ 2 dated measurements
          </span>
        </div>

        {report.growth.plantGrowthRates.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FAFAFA' }}>
            <Ruler size={32} color="#8B5CF6" style={{ margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
            <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--color-primary-dark)' }}>No Height Measurements Recorded</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto 1rem auto' }}>
              Use a physical ruler to measure from soil surface to highest leaf tip. Record measurements every week to calculate genuine plant growth rates.
            </p>
            <button
              onClick={() => {
                if (availablePlantInstances.length > 0) {
                  setSelectedPlantForHeight(availablePlantInstances[0].instanceId);
                }
                setShowAddHeightModal(true);
              }}
              className="btn btn-outline btn-sm"
            >
              <PlusCircle size={14} style={{ marginRight: '0.3rem' }} />
              Record First Height Measurement
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {report.growth.plantGrowthRates.map((rateItem) => {
              const isSufficient = rateItem.status === 'sufficient_data';
              return (
                <div key={rateItem.plantInstanceId} className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--color-primary-dark)' }}>
                      {rateItem.plantName}
                    </h3>
                    <span className={`badge ${isSufficient ? 'badge-green' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                      {isSufficient ? 'Trend Active' : 'Insufficient Data'}
                    </span>
                  </div>

                  {isSufficient ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#15803D' }}>
                          +{rateItem.deltaCm} cm
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          over {rateItem.daysElapsed} days (~{rateItem.growthRateCmPerDay} cm/day)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                        Initial: {rateItem.initialHeightCm} cm → Latest: {rateItem.latestHeightCm} cm ({rateItem.measurementCount} points)
                      </div>

                      {/* Mini SVG Sparkline */}
                      <div style={{ height: 42, backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', padding: '4px 8px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                        {rateItem.measurements.map((m, idx) => {
                          const minH = rateItem.initialHeightCm || 1;
                          const maxH = rateItem.latestHeightCm || 10;
                          const range = Math.max(1, maxH - minH);
                          const barPct = Math.max(15, Math.min(100, Math.round(((m.heightCm - minH) / range) * 85) + 15));
                          return (
                            <div
                              key={m.id || idx}
                              title={`${m.heightCm} cm on ${new Date(m.measuredAt).toLocaleDateString()}`}
                              style={{
                                flex: 1,
                                height: `${barPct}%`,
                                backgroundColor: '#8B5CF6',
                                borderRadius: '2px 2px 0 0',
                                opacity: 0.85
                              }}
                            />
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '0.35rem' }}>
                        {rateItem.dataLimitations[0]}
                      </div>
                      {rateItem.latestHeightCm && (
                        <div style={{ fontSize: '0.775rem', color: '#0F172A', fontWeight: 500 }}>
                          Baseline height: {rateItem.latestHeightCm} cm
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button
                      onClick={() => {
                        setSelectedPlantForHeight(rateItem.plantInstanceId);
                        setShowAddHeightModal(true);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      <PlusCircle size={12} style={{ marginRight: '0.25rem' }} />
                      Log Measurement
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. CARE ACTIVITY & COMPLETION TRANSPARENCY */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CalendarCheck size={18} color="#2563EB" />
            Care Activity & Completion Metrics
          </h2>
          <button
            onClick={() => setActiveTab('planner')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            Open Care Planner <ChevronRight size={13} />
          </button>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
          {/* Rate Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                Eligible Task Completion Rate
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {report.care.completionRatePercent !== null ? `${report.care.completionRatePercent}%` : 'N/A'}
              </div>
            </div>

            <div style={{ maxWidth: 420, fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45, backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Info size={13} /> Denominator Definition
              </div>
              {report.care.denominatorExplanation}
              <div style={{ marginTop: '0.2rem' }}>
                Eligible tasks: <strong>{report.care.totalEligibleTasks}</strong> ({report.care.totalCompletedTasks} completed, {report.care.totalPendingTasks} pending/postponed).
              </div>
            </div>
          </div>

          {/* Breakdown by Category */}
          <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', margin: '0 0 0.65rem 0' }}>
            Completed Tasks by Care Action Type
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
            {Object.entries(report.care.tasksByCategory).map(([cat, count]) => (
              <div key={cat} style={{ backgroundColor: '#F8FAFC', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', display: 'block' }}>
                  {cat.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0F172A' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. PLANT HEALTH & RECOVERY FOLLOW-UPS */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={18} color="#059669" />
            Plant Health & Recovery Tracking
          </h2>
          <button
            onClick={() => setActiveTab('doctor')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            Open Garden Doctor <ChevronRight size={13} />
          </button>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#F0FDF4', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #BBF7D0' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Resolved / Improved</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#15803D' }}>
                {report.health.outcomes.resolved + report.health.outcomes.improved}
              </div>
            </div>

            <div style={{ backgroundColor: '#FEF3C7', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A' }}>
              <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>No Change / Pending</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#B45309' }}>
                {report.health.outcomes.no_change + report.health.outcomes.pending}
              </div>
            </div>

            <div style={{ backgroundColor: '#FEF2F2', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #FECACA' }}>
              <span style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600 }}>Declined Condition</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#DC2626' }}>
                {report.health.outcomes.declined}
              </div>
            </div>
          </div>

          {report.health.plantsWarrantingInspection.length > 0 && (
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginTop: '0.5rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <AlertTriangle size={14} /> Attention Warranted ({report.health.plantsWarrantingInspection.length} plants)
              </strong>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#78350F' }}>
                {report.health.plantsWarrantingInspection.map((p, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                    <strong>{p.plantName}</strong>: {p.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 6. WEATHER DATA TRANSPARENCY NOTICE */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}
      >
        <Info size={18} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.45 }}>
          <strong>Environmental Record Transparency:</strong> {report.historicalWeatherNote} GardenMitra respects your privacy and local storage constraints: no background cloud tracking or fabricated historical weather archives are introduced.
        </div>
      </div>

      {/* MODAL: ADD HEIGHT MEASUREMENT */}
      {showAddHeightModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddHeightModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Ruler size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>
                  Log Height Measurement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddHeightModal(false)}
                className="btn btn-ghost btn-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHeightMeasurement}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="perf-target-plant" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Target Plant
                </label>
                <select
                  id="perf-target-plant"
                  value={selectedPlantForHeight}
                  onChange={(e) => setSelectedPlantForHeight(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9rem'
                  }}
                  required
                >
                  {availablePlantInstances.map((p) => (
                    <option key={p.instanceId} value={p.instanceId}>
                      {p.name} ({p.spaceName})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="perf-height-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Measured Height (cm)
                </label>
                <input
                  id="perf-height-input"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="500"
                  placeholder="e.g. 18.5"
                  value={newHeightCm}
                  onChange={(e) => setNewHeightCm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.95rem'
                  }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                  Measure from soil surface to highest natural leaf node.
                </span>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="perf-measurement-note" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Observation Note (Optional)
                </label>
                <input
                  id="perf-measurement-note"
                  type="text"
                  placeholder="e.g. New set of leaves emerging"
                  value={measurementNote}
                  onChange={(e) => setMeasurementNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddHeightModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
