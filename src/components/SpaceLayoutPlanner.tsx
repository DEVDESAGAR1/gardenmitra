import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { ContainerType, SpaceZoneType } from '../types';
import {
  Compass,
  Plus,
  AlertTriangle,
  Info,
  Trash2,
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';

export const SpaceLayoutPlanner: React.FC = () => {
  const {
    selectedSpace,
    selectedGardenPlants,
    layoutIssues,
    layoutRecommendations,
    addContainer,
    removeContainer,
    placePlant,
    removePlantPlacement,
    addSpaceZone,
    removeSpaceZone,
    autoOptimizeLayout
  } = useGarden();

  // Modals / forms
  const [showAddContainer, setShowAddContainer] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [showAssignPlant, setShowAssignPlant] = useState(false);

  // Form states
  const [containerName, setContainerName] = useState('');
  const [containerType, setContainerType] = useState<ContainerType>('pot');
  const [containerSize, setContainerSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [containerZoneId, setContainerZoneId] = useState('');

  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState<SpaceZoneType>('sunny_area');

  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [placementContainerId, setPlacementContainerId] = useState('');
  const [placementZoneId, setPlacementZoneId] = useState('');

  if (!selectedSpace) return null;

  const layout = selectedSpace.layout || {
    zones: [],
    containers: [],
    plantPlacements: [],
    updatedAt: new Date().toISOString()
  };

  const zones = layout.zones || [];
  const containers = layout.containers || [];
  const placements = layout.plantPlacements || [];

  // Identify unplaced plants in this space
  const placedPlantIds = new Set(placements.map((p) => p.plantId));
  const unplacedPlants = selectedGardenPlants.filter(
    (gp) => !placedPlantIds.has(gp.plantId)
  );

  const handleCreateContainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerName.trim()) return;

    const chosenZone = zones.find((z) => z.id === containerZoneId);
    addContainer(selectedSpace.id, {
      name: containerName.trim(),
      type: containerType,
      size: containerSize,
      zoneId: containerZoneId || undefined,
      sunlightZoneId: chosenZone?.sunlightZoneId,
      maxPlants: containerSize === 'small' ? 1 : containerSize === 'medium' ? 2 : 4,
      isAccessibleForWatering: true
    });

    setContainerName('');
    setShowAddContainer(false);
  };

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    addSpaceZone(selectedSpace.id, {
      name: zoneName.trim(),
      type: zoneType,
      isWalkway: zoneType === 'walkway'
    });

    setZoneName('');
    setShowAddZone(false);
  };

  const handlePlacePlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantId) return;

    const targetPlant = selectedGardenPlants.find((gp) => gp.plantId === selectedPlantId);
    if (!targetPlant) return;

    const chosenContainer = containers.find((c) => c.id === placementContainerId);
    const chosenZone = zones.find((z) => z.id === (placementZoneId || chosenContainer?.zoneId));

    placePlant(selectedSpace.id, {
      plantId: selectedPlantId,
      plantName: targetPlant.plant.name,
      containerId: placementContainerId || undefined,
      zoneId: chosenZone?.id,
      sunlightZoneId: chosenZone?.sunlightZoneId,
      notes: `Placed in ${chosenContainer?.name || chosenZone?.name || 'space'}`
    });

    setSelectedPlantId('');
    setPlacementContainerId('');
    setPlacementZoneId('');
    setShowAssignPlant(false);
  };

  const getSeverityBadge = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return <span className="badge badge-terracotta" style={{ fontSize: '0.7rem' }}>Action Needed</span>;
      case 'warning':
        return <span className="badge badge-neutral" style={{ fontSize: '0.7rem', backgroundColor: '#FEF3C7', color: '#92400E' }}>Advice</span>;
      default:
        return <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Tip</span>;
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.75rem',
        backgroundColor: '#FFFFFF',
        border: '1.5px solid var(--color-primary-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem'
      }}
    >
      {/* 1. Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Compass size={22} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.45rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              Space &amp; Layout Planner
            </h2>
            <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
              {selectedSpace.name}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {selectedSpace.dimensions?.width && selectedSpace.dimensions?.length
              ? `Estimated dimensions: ${selectedSpace.dimensions.width} × ${selectedSpace.dimensions.length} ${selectedSpace.dimensions.unit || 'ft'}`
              : 'Keep a clear 2ft walkway and place full-sun plants along your brightest railing or ledge.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => autoOptimizeLayout(selectedSpace.id)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Auto-organize plants into sunny/shade containers without blocking paths"
          >
            <Sparkles size={14} />
            <span>Smart Auto-Layout</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddContainer(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Plus size={14} />
            <span>+ Add Pot/Container</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddZone(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Plus size={14} />
            <span>+ Add Zone</span>
          </button>
          {unplacedPlants.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAssignPlant(true)}
              className="btn btn-terracotta btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>+ Place Plant ({unplacedPlants.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Layout Issues Alerts (Milestone 6 Requirement 17) */}
      {layoutIssues.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {layoutIssues.map((issue) => (
            <div
              key={issue.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  issue.severity === 'critical'
                    ? '#FEF2F2'
                    : issue.severity === 'warning'
                    ? '#FFFBEB'
                    : '#F0F9FF',
                border: `1.5px solid ${
                  issue.severity === 'critical'
                    ? '#FCA5A5'
                    : issue.severity === 'warning'
                    ? '#FCD34D'
                    : '#BAE6FD'
                }`,
                marginBottom: '0.6rem'
              }}
            >
              <AlertTriangle
                size={18}
                color={
                  issue.severity === 'critical'
                    ? '#DC2626'
                    : issue.severity === 'warning'
                    ? '#D97706'
                    : '#0284C7'
                }
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#1E293B' }}>{issue.message}</strong>
                  {getSeverityBadge(issue.severity)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  <strong>Suggested Action:</strong> {issue.suggestedAction}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Visual Layout Floorplan (Milestone 6 Requirement 21 & 22) */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-base)',
          border: '2px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px dashed var(--color-border-medium)', paddingBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-subtle)' }}>
            🌿 {selectedSpace.name.toUpperCase()} FLOORPLAN &amp; ZONES
          </strong>
        </div>

        {/* Zones and Walkways Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {zones.map((zone) => {
            const isWalkway = zone.type === 'walkway' || zone.isWalkway;
            const isSunny = zone.type === 'sunny_area' || zone.name.toLowerCase().includes('sun');
            const isShaded = zone.type === 'shaded_area' || zone.name.toLowerCase().includes('shade');
            const isRailing = zone.type === 'railing';
            const isWall = zone.type === 'wall';

            // Find containers located in this zone
            const zoneContainers = containers.filter((c) => c.zoneId === zone.id);
            // Find direct plant placements in this zone
            const zonePlacements = placements.filter((p) => p.zoneId === zone.id);

            return (
              <div
                key={zone.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isWalkway ? '#F8FAFC' : isSunny ? '#FEFCE8' : isShaded ? '#F0FDF4' : '#FFFFFF',
                  border: isWalkway
                    ? '2px dashed #94A3B8'
                    : isSunny
                    ? '1.5px solid #FDE047'
                    : isShaded
                    ? '1.5px solid #86EFAC'
                    : '1px solid var(--color-border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Zone Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>
                      {isWalkway ? '🚶' : isSunny ? '☀️' : isShaded ? '🌤️' : isRailing ? '🪟' : isWall ? '🧱' : '🪴'}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
                      {zone.name}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                      ({zone.type.replace(/_/g, ' ')})
                    </span>
                  </div>

                  {/* Remove zone button if user created */}
                  {zones.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeSpaceZone(selectedSpace.id, zone.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0.15rem 0.4rem', color: '#94A3B8' }}
                      title="Delete zone"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {isWalkway ? (
                  <div style={{ textAlign: 'center', padding: '0.4rem', color: '#64748B', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    Unobstructed access lane — keep clear for daily watering &amp; walking safety 🌿
                  </div>
                ) : (
                  <div>
                    {/* Containers & Pots inside this zone */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {zoneContainers.map((container) => {
                        const containerPlacements = placements.filter(
                          (p) => p.containerId === container.id
                        );

                        return (
                          <div
                            key={container.id}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid var(--color-border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.75rem',
                              minWidth: 160,
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>
                                🪴 {container.name}
                              </strong>
                              <button
                                type="button"
                                onClick={() => removeContainer(selectedSpace.id, container.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.1rem 0.3rem', color: '#DC2626' }}
                                title="Remove container"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', marginBottom: '0.45rem' }}>
                              Type: {container.type.replace(/_/g, ' ')} ({container.size})
                            </div>

                            {/* Plants inside container */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {containerPlacements.length === 0 ? (
                                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                                  Empty container
                                </span>
                              ) : (
                                containerPlacements.map((cp) => (
                                  <div
                                    key={cp.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      backgroundColor: 'var(--color-bg-base)',
                                      padding: '0.2rem 0.45rem',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.78rem'
                                    }}
                                  >
                                    <span>🌱 {cp.plantName}</span>
                                    <button
                                      type="button"
                                      onClick={() => removePlantPlacement(selectedSpace.id, cp.id)}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: 0, color: '#94A3B8' }}
                                      title="Unplace plant"
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Direct zone plant placements without container */}
                      {zonePlacements
                        .filter((zp) => !zp.containerId)
                        .map((zp) => (
                          <div
                            key={zp.id}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid var(--color-border-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.5rem 0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.8rem'
                            }}
                          >
                            <span>🌱 <strong>{zp.plantName}</strong></span>
                            <button
                              type="button"
                              onClick={() => removePlantPlacement(selectedSpace.id, zp.id)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: 0, color: '#94A3B8' }}
                              title="Unplace plant"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                      {zoneContainers.length === 0 && zonePlacements.filter((zp) => !zp.containerId).length === 0 && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', fontStyle: 'italic', padding: '0.35rem 0' }}>
                          No pots placed in this area yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Layout Recommendations & Explainability (Milestone 6 Requirement 18 & 25) */}
      {layoutRecommendations.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
            <Sparkles size={17} color="var(--color-primary)" />
            <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
              Why GardenMitra suggests these placements:
            </strong>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '0.85rem'
            }}
          >
            {layoutRecommendations.map((rec) => (
              <div
                key={rec.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                    {rec.headline}
                  </strong>
                  <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                    {rec.recommendedZoneName || 'Recommended'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', margin: '0 0 0.4rem' }}>
                  <strong>Why:</strong> {rec.reason}
                </p>
                {rec.tip && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                    <HelpCircle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{rec.tip}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unplaced Plants Notification */}
      {unplacedPlants.length > 0 && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#FFF7ED',
            border: '1px solid #FFEDD5',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={17} color="var(--color-terracotta)" />
            <span style={{ fontSize: '0.85rem', color: '#9A3412' }}>
              You have <strong>{unplacedPlants.length} plant{unplacedPlants.length === 1 ? '' : 's'}</strong> in {selectedSpace.name} waiting to be placed in pots or zones.
            </span>
          </div>
          <button
            type="button"
            onClick={() => autoOptimizeLayout(selectedSpace.id)}
            className="btn btn-terracotta btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            Auto-Place All Plants
          </button>
        </div>
      )}

      {/* --- MODALS / FORMS --- */}

      {/* Add Container Modal */}
      {showAddContainer && (
        <div className="modal-backdrop" onClick={() => setShowAddContainer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 1rem' }}>+ Add Pot or Container</h3>
            <form onSubmit={handleCreateContainer}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Container Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tomato Terracotta Pot"
                  value={containerName}
                  onChange={(e) => setContainerName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Container Type
                </label>
                <select
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value as any)}
                  className="input-field"
                >
                  <option value="pot">Potted Planter (Standard)</option>
                  <option value="grow_bag">Breathable Grow Bag</option>
                  <option value="planter_box">Rectangular Trough / Box</option>
                  <option value="hanging_planter">Hanging Planter</option>
                  <option value="vertical_planter">Vertical Wall Planter</option>
                </select>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Size &amp; Capacity
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['small', 'medium', 'large'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setContainerSize(sz)}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        textTransform: 'capitalize',
                        backgroundColor: containerSize === sz ? 'var(--color-primary)' : 'var(--color-bg-base)',
                        color: containerSize === sz ? '#FFFFFF' : 'var(--color-text-main)'
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Place in Zone (Optional)
                </label>
                <select
                  value={containerZoneId}
                  onChange={(e) => setContainerZoneId(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- No specific zone yet --</option>
                  {zones
                    .filter((z) => !z.isWalkway && z.type !== 'walkway')
                    .map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.type.replace(/_/g, ' ')})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddContainer(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}
      {showAddZone && (
        <div className="modal-backdrop" onClick={() => setShowAddZone(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 1rem' }}>+ Add Space Zone</h3>
            <form onSubmit={handleCreateZone}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Zone Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. South Railing, Wall Shelf"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Zone Type
                </label>
                <select
                  value={zoneType}
                  onChange={(e) => setZoneType(e.target.value as any)}
                  className="input-field"
                >
                  <option value="sunny_area">☀️ Sunny Area (Direct light)</option>
                  <option value="shaded_area">🌤️ Shaded / Filtered Light Area</option>
                  <option value="walkway">🚶 Walkway (Keep clear for walking)</option>
                  <option value="railing">🪟 Railing (Hanging space)</option>
                  <option value="wall">🧱 Wall (Vertical mounting)</option>
                  <option value="doorway_access">🚪 Doorway Access Point</option>
                  <option value="water_access">🚰 Water Source / Tap Area</option>
                  <option value="furniture_obstacle">🪑 Furniture / Obstacle</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddZone(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Plant Modal */}
      {showAssignPlant && (
        <div className="modal-backdrop" onClick={() => setShowAssignPlant(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 1rem' }}>Assign Plant to Layout</h3>
            <form onSubmit={handlePlacePlant}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Select Plant
                </label>
                <select
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose plant --</option>
                  {unplacedPlants.map((gp) => (
                    <option key={gp.plantId} value={gp.plantId}>
                      {gp.plant.name} ({gp.plant.sunlightText})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Assign to Container
                </label>
                <select
                  value={placementContainerId}
                  onChange={(e) => setPlacementContainerId(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Direct Zone Placement (No container) --</option>
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Zone
                </label>
                <select
                  value={placementZoneId}
                  onChange={(e) => setPlacementZoneId(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Auto-infer from container --</option>
                  {zones
                    .filter((z) => !z.isWalkway)
                    .map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.type.replace(/_/g, ' ')})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignPlant(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!selectedPlantId}>
                  Confirm Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
