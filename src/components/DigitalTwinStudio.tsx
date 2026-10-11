import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import {
  DigitalTwinProposalMode,
  ContainerType,
  DigitalTwinProposal
} from '../types';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Eye,
  Info,
  ArrowLeftRight,
  Check
} from 'lucide-react';

export const DigitalTwinStudio: React.FC = () => {
  const {
    selectedSpace,
    digitalTwin,
    generateDigitalTwinProposal,
    acceptDigitalTwinProposal,
    discardDigitalTwinProposal,
    getVisualConceptOutput,
    addContainer,
    removeContainer,
    setActiveTab
  } = useGarden();

  // Active proposal in view (defaults to twin's active proposal or the first proposal generated)
  const [viewingProposal, setViewingProposal] = useState<DigitalTwinProposal | null>(
    digitalTwin?.activeProposal || null
  );

  // Toggle between 2D Layout Canvas and Visual Concept Render
  const [activeViewMode, setActiveViewMode] = useState<'interactive_2d' | 'visual_concept' | 'before_after'>('interactive_2d');

  // Quick editor state
  const [showAddContainer, setShowAddContainer] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerType, setNewContainerType] = useState<ContainerType>('pot');
  const [newContainerSize, setNewContainerSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedZoneId, setSelectedZoneId] = useState('');

  // Selected container for accessible zone moving
  const [movingContainerId, setMovingContainerId] = useState<string | null>(null);

  // Success message after accepting
  const [acceptanceNotice, setAcceptanceNotice] = useState<string | null>(null);

  if (!selectedSpace) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Layers size={40} color="#94A3B8" />
        <h3 style={{ marginTop: '1rem', color: '#334155' }}>No Garden Space Selected</h3>
        <p style={{ color: '#64748B' }}>Please select or create a space from your dashboard first.</p>
        <button onClick={() => setActiveTab('my_garden')} className="btn btn-primary btn-sm">
          Return to My Garden
        </button>
      </div>
    );
  }

  const twin = digitalTwin;
  const currentLayout = selectedSpace.layout || twin?.layout || {
    zones: [],
    containers: [],
    plantPlacements: [],
    updatedAt: new Date().toISOString()
  };

  // Determine which layout to render in the interactive view
  const displayLayout = viewingProposal ? viewingProposal.layout : currentLayout;

  const handleGenerateProposal = (mode: DigitalTwinProposalMode) => {
    const proposal = generateDigitalTwinProposal(selectedSpace.id, mode);
    setViewingProposal(proposal);
    setActiveViewMode('before_after');
    setAcceptanceNotice(null);
  };

  const handleAcceptProposal = () => {
    if (!viewingProposal) return;
    acceptDigitalTwinProposal(selectedSpace.id, viewingProposal.id);
    setAcceptanceNotice(`Layout plan "${viewingProposal.title}" has been saved as your active garden plan! 🌱`);
    setViewingProposal(null);
    setActiveViewMode('interactive_2d');
  };

  const handleDiscardProposal = () => {
    if (!viewingProposal) return;
    discardDigitalTwinProposal(selectedSpace.id, viewingProposal.id);
    setViewingProposal(null);
    setActiveViewMode('interactive_2d');
  };

  const handleCreateContainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContainerName.trim()) return;

    const chosenZone = displayLayout.zones.find((z) => z.id === selectedZoneId);
    addContainer(selectedSpace.id, {
      name: newContainerName.trim(),
      type: newContainerType,
      size: newContainerSize,
      zoneId: selectedZoneId || undefined,
      sunlightZoneId: chosenZone?.sunlightZoneId,
      maxPlants: newContainerSize === 'small' ? 1 : newContainerSize === 'medium' ? 2 : 4,
      isAccessibleForWatering: true
    });

    setNewContainerName('');
    setShowAddContainer(false);
  };

  const handleMoveContainerToZone = (containerId: string, targetZoneId: string) => {
    // Accessible fallback to moving containers between zones
    const container = displayLayout.containers.find((c) => c.id === containerId);
    if (!container) return;

    // Remove existing container and re-add in new zone
    removeContainer(selectedSpace.id, containerId);
    addContainer(selectedSpace.id, {
      ...container,
      zoneId: targetZoneId
    });
    setMovingContainerId(null);
  };

  // Concept Visualizer package
  const visualConcept = viewingProposal
    ? getVisualConceptOutput(selectedSpace.id, viewingProposal)
    : null;

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Top Banner */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-green">GARDEN DIGITAL TWIN</span>
              <span className="badge badge-neutral">v{twin?.version || 1} Persistent Model</span>
              {viewingProposal ? (
                <span className="badge badge-terracotta">PROPOSAL PREVIEW (Unsaved)</span>
              ) : (
                <span className="badge badge-green">ACTIVE GARDEN PLAN</span>
              )}
            </div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {selectedSpace.name} — Digital Twin & Visualizer 🏛️
            </h1>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Accurate 2D spatial representation connecting capture evidence, lighting zones, and container arrangements.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('layout')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.82rem' }}
            >
              Classic Layout
            </button>
            <button
              onClick={() => setActiveTab('my_garden')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.82rem' }}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '1.25rem',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1rem'
          }}
        >
          <button
            onClick={() => setActiveViewMode('interactive_2d')}
            className={`btn btn-sm ${activeViewMode === 'interactive_2d' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem' }}
          >
            2D Interactive Canvas
          </button>

          {viewingProposal && (
            <button
              onClick={() => setActiveViewMode('before_after')}
              className={`btn btn-sm ${activeViewMode === 'before_after' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeftRight size={13} />
              <span>Before & After Comparison</span>
            </button>
          )}

          {viewingProposal && (
            <button
              onClick={() => setActiveViewMode('visual_concept')}
              className={`btn btn-sm ${activeViewMode === 'visual_concept' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Eye size={13} />
              <span>Conceptual Visualizer</span>
            </button>
          )}
        </div>
      </div>

      {/* Acceptance Notification Banner */}
      {acceptanceNotice && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#166534', fontSize: '0.9rem' }}>
            <CheckCircle2 size={18} color="#166534" />
            <span>{acceptanceNotice}</span>
          </div>
          <button
            onClick={() => setAcceptanceNotice(null)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Proposal Generator Ribbon */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          backgroundColor: '#FAF5FF',
          border: '1.5px solid #E9D5FF',
          borderRadius: '12px',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles size={18} color="#7E22CE" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#581C87' }}>
            Smart Layout Generator (4 Explainable Modes)
          </h3>
        </div>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#6B21A8' }}>
          Select a gardening objective to generate a safe, zone-aligned proposal without modifying your actual garden until you confirm.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
          {[
            {
              id: 'beginner_friendly' as DigitalTwinProposalMode,
              title: 'Beginner-Friendly',
              desc: 'Easy reach, organized by soil moisture checks'
            },
            {
              id: 'space_efficient' as DigitalTwinProposalMode,
              title: 'Space-Efficient',
              desc: 'Perimeter alignment, 100% open walking lane'
            },
            {
              id: 'max_edibles' as DigitalTwinProposalMode,
              title: 'Max Edibles',
              desc: 'Fruiting vegetables into direct sunlight zones'
            },
            {
              id: 'low_maintenance' as DigitalTwinProposalMode,
              title: 'Low-Maintenance',
              desc: 'Moisture-holding tubs grouped near drains'
            }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleGenerateProposal(mode.id)}
              className={`btn btn-sm ${
                viewingProposal?.mode === mode.id ? 'btn-primary' : 'btn-secondary'
              }`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '0.65rem 0.85rem',
                height: 'auto'
              }}
            >
              <strong style={{ fontSize: '0.85rem' }}>{mode.title}</strong>
              <span style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '0.2rem' }}>
                {mode.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Proposal Action Header Bar (when previewing a proposal) */}
      {viewingProposal && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-terracotta" style={{ fontSize: '0.75rem' }}>
                PROPOSAL ACTIVE: {viewingProposal.title}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#78350F' }}>
              {viewingProposal.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleAcceptProposal}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            >
              <Check size={14} />
              <span>Accept & Save Plan</span>
            </button>

            <button
              onClick={handleDiscardProposal}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            >
              <X size={14} />
              <span>Discard Proposal</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      {activeViewMode === 'interactive_2d' && (
        <div>
          {/* Spatial Uncertainty Legend */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.65rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.78rem',
              color: '#475569'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>Visual Uncertainty Key:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 14, height: 2, backgroundColor: '#0F172A', display: 'inline-block' }} />
                <span>Solid: Measured Boundary</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 14, height: 2, borderTop: '2px dashed #94A3B8', display: 'inline-block' }} />
                <span>Dashed: Planning Assumption</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 12, height: 12, backgroundColor: 'rgba(203, 213, 225, 0.45)', border: '1px dashed #94A3B8', display: 'inline-block' }} />
                <span>Clear Walkway</span>
              </span>
            </div>

            <button
              onClick={() => setShowAddContainer(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Plus size={12} />
              <span>+ Add Container</span>
            </button>
          </div>

          {/* 2D Canvas Container */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid var(--color-primary-border)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                width: '100%',
                minHeight: 380,
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: '2px dashed #94A3B8',
                padding: '1rem',
                position: 'relative'
              }}
            >
              {/* Scale / Dimension Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#64748B' }}>
                <span><strong>Boundary:</strong> {displayLayout.width || '8'}ft width × {displayLayout.depth || '5'}ft depth</span>
                <span><strong>Walkway Assumption:</strong> 2.0 ft clear path down center</span>
              </div>

              {/* Zones Canvas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {displayLayout.zones.map((zone) => {
                  const isSunny = zone.type === 'sunny_area' || zone.name.toLowerCase().includes('sun');
                  const isWalkway = zone.type === 'walkway' || zone.isWalkway;
                  const zoneContainers = displayLayout.containers.filter((c) => c.zoneId === zone.id);

                  return (
                    <div
                      key={zone.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: isWalkway
                          ? 'rgba(203, 213, 225, 0.35)'
                          : isSunny
                          ? 'rgba(254, 240, 138, 0.35)'
                          : 'rgba(187, 247, 208, 0.35)',
                        border: isWalkway
                          ? '2px dashed #94A3B8'
                          : isSunny
                          ? '1.5px solid #EAB308'
                          : '1.5px solid #22C55E'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#1E293B' }}>{zone.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>
                            {isWalkway ? '(Protected Walking Corridor)' : isSunny ? '(Direct Sunlight Zone)' : '(Gentle Filtered Shade)'}
                          </span>
                        </div>

                        {/* Accessible Move to Zone target button */}
                        {movingContainerId && !isWalkway && (
                          <button
                            onClick={() => handleMoveContainerToZone(movingContainerId, zone.id)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                          >
                            Place Container Here
                          </button>
                        )}
                      </div>

                      {/* Containers inside this zone */}
                      {zoneContainers.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                          {zoneContainers.map((c) => (
                            <div
                              key={c.id}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '0.5rem 0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                              }}
                            >
                              <div
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  backgroundColor: c.type === 'grow_bag' ? '#15803D' : c.type === 'vertical_planter' ? '#2563EB' : '#C2410C'
                                }}
                              />
                              <div>
                                <strong style={{ fontSize: '0.8rem', color: '#0F172A', display: 'block' }}>{c.name}</strong>
                                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                                  {c.type.replace(/_/g, ' ')} • {c.size}
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                                <button
                                  onClick={() => setMovingContainerId(c.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.15rem 0.35rem', fontSize: '0.68rem' }}
                                  title="Move to another zone"
                                >
                                  Move
                                </button>
                                <button
                                  onClick={() => removeContainer(selectedSpace.id, c.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.15rem 0.35rem', fontSize: '0.68rem', color: '#DC2626' }}
                                  title="Remove container"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                          {isWalkway ? 'Completely clear for watering and walking access' : 'No containers assigned to this zone yet'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Add Container Form Modal */}
          {showAddContainer && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem'
              }}
            >
              <form
                onSubmit={handleCreateContainer}
                className="card"
                style={{
                  maxWidth: 420,
                  width: '100%',
                  padding: '1.5rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A' }}>Add Container to Digital Twin</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddContainer(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label htmlFor="dt-container-name" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Container Name</label>
                  <input
                    id="dt-container-name"
                    type="text"
                    className="input input-sm"
                    value={newContainerName}
                    onChange={(e) => setNewContainerName(e.target.value)}
                    placeholder="e.g. Railing Basil Pot"
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label htmlFor="dt-container-type" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Type</label>
                    <select
                      id="dt-container-type"
                      className="input input-sm"
                      value={newContainerType}
                      onChange={(e) => setNewContainerType(e.target.value as any)}
                      style={{ width: '100%' }}
                    >
                      <option value="pot">Pot</option>
                      <option value="grow_bag">Grow Bag</option>
                      <option value="planter_box">Planter Box</option>
                      <option value="vertical_planter">Vertical Trellis</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Size</label>
                    <select
                      className="input input-sm"
                      value={newContainerSize}
                      onChange={(e) => setNewContainerSize(e.target.value as any)}
                      style={{ width: '100%' }}
                    >
                      <option value="small">Small (6-8 in)</option>
                      <option value="medium">Medium (10-12 in)</option>
                      <option value="large">Large (14+ in)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Target Zone</label>
                  <select
                    className="input input-sm"
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select a zone...</option>
                    {displayLayout.zones
                      .filter((z) => !z.isWalkway)
                      .map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddContainer(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Add Container
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Before & After Comparison View */}
      {activeViewMode === 'before_after' && viewingProposal && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid var(--color-primary-border)',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ArrowLeftRight size={20} color="var(--color-primary-dark)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>
              Before & After Comparison
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Current State */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem' }}>
              <span className="badge badge-neutral" style={{ marginBottom: '0.5rem' }}>
                CURRENT ARRANGEMENT
              </span>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0F172A' }}>
                Existing Layout Plan
              </h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                <li>Containers: {currentLayout.containers.length}</li>
                <li>Plant placements: {currentLayout.plantPlacements.length}</li>
                <li>Zones configured: {currentLayout.zones.length}</li>
              </ul>
            </div>

            {/* Proposed State */}
            <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '8px', padding: '1rem' }}>
              <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>
                PROPOSED ARRANGEMENT ({viewingProposal.mode.replace(/_/g, ' ')})
              </span>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#166534' }}>
                {viewingProposal.title}
              </h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: '#166534' }}>
                <li>New planned placements: {viewingProposal.newPlacementsCount}</li>
                <li>Containers utilized: {viewingProposal.layout.containers.length}</li>
                <li>Usable planting area: {viewingProposal.usablePlantingAreaSqFt} sq ft</li>
              </ul>
            </div>
          </div>

          {/* Proposal Explanations */}
          <div style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
            <strong style={{ fontSize: '0.88rem', color: '#581C87', display: 'block', marginBottom: '0.4rem' }}>
              Why Mitra Chose This Layout:
            </strong>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: '#6B21A8' }}>
              {viewingProposal.explanations.map((exp, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{exp}</li>
              ))}
            </ul>
          </div>

          {/* Plan Validation Warnings */}
          {viewingProposal.warnings.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#991B1B', display: 'block', marginBottom: '0.35rem' }}>
                Plan Validation Notes:
              </strong>
              {viewingProposal.warnings.map((w) => (
                <div
                  key={w.id}
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    marginBottom: '0.35rem',
                    fontSize: '0.8rem',
                    color: '#991B1B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleAcceptProposal} className="btn btn-primary btn-sm" style={{ fontSize: '0.85rem' }}>
              Accept Proposal & Apply to Garden
            </button>
            <button onClick={() => setActiveViewMode('interactive_2d')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.85rem' }}>
              Inspect in 2D Canvas
            </button>
            <button onClick={handleDiscardProposal} className="btn btn-secondary btn-sm" style={{ fontSize: '0.85rem' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Conceptual Visualizer View */}
      {activeViewMode === 'visual_concept' && visualConcept && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid var(--color-primary-border)',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Eye size={20} color="var(--color-primary-dark)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>
              Conceptual Architectural Preview
            </h3>
          </div>

          <div
            style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '6px',
              padding: '0.6rem 0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: '#92400E'
            }}
          >
            <Info size={15} style={{ flexShrink: 0 }} />
            <span><strong>Disclaimer:</strong> {visualConcept.disclaimer}</span>
          </div>

          {/* SVG Render Display */}
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              margin: '0 auto 1.5rem auto',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid #E2E8F0'
            }}
          >
            <img
              src={visualConcept.svgDataUrl}
              alt="Conceptual Garden Layout Preview"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* Prompt details */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
            <strong style={{ fontSize: '0.82rem', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
              Conceptual Scene Description:
            </strong>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', whiteSpace: 'pre-line' }}>
              {visualConcept.illustrativePrompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
