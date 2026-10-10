import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { PhotoUploader } from './PhotoUploader';
import { WeatherWidget } from './WeatherWidget';
import { SpaceSelector } from './SpaceSelector';
import { SunlightIntelligenceCard } from './SunlightIntelligenceCard';
import { SpaceLayoutPlanner } from './SpaceLayoutPlanner';
import { careEngine } from '../services/careEngine';
import {
  MapPin,
  Home,
  Sun,
  Sprout,
  Plus,
  ShoppingBag,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Settings2,
  Trash2,
  Layers,
  Edit2,
  Droplets,
  Fingerprint,
  History,
  ChevronDown,
  ChevronUp,
  Compass,
  Film
} from 'lucide-react';
import { GardenCaptureStudio } from './GardenCaptureStudio';
import { AdaptiveScanGuidanceCard } from './AdaptiveScanGuidanceCard';

export const MyGardenDashboard: React.FC = () => {
  const {
    garden,
    spaces,
    selectedSpace,
    selectedSpaceId,
    selectSpace,
    openCreateSpaceModal,
    openEditSpaceModal,
    selectedGardenPlants,
    removePlantFromGarden,
    tasks,
    allTasks,
    shoppingList,
    setActiveTab,
    setSelectedPlantForDetail,
    waterPlant,
    checkSoil,
    environmentalContext
  } = useGarden();

  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const [activeSoilPromptId, setActiveSoilPromptId] = useState<string | null>(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  const totalPlantsCount = spaces.reduce((sum, s) => sum + s.plants.length, 0);
  const completedTasks = tasks.filter((t) => t.completed).length;
  const purchasedItems = shoppingList.filter((s) => s.checked).length;

  if (!garden || spaces.length === 0) {
    return (
      <div className="empty-state" style={{ maxWidth: 640, margin: '2rem auto' }}>
        <div className="empty-state-icon">
          <Sprout size={36} />
        </div>
        <h2>Let&apos;s set up your garden space</h2>
        <p>
          You haven&apos;t created your beginner garden profile yet. It takes less than 60 seconds to tell us where you live and what sunlight you have.
        </p>
        <button onClick={() => setActiveTab('setup')} className="btn btn-primary btn-lg">
          <span>Start Garden Setup</span>
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* 1. Overall Garden Summary Banner (Milestone 1) */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid var(--color-primary-border)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-green">GARDEN OVERVIEW</span>
              <span className="badge badge-neutral">{garden.experience.replace(/_/g, ' ')}</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {garden.name} 🌱
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('setup')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Settings2 size={14} />
              <span>Edit Location</span>
            </button>
            <button
              onClick={openCreateSpaceModal}
              className="btn btn-terracotta btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={14} />
              <span>+ Add Space</span>
            </button>
          </div>
        </div>

        {/* Garden-level Stats Ribbon */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div className="badge badge-neutral" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
            <MapPin size={15} color="var(--color-primary)" />
            <span>{garden.location.city}, {garden.location.state || garden.location.country}</span>
          </div>

          <div className="badge badge-green" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
            <Layers size={15} />
            <span>{spaces.length} {spaces.length === 1 ? 'Space' : 'Spaces'}</span>
          </div>

          <div className="badge badge-neutral" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
            <Sprout size={15} color="var(--color-primary)" />
            <span>{totalPlantsCount} {totalPlantsCount === 1 ? 'Plant' : 'Plants'} Total</span>
          </div>

          <div className="badge badge-neutral" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
            <CheckCircle2 size={15} color="var(--color-primary)" />
            <span>{allTasks.length} Daily Tasks</span>
          </div>
        </div>
      </div>

      {/* 2. All Spaces Cards Row (Milestone 1) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', margin: 0 }}>
            Your Growing Spaces ({spaces.length})
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
            Tap a space to view its isolated plants &amp; care
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.85rem'
          }}
        >
          {spaces.map((space) => {
            const isSelected = space.id === selectedSpaceId;
            const spaceTasks = allTasks.filter((t) => t.spaceId === space.id);

            return (
              <div
                key={space.id}
                onClick={() => selectSpace(space.id)}
                className="card card-interactive"
                style={{
                  padding: '1rem 1.15rem',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                  backgroundColor: isSelected ? '#FAFCFA' : '#FFFFFF',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-text-subtle)'
                    }}
                  >
                    {space.type}
                  </span>
                  {isSelected && (
                    <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      Active
                    </span>
                  )}
                </div>

                <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.4rem' }}>
                  {space.name}
                </strong>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>🌱 {space.plants.length} {space.plants.length === 1 ? 'plant' : 'plants'}</span>
                  <span>•</span>
                  <span>✓ {spaceTasks.length} {spaceTasks.length === 1 ? 'task' : 'tasks'}</span>
                </div>
              </div>
            );
          })}

          {/* Add Space Quick Tile */}
          <button
            type="button"
            onClick={openCreateSpaceModal}
            className="card card-interactive"
            style={{
              padding: '1rem',
              border: '2px dashed var(--color-primary-border)',
              backgroundColor: 'var(--color-bg-base)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              minHeight: 90,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
              <Plus size={16} />
              <span>Add Another Space</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
              Balcony, Window, Terrace...
            </span>
          </button>
        </div>
      </div>

      {/* 3. Environmental Intelligence Conditions Card (Milestone 2) */}
      <WeatherWidget />

      {/* 4. Active Space Toolbar */}
      <SpaceSelector />

      {/* 5. Milestone 9 Adaptive Space Scanning & Usable Space Card */}
      {selectedSpace && (
        <div style={{ marginBottom: '1.5rem' }}>
          <AdaptiveScanGuidanceCard />
        </div>
      )}

      {/* 6. Selected Space Detail & Photo Grid */}
      {selectedSpace && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* Space Photo & Vision Box + Sunlight Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <PhotoUploader />
            <SunlightIntelligenceCard />
          </div>

          {/* Space Quick Actions Center */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Space Attributes Details */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                  Space Profile: {selectedSpace.name}
                </strong>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCaptureModal(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  >
                    <Film size={12} color="var(--color-primary)" /> Capture Studio (M8)
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditSpaceModal(selectedSpace)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.8rem' }}>
                <span className="badge badge-neutral">
                  <Sun size={12} color="var(--color-sun-gold)" />
                  {selectedSpace.sunlight.replace(/_/g, ' ')}
                </span>
                <span className="badge badge-neutral">
                  <Home size={12} />
                  {selectedSpace.size.replace(/_/g, ' ')} size
                  {selectedSpace.dimensions?.width && ` (${selectedSpace.dimensions.width}×${selectedSpace.dimensions.length} ${selectedSpace.dimensions.unit})`}
                </span>
                <span className="badge badge-green">
                  Goal: {selectedSpace.goal.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Today's Tasks for this Space */}
            <div
              className="card card-interactive"
              onClick={() => setActiveTab('today')}
              style={{ padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} color="var(--color-primary)" />
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                    Today&apos;s Tasks ({selectedSpace.name})
                  </strong>
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                  {completedTasks}/{tasks.length} done
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
                Check moisture, inspect leaves, and step outside.
              </p>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Open Today&apos;s Tasks <ArrowRight size={14} />
              </span>
            </div>

            {/* Shopping List for this Space */}
            <div
              className="card card-interactive"
              onClick={() => setActiveTab('shopping')}
              style={{ padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag size={20} color="var(--color-terracotta)" />
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-terracotta)' }}>
                    Shopping ({selectedSpace.name})
                  </strong>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                  {purchasedItems}/{shoppingList.length} items
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
                Containers, soil, and seeds needed for {selectedSpace.name}.
              </p>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-terracotta)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                View Shopping List <ArrowRight size={14} />
              </span>
            </div>

            {/* Space Layout Planner Shortcut */}
            <div
              className="card card-interactive"
              onClick={() => {
                const el = document.getElementById('space-layout-planner-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setActiveTab('layout');
              }}
              style={{ padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={20} color="var(--color-primary)" />
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                    Space &amp; Layout Planner
                  </strong>
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                  {selectedSpace.layout?.containers.length || 0} containers
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
                Organize sunny spots, preserve clear walkways, and optimize container placement.
              </p>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Plan Space Layout <ArrowRight size={14} />
              </span>
            </div>

            {/* Ask GardenMitra Shortcut */}
            <div
              className="card card-interactive"
              onClick={() => setActiveTab('chat')}
              style={{ padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <MessageSquare size={20} color="var(--color-primary-dark)" />
                <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                  Ask Mitra About {selectedSpace.name}
                </strong>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
                Context-aware answers tailored specifically to {selectedSpace.name}.
              </p>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Ask Assistant <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Active Plants in Selected Space (Milestone 1 Isolation) */}
      {selectedSpace && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                Plants in {selectedSpace.name} ({selectedGardenPlants.length})
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Isolated to this space. Plants added here do not leak into your other spaces.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('plants')}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              <span>Add Plants to {selectedSpace.name}</span>
            </button>
          </div>

          {selectedGardenPlants.length === 0 ? (
            <div
              className="empty-state"
              style={{ padding: '2.5rem 1.5rem', border: '1px dashed var(--color-border-medium)' }}
            >
              <Sprout size={32} color="var(--color-text-subtle)" style={{ marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '1.15rem' }}>No plants in {selectedSpace.name} yet</h3>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 1.25rem' }}>
                Explore plant recommendations matched to {selectedSpace.name}&apos;s sunlight and container constraints.
              </p>
              <button
                onClick={() => setActiveTab('plants')}
                className="btn btn-primary"
              >
                <span>Discover Recommendations for {selectedSpace.name}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {selectedGardenPlants.map((gardenPlant) => {
                const { plant, lastWateredAt, wateringCount = 0, careHistory = [] } = gardenPlant;
                const decision = careEngine.evaluateCareDecision(gardenPlant, selectedSpace, environmentalContext);
                const isTimelineOpen = expandedTimelineId === plant.id;
                const isSoilPromptOpen = activeSoilPromptId === plant.id;

                const lastWateredText = lastWateredAt
                  ? new Date(lastWateredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : 'Not logged yet';

                return (
                  <div
                    key={plant.id}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--color-border-subtle)',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                          {plant.category.toUpperCase()}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          In {selectedSpace.name}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedPlantForDetail(plant)}
                        style={{
                          fontSize: '1.2rem',
                          color: 'var(--color-primary-dark)',
                          marginBottom: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        {plant.name}
                      </h3>

                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem' }}>
                        {plant.shortDescription}
                      </p>

                      {/* Milestone 3 Care Status Indicators */}
                      <div
                        style={{
                          backgroundColor: 'var(--color-bg-base)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem',
                          marginBottom: '0.75rem',
                          fontSize: '0.78rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-subtle)' }}>Last watered:</span>
                          <strong style={{ color: 'var(--color-text-main)' }}>{lastWateredText}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-subtle)' }}>Total waterings:</span>
                          <strong>💧 {wateringCount}</strong>
                        </div>
                        <div style={{ marginTop: '0.2rem', color: 'var(--color-primary-dark)', fontWeight: 500 }}>
                          🌱 {decision.headline}
                        </div>
                      </div>

                      {/* Quick Care Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const res = waterPlant(plant.id);
                            alert(res.message);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{
                            flex: 1,
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.5rem',
                            color: '#0284C7',
                            backgroundColor: '#F0F9FF',
                            borderColor: '#BAE6FD'
                          }}
                        >
                          <Droplets size={13} />
                          <span>💧 Water</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSoilPromptId(isSoilPromptOpen ? null : plant.id)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            flex: 1,
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.5rem',
                            color: 'var(--color-terracotta)',
                            backgroundColor: '#FFF7ED',
                            borderColor: '#FED7AA'
                          }}
                        >
                          <Fingerprint size={13} />
                          <span>👆 Check Soil</span>
                        </button>
                      </div>

                      {/* Soil Check Quick Guide Prompt */}
                      {isSoilPromptOpen && (
                        <div
                          style={{
                            backgroundColor: '#FFFDF0',
                            border: '1px solid #FEF3C7',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.65rem',
                            marginBottom: '0.75rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '0.25rem' }}>
                            1-Inch Finger Test
                          </div>
                          <p style={{ margin: '0 0 0.4rem', color: '#92400E' }}>
                            Push your index finger 1 inch into soil. How does it feel?
                          </p>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                checkSoil(plant.id, 'dry');
                                setActiveSoilPromptId(null);
                                alert(`Recorded: Soil was dry. Water ${plant.name} slowly at the base!`);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem', backgroundColor: '#FEF3C7' }}
                            >
                              Dry
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                checkSoil(plant.id, 'moist');
                                setActiveSoilPromptId(null);
                                alert(`Recorded: Soil still moist. Wait before watering!`);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem', backgroundColor: '#E0F2FE' }}
                            >
                              Moist
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Plant Care Timeline Collapsible */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setExpandedTimelineId(isTimelineOpen ? null : plant.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          <History size={12} />
                          <span>Care Timeline ({careHistory.length})</span>
                          {isTimelineOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {isTimelineOpen && (
                          <div
                            style={{
                              marginTop: '0.4rem',
                              padding: '0.5rem',
                              backgroundColor: 'var(--color-bg-base)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.72rem',
                              maxHeight: 120,
                              overflowY: 'auto'
                            }}
                          >
                            <div style={{ marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>
                              🌱 Added — {new Date(gardenPlant.addedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                            {careHistory.length === 0 ? (
                              <div style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                                No care events logged yet.
                              </div>
                            ) : (
                              [...careHistory]
                                .reverse()
                                .map((evt) => {
                                  const dateStr = new Date(evt.timestamp).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric'
                                  });
                                  const timeStr = new Date(evt.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });

                                  let icon = '📝';
                                  if (evt.type === 'watered') icon = '💧';
                                  if (evt.type === 'soil_checked') icon = '👆';
                                  if (evt.type === 'inspected') icon = '🌿';

                                  return (
                                    <div key={evt.id} style={{ marginBottom: '0.2rem' }}>
                                      {icon} <strong>{evt.type.replace(/_/g, ' ')}</strong> — {dateStr} {timeStr}
                                      {evt.soilCondition && ` (${evt.soilCondition})`}
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--color-border-subtle)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPlantForDetail(plant)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Care Details
                      </button>

                      <button
                        type="button"
                        onClick={() => removePlantFromGarden(plant.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#C53030' }}
                        title={`Remove from ${selectedSpace.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. Space & Layout Optimization Planner (Milestone 6) */}
      {selectedSpace && (
        <div id="space-layout-planner-section" style={{ marginTop: '2.5rem' }}>
          <SpaceLayoutPlanner />
        </div>
      )}

      {/* 8. Garden Capture Studio Modal (Milestone 8) */}
      {showCaptureModal && selectedSpace && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div style={{ maxWidth: '840px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <GardenCaptureStudio onClose={() => setShowCaptureModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
