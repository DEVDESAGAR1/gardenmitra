import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Droplets,
  Scissors,
  Sprout,
  Check,
  X,
  RefreshCw,
  Sun,
  ShieldCheck,
  Eye,
  AlertTriangle,
  CloudRain
} from 'lucide-react';

export const CarePlannerView: React.FC = () => {
  const {
    selectedSpace,
    spaces,
    adaptiveCareTasks,
    completeAdaptiveCareTask,
    snoozeAdaptiveCareTask,
    dismissAdaptiveCareTask,
    refreshCarePlanner,
    environmentalObservations,
    environmentalContext,
    setShowTouchGrassModal
  } = useGarden();

  // Filter state: 'all' | 'due' | 'inspection' | 'completed'
  const [filterMode, setFilterMode] = useState<'due' | 'inspection' | 'completed' | 'all'>('due');

  // Modal state for completing task with custom notes
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  // Space tasks
  const spaceTasks = useMemo(() => {
    if (!selectedSpace) return adaptiveCareTasks;
    return adaptiveCareTasks.filter((t) => t.spaceId === selectedSpace.id);
  }, [adaptiveCareTasks, selectedSpace]);

  // Distinct filtered lists for each category and tab
  const actionableTasks = useMemo(() => {
    return spaceTasks.filter((t) => t.status === 'due' && t.category !== 'inspection');
  }, [spaceTasks]);

  const inspectionTasks = useMemo(() => {
    return spaceTasks.filter(
      (t) => (t.status === 'due' || t.status === 'suggested') && t.category === 'inspection'
    );
  }, [spaceTasks]);

  const completedTasks = useMemo(() => {
    return spaceTasks.filter((t) => t.status === 'completed');
  }, [spaceTasks]);

  const allActiveTasks = useMemo(() => {
    return spaceTasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'dismissed' &&
        (t.status as string) !== 'cancelled' &&
        t.status !== 'expired'
    );
  }, [spaceTasks]);

  // Tasks filtered by active view mode
  const displayedTasks = useMemo(() => {
    switch (filterMode) {
      case 'due':
        return actionableTasks;
      case 'inspection':
        return inspectionTasks;
      case 'completed':
        return completedTasks;
      case 'all':
        return allActiveTasks;
      default:
        return actionableTasks;
    }
  }, [filterMode, actionableTasks, inspectionTasks, completedTasks, allActiveTasks]);

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'watering':
        return <Droplets size={16} color="#2563EB" />;
      case 'pruning':
        return <Scissors size={16} color="#059669" />;
      case 'feeding':
        return <Sprout size={16} color="#D97706" />;
      case 'inspection':
        return <Eye size={16} color="#7C3AED" />;
      default:
        return <CheckCircle2 size={16} color="var(--color-primary)" />;
    }
  };

  const handleOpenCompleteModal = (taskId: string) => {
    setCompletingTaskId(taskId);
    setCompletionNotes('');
  };

  const handleConfirmComplete = () => {
    if (completingTaskId) {
      completeAdaptiveCareTask(completingTaskId, completionNotes.trim() ? completionNotes.trim() : undefined);
      setCompletingTaskId(null);
      setCompletionNotes('');
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header Title Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <CalendarCheck size={26} color="var(--color-primary)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--color-primary-dark)' }}>
            Adaptive Care Planner
          </h1>
        </div>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.925rem', lineHeight: 1.5 }}>
          Evidence-grounded gardening tasks derived from real physical conditions, plant lifecycles, and botanical requirements.
        </p>
      </div>

      {/* Space Selector Bar with unified controls (Active Space, Edit Space, Add New Space, Reevaluate Care) */}
      {spaces.length > 0 && (
        <SpaceSelector
          compact={false}
          extraActions={
            <button
              type="button"
              onClick={refreshCarePlanner}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
              title="Reevaluate recommendations against latest observations"
              aria-label="Reevaluate care recommendations"
            >
              <RefreshCw size={14} />
              <span>Reevaluate Care</span>
            </button>
          }
        />
      )}

      {/* Milestone 16: Severe Weather Alert Banner */}
      {environmentalContext?.snapshot?.severeWeatherAlert && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #F87171',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem'
          }}
        >
          <AlertTriangle size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: '#991B1B', fontSize: '1rem' }}>
                {environmentalContext.snapshot.severeWeatherAlert.headline}
              </span>
              <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.7rem' }}>
                {environmentalContext.snapshot.severeWeatherAlert.severity.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '0 0 0.4rem 0', color: '#7F1D1D', fontSize: '0.875rem', lineHeight: 1.45 }}>
              {environmentalContext.snapshot.severeWeatherAlert.description}
            </p>
            <div style={{ fontSize: '0.825rem', color: '#991B1B', fontWeight: 500 }}>
              💡 Action: {environmentalContext.snapshot.severeWeatherAlert.instructions}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        className="care-planner-tabs"
        role="tablist"
        aria-label="Care task filter tabs"
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={filterMode === 'due'}
          onClick={() => setFilterMode('due')}
          className={`btn btn-sm ${filterMode === 'due' ? 'btn-primary' : 'btn-outline'}`}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <CheckCircle2 size={14} style={{ marginRight: '0.3rem' }} />
          Actionable Tasks ({actionableTasks.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterMode === 'inspection'}
          onClick={() => setFilterMode('inspection')}
          className={`btn btn-sm ${filterMode === 'inspection' ? 'btn-primary' : 'btn-outline'}`}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <Eye size={14} style={{ marginRight: '0.3rem' }} />
          Inspect Soil & Health ({inspectionTasks.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterMode === 'completed'}
          onClick={() => setFilterMode('completed')}
          className={`btn btn-sm ${filterMode === 'completed' ? 'btn-primary' : 'btn-outline'}`}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <Check size={14} style={{ marginRight: '0.3rem' }} />
          Completed ({completedTasks.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterMode === 'all'}
          onClick={() => setFilterMode('all')}
          className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          All Active ({allActiveTasks.length})
        </button>
      </div>

      {/* Tasks List */}
      {displayedTasks.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#F9FAF8',
            border: '1px dashed var(--color-border)'
          }}
        >
          <Sparkles size={40} color="var(--color-primary)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: '0.4rem' }}>
            {filterMode === 'completed'
              ? 'No Completed Tasks Yet'
              : filterMode === 'inspection'
              ? 'No Inspections Needed'
              : "You're all caught up!"}
          </h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-muted)',
              maxWidth: '480px',
              margin: '0 auto 1.5rem auto',
              lineHeight: 1.5
            }}
          >
            {filterMode === 'completed'
              ? 'Complete scheduled care tasks to see them logged in your persistent garden history.'
              : filterMode === 'inspection'
              ? 'All plants and physical checks are within healthy parameters.'
              : "There's nothing requiring action right now. Check back when your garden needs care."}
          </p>
          <button
            type="button"
            onClick={() => setShowTouchGrassModal(true)}
            className="btn btn-terracotta"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sun size={16} />
            <span>Step Outside & Touch Grass</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isSnoozed = task.status === 'snoozed';
            const isHighPriority = task.priority === 'high';

            const plant = selectedSpace?.plants?.find(
              (p) => p.instanceId === task.plantInstanceId || p.plantId === task.plantId
            );

            // Find supporting observation if linked
            const supportingObs = environmentalObservations.filter((o) =>
              (task.supportingObservationIds || []).includes(o.id)
            );

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  padding: '1.35rem',
                  borderLeft: `5px solid ${
                    isCompleted
                      ? '#10B981'
                      : isHighPriority
                      ? '#EF4444'
                      : task.category === 'inspection'
                      ? '#8B5CF6'
                      : 'var(--color-primary)'
                  }`,
                  backgroundColor: isCompleted ? '#F9FAF8' : '#FFFFFF',
                  opacity: isCompleted ? 0.85 : 1
                }}
              >
                <div
                  className="care-task-card-header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '0.6rem'
                  }}
                >
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    {/* Badge row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem' }}>
                        {getCategoryIcon(task.category)}
                        <span style={{ textTransform: 'capitalize' }}>{task.category}</span>
                      </span>

                      {plant && (
                        <span className="badge badge-green" style={{ fontSize: '0.725rem' }}>
                          {plant.plant.name}
                        </span>
                      )}

                      <span
                        className={`badge ${
                          isHighPriority ? 'badge-gold' : 'badge-neutral'
                        }`}
                        style={{ fontSize: '0.725rem', textTransform: 'capitalize' }}
                      >
                        {task.priority} Priority
                      </span>

                      {task.status === 'postponed' && (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontSize: '0.725rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <CloudRain size={12} />
                          Postponed for Rain {task.reevaluateAt ? `(Recheck ${new Date(task.reevaluateAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                        </span>
                      )}

                      {task.isWeatherAware && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                          🌦️ Weather-Aware
                        </span>
                      )}

                      {task.spaceExposure && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                          {task.spaceExposure === 'indoor' ? '🏠 Indoor' : task.spaceExposure === 'sheltered' ? '☂️ Sheltered' : '☀️ Exposed'}
                        </span>
                      )}

                      {isSnoozed && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                          Snoozed
                        </span>
                      )}
                    </div>

                    {/* Task Title */}
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 600,
                        margin: '0 0 0.35rem 0',
                        color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-primary-dark)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        wordBreak: 'break-word'
                      }}
                    >
                      {task.title}
                    </h3>
                  </div>

                  {/* Task Action Controls */}
                  {!isCompleted && (
                    <div
                      className="care-task-actions"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        flexShrink: 0
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(task.id)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        aria-label={`Mark task "${task.title}" as complete`}
                      >
                        <Check size={14} />
                        <span>Complete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => snoozeAdaptiveCareTask(task.id, 24)}
                        className="btn btn-outline btn-sm"
                        title="Snooze for 24 hours"
                        aria-label={`Snooze task "${task.title}" for 24 hours`}
                      >
                        <Clock size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissAdaptiveCareTask(task.id, 'Not needed today')}
                        className="btn btn-outline btn-sm"
                        title="Dismiss task"
                        aria-label={`Dismiss task "${task.title}"`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Instructions & Reasoning */}
                <p style={{ fontSize: '0.875rem', color: '#4B5563', margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
                  {task.description}
                </p>

                {/* Supporting Physical Environmental Evidence */}
                {supportingObs.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.775rem',
                      backgroundColor: '#F0FDF4',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #BBF7D0',
                      color: '#166534',
                      marginBottom: '0.6rem'
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>
                      Physical evidence: {supportingObs.map((o) => `${o.value}${o.unit} ${o.type.replace('_', ' ')}`).join(', ')} (Recorded {new Date(supportingObs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                )}

                {/* Missing Telemetry Warning */}
                {task.missingEvidence && task.missingEvidence.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#FFFBEB',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #FDE68A',
                      color: '#B45309',
                      marginBottom: '0.6rem'
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>Missing context: {task.missingEvidence.join(', ')} — follow physical check instructions.</span>
                  </div>
                )}

                {/* Completed Details */}
                {isCompleted && (
                  <div style={{ fontSize: '0.775rem', color: '#059669', fontStyle: 'italic', marginTop: '0.4rem' }}>
                    Completed on {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'today'}
                    {task.completionNotes ? ` — Note: "${task.completionNotes}"` : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Complete Task Notes */}
      {completingTaskId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={() => setCompletingTaskId(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
              Confirm Task Completion
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Completing this task will record an authentic user care action in your plant's persistent growth journal.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Gardener Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Watered until slow bottom drainage. Top leaves look vibrant."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCompletingTaskId(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="btn btn-primary"
              >
                Confirm & Log in Journal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
