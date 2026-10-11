import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { useToast } from '../context/ToastContext';
import { SpaceSelector } from './SpaceSelector';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Sun,
  Sprout,
  ArrowRight,
  PartyPopper,
  CloudSun,
  Layers,
  Droplets,
  Fingerprint,
  Bell,
  SkipForward,
  Check,
  AlertCircle
} from 'lucide-react';

export const TodaysGardenView: React.FC = () => {
  const {
    tasks,
    allTasks,
    spaces,
    selectedSpace,
    toggleTask,
    setTaskStatus,
    waterPlant,
    checkSoil,
    environmentalAdvice,
    environmentalContext,
    careRecommendations,
    notificationStatus,
    enableNotifications,
    setShowTouchGrassModal,
    setActiveTab
  } = useGarden();

  const { success, info } = useToast();

  const [filterMode, setFilterMode] = useState<'selected' | 'all'>('all');
  const [activeSoilCheckTaskId, setActiveSoilCheckTaskId] = useState<string | null>(null);
  const [soilCheckFeedback, setSoilCheckFeedback] = useState<{ [taskId: string]: string }>({});

  const displayedTasks = filterMode === 'all' ? allTasks : tasks;

  const totalMinutes = displayedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedCount = displayedTasks.filter((t) => t.status === 'completed' || t.completed).length;
  const skippedCount = displayedTasks.filter((t) => t.status === 'skipped').length;
  const allCompleted =
    displayedTasks.length > 0 && completedCount + skippedCount === displayedTasks.length;
  const progressPct =
    displayedTasks.length > 0 ? Math.round((completedCount / displayedTasks.length) * 100) : 0;

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Weather note for summary
  const weatherNote = environmentalAdvice
    ? environmentalAdvice.actionType === 'rain'
      ? '🌧️ Rain expected later today'
      : environmentalAdvice.actionType === 'heat'
      ? '☀️ Warm weather — pots dry faster'
      : environmentalAdvice.actionType === 'wind'
      ? '💨 Breezy conditions today'
      : '🌤️ Moderate pleasant weather'
    : '🌱 Good conditions for growing';

  // Quick Action: I Watered It
  const handleWaterClick = (e: React.MouseEvent, plantId?: string) => {
    e.stopPropagation();
    if (!plantId) return;
    const res = waterPlant(plantId);
    if (res.success) {
      success(res.message);
    } else {
      info(res.message);
    }
  };

  // Quick Action: Soil Check
  const handleSoilConditionSelect = (
    e: React.MouseEvent,
    taskId: string,
    plantId: string,
    condition: 'dry' | 'moist'
  ) => {
    e.stopPropagation();
    checkSoil(plantId, condition);
    if (condition === 'dry') {
      setSoilCheckFeedback((prev) => ({
        ...prev,
        [taskId]: 'Soil feels dry at 1 inch! Water gently at the base.'
      }));
    } else {
      setSoilCheckFeedback((prev) => ({
        ...prev,
        [taskId]: 'Soil is still moist! Wait and let the roots breathe.'
      }));
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* 1. Daily Garden Summary */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid var(--color-primary-border)',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '0.25rem' }}>
              TODAY&apos;S CARE SUMMARY
            </span>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {getGreeting()} 🌱
            </h1>
          </div>

          {/* Browser Notification Button */}
          {notificationStatus !== 'granted' ? (
            <button
              type="button"
              onClick={enableNotifications}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
            >
              <Bell size={13} />
              <span>Enable Garden Reminders</span>
            </button>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: '#1E7E34',
                fontWeight: 600,
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <Bell size={12} />
              <span>Reminders Enabled</span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
          <div>
            <strong>{displayedTasks.length - completedCount - skippedCount}</strong> things to check today
          </div>
          <div>•</div>
          <div>
            <strong>{selectedSpace?.plants.length || 0}</strong> active plants in {selectedSpace?.name || 'garden'}
          </div>
          <div>•</div>
          <div style={{ color: 'var(--color-primary-dark)', fontWeight: 500 }}>{weatherNote}</div>
        </div>
      </div>

      {/* Multi-Space Filter Bar */}
      {spaces.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div role="group" aria-label="Task scope filter" style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              aria-pressed={filterMode === 'all'}
              className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}
            >
              <Layers size={14} />
              <span>All Spaces Aggregated ({allTasks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('selected')}
              aria-pressed={filterMode === 'selected'}
              className={`btn btn-sm ${filterMode === 'selected' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}
            >
              <span>{selectedSpace?.name || 'Active Space'} Only ({tasks.length})</span>
            </button>
          </div>

          <SpaceSelector compact={true} />
        </div>
      )}

      {/* Time & Progress Ribbon */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          backgroundColor: '#FFFFFF',
          marginBottom: '1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimated Routine Time
            </div>
            <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
              ~{totalMinutes || 6} minutes
            </strong>
          </div>
        </div>

        <div style={{ minWidth: 200, flex: 1, maxWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Tasks done:</span>
            <strong>{completedCount} of {displayedTasks.length} ({progressPct}%)</strong>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              backgroundColor: 'var(--color-bg-muted)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                transition: 'width 0.2s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Milestone 16: Severe Weather Alert Banner */}
      {environmentalContext?.snapshot?.severeWeatherAlert && (
        <div
          className="card"
          style={{
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #F87171',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem'
          }}
        >
          <AlertCircle size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <strong style={{ color: '#991B1B', fontSize: '0.95rem' }}>
                {environmentalContext.snapshot.severeWeatherAlert.headline}
              </strong>
              <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.675rem' }}>
                {environmentalContext.snapshot.severeWeatherAlert.severity.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '0 0 0.35rem 0', color: '#7F1D1D', fontSize: '0.85rem', lineHeight: 1.45 }}>
              {environmentalContext.snapshot.severeWeatherAlert.description}
            </p>
            <div style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 500 }}>
              💡 {environmentalContext.snapshot.severeWeatherAlert.instructions}
            </div>
          </div>
        </div>
      )}

      {/* Milestone 16: Weather-Aware Plant Recommendations */}
      {careRecommendations.filter((r) => r.weatherReason || r.isPostponedOrSuppressed || r.weatherAlert).length > 0 && (
        <div
          className="card"
          style={{
            backgroundColor: '#F0F9FF',
            border: '1.5px solid #BAE6FD',
            padding: '1.2rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
            <CloudSun size={18} color="#0284C7" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0369A1' }}>
              Weather-Aware Garden Guidance
            </span>
            <span className="badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: '0.7rem' }}>
              Real-time
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {careRecommendations
              .filter((r) => r.weatherReason || r.isPostponedOrSuppressed || r.weatherAlert)
              .map((rec) => {
                const targetPlant = selectedSpace?.plants?.find(
                  (p) => p.instanceId === rec.targetPlantInstanceId || p.plantId === rec.plantId
                );

                return (
                  <div
                    key={rec.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 0.9rem',
                      border: '1px solid #E0F2FE'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                        {rec.actionTitle}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {targetPlant && (
                          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                            {targetPlant.plant.name}
                          </span>
                        )}
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {rec.spaceExposure === 'indoor' ? '🏠 Indoor' : rec.spaceExposure === 'sheltered' ? '☂️ Sheltered' : '☀️ Exposed'}
                        </span>
                        {rec.isPostponedOrSuppressed && (
                          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.7rem' }}>
                            Postponed
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.825rem', color: '#475569', lineHeight: 1.45 }}>
                      {rec.actionInstructions}
                    </p>
                    <div style={{ fontSize: '0.775rem', color: '#0284C7', fontStyle: 'italic' }}>
                      Reason: {rec.reason}
                    </div>
                    {rec.reevaluateAt && (
                      <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '0.2rem' }}>
                        ⏱️ Re-evaluate: {new Date(rec.reevaluateAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {displayedTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sprout size={32} />
          </div>
          <h3>No tasks generated yet</h3>
          <p>
            Add plants to your growing space to generate your daily 8-minute garden tasks.
          </p>
          <button onClick={() => setActiveTab('plants')} className="btn btn-primary">
            <span>Discover Beginner Plants</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* Daily Task Checkboxes */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
          {displayedTasks.map((task) => {
            const isCompleted = task.status === 'completed' || task.completed;
            const isSkipped = task.status === 'skipped';

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  border: isCompleted
                    ? '1px solid var(--color-border-subtle)'
                    : isSkipped
                    ? '1px dashed var(--color-border-medium)'
                    : '1px solid var(--color-border-medium)',
                  backgroundColor: isCompleted ? '#F8FAF8' : isSkipped ? '#F9F9F9' : '#FFFFFF',
                  opacity: isCompleted ? 0.8 : isSkipped ? 0.6 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Status Toggle Checkbox */}
                  <div
                    onClick={() => toggleTask(task.id)}
                    style={{
                      marginTop: 2,
                      color: isCompleted ? 'var(--color-primary)' : 'var(--color-border-medium)',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>

                  {/* Task Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          margin: 0
                        }}
                      >
                        {task.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {task.spaceName && (
                          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                            📍 {task.spaceName}
                          </span>
                        )}
                        {task.isWeatherDerived && (
                          <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                            <CloudSun size={12} />
                            Weather Check
                          </span>
                        )}
                        {task.plantName && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            {task.plantName.split(' ')[0]}
                          </span>
                        )}
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {task.estimatedMinutes} min
                        </span>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      {task.description}
                    </p>

                    {/* Touch Grass Sensory Prompt */}
                    {task.touchGrassPrompt && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.775rem',
                          color: 'var(--color-primary)',
                          fontStyle: 'italic',
                          marginTop: '0.25rem'
                        }}
                      >
                        <Sparkles size={13} />
                        <span>Touch Grass check: {task.touchGrassPrompt}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestone 3 Direct Care Actions: Water, Check Soil, Skip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid var(--color-border-subtle)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {/* Action 1: Water */}
                    {task.plantId && (
                      <button
                        type="button"
                        onClick={(e) => handleWaterClick(e, task.plantId)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.775rem',
                          padding: '0.3rem 0.65rem',
                          color: '#0284C7',
                          borderColor: '#BAE6FD',
                          backgroundColor: '#F0F9FF'
                        }}
                      >
                        <Droplets size={13} />
                        <span>💧 I Watered It</span>
                      </button>
                    )}

                    {/* Action 2: Check Soil Moisture Guide */}
                    {task.plantId && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSoilCheckTaskId(
                            activeSoilCheckTaskId === task.id ? null : task.id
                          )
                        }
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.775rem',
                          padding: '0.3rem 0.65rem',
                          color: 'var(--color-terracotta)',
                          borderColor: '#FED7AA',
                          backgroundColor: '#FFF7ED'
                        }}
                      >
                        <Fingerprint size={13} />
                        <span>👆 Check Soil</span>
                      </button>
                    )}
                  </div>

                  {/* Task State Actions: Skip / Done */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {!isCompleted && !isSkipped && (
                      <button
                        type="button"
                        onClick={() => setTaskStatus(task.id, 'skipped')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                        title="Skip task for today"
                      >
                        <SkipForward size={12} />
                        <span>Skip today</span>
                      </button>
                    )}
                    {isSkipped && (
                      <button
                        type="button"
                        onClick={() => setTaskStatus(task.id, 'pending')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                      >
                        <span>Unskip</span>
                      </button>
                    )}
                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => setTaskStatus(task.id, 'completed')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                      >
                        <Check size={12} />
                        <span>Mark done</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTaskStatus(task.id, 'pending')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                      >
                        <span>Mark pending</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Soil Check Guide */}
                {activeSoilCheckTaskId === task.id && task.plantId && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-subtle)',
                      marginTop: '0.25rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      👆 1-Inch Finger Test Guide:
                    </div>
                    <p style={{ margin: '0 0 0.65rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Push your finger about an inch into the pot soil. How does it feel?
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleSoilConditionSelect(e, task.id, task.plantId!, 'dry')
                        }
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', backgroundColor: '#FEF3C7', color: '#92400E' }}
                      >
                        Soil feels dry
                      </button>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleSoilConditionSelect(e, task.id, task.plantId!, 'moist')
                        }
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', backgroundColor: '#E0F2FE', color: '#0369A1' }}
                      >
                        Soil still feels moist
                      </button>
                    </div>

                    {soilCheckFeedback[task.id] && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: 'var(--color-primary-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <AlertCircle size={14} color="var(--color-primary)" />
                        <span>{soilCheckFeedback[task.id]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Strong "Touch Grass" Call to Action Card */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          backgroundColor: allCompleted ? '#E6F4EA' : '#FFFFFF',
          border: `2px solid ${allCompleted ? 'var(--color-primary)' : 'var(--color-primary-border)'}`,
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {allCompleted ? (
          <div style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
            <PartyPopper size={36} style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌿</div>
        )}

        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
          {allCompleted
            ? 'All tasks finished for today! 🎉'
            : 'Done checking your plants?'}
        </h2>

        <p
          style={{
            maxWidth: 520,
            margin: '0 auto 1.5rem',
            fontSize: '1rem',
            color: 'var(--color-text-main)'
          }}
        >
          <strong>Now close GardenMitra and go outside. 🌿</strong>
          <br />
          Real gardens grow in real soil, under real sun, not on phone screens.
        </p>

        <button
          onClick={() => setShowTouchGrassModal(true)}
          className="btn btn-terracotta btn-lg"
          style={{ gap: '0.75rem' }}
        >
          <Sun size={20} />
          <span>Close App &amp; Touch Grass 🌿</span>
        </button>
      </div>
    </div>
  );
};
