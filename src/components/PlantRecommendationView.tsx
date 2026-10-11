import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import { PlantCategory } from '../types';
import { PLANT_CATALOG } from '../data/plants';
import {
  Sparkles,
  Sun,
  Check,
  Plus,
  AlertTriangle,
  Info,
  Search,
  BookOpen,
  Compass
} from 'lucide-react';

export const PlantRecommendationView: React.FC = () => {
  const {
    recommendations,
    addPlantToGarden,
    removePlantFromGarden,
    isPlantInGarden,
    setSelectedPlantForDetail,
    spaces,
    selectedSpace
  } = useGarden();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlantCategory | 'all'>('all');
  const [edibleOnly, setEdibleOnly] = useState(false);
  const [petSafeOnly, setPetSafeOnly] = useState(false);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [activeMode, setActiveMode] = useState<'recommendations' | 'all_library'>('recommendations');
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);

  const categories: { id: PlantCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Plants' },
    { id: 'herbs', label: 'Herbs & Aromatics' },
    { id: 'vegetables', label: 'Vegetables' },
    { id: 'flowers', label: 'Flowering & Pollinators' },
    { id: 'fruits', label: 'Container Fruits' },
    { id: 'indoor', label: 'Indoor Foliage' },
    { id: 'succulents', label: 'Succulents' }
  ];

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    return recommendations.filter((rec) => {
      const p = rec.plant;
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesHindi = p.hindiName?.toLowerCase().includes(q);
        const matchesSci = p.scientificName?.toLowerCase().includes(q);
        const matchesDesc = p.shortDescription.toLowerCase().includes(q);
        let matchesRegional = false;
        if (p.regionalNames) {
          for (const names of Object.values(p.regionalNames)) {
            if (names.some((n) => n.toLowerCase().includes(q))) {
              matchesRegional = true;
              break;
            }
          }
        }
        if (!matchesName && !matchesHindi && !matchesSci && !matchesDesc && !matchesRegional) {
          return false;
        }
      }
      // Attributes filters
      if (edibleOnly && !p.edible) return false;
      if (petSafeOnly && p.toxicToPets) return false;
      if (indoorOnly && !p.indoorSuitable) return false;
      if (beginnerOnly && p.difficulty !== 'Very Easy' && p.difficulty !== 'Easy') return false;

      return true;
    });
  }, [recommendations, selectedCategory, searchQuery, edibleOnly, petSafeOnly, indoorOnly, beginnerOnly]);

  // Full library filter
  const filteredLibrary = useMemo(() => {
    return PLANT_CATALOG.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesHindi = p.hindiName?.toLowerCase().includes(q);
        const matchesSci = p.scientificName?.toLowerCase().includes(q);
        const matchesDesc = p.shortDescription.toLowerCase().includes(q);
        let matchesRegional = false;
        if (p.regionalNames) {
          for (const names of Object.values(p.regionalNames)) {
            if (names.some((n) => n.toLowerCase().includes(q))) {
              matchesRegional = true;
              break;
            }
          }
        }
        if (!matchesName && !matchesHindi && !matchesSci && !matchesDesc && !matchesRegional) {
          return false;
        }
      }
      if (edibleOnly && !p.edible) return false;
      if (petSafeOnly && p.toxicToPets) return false;
      if (indoorOnly && !p.indoorSuitable) return false;
      if (beginnerOnly && p.difficulty !== 'Very Easy' && p.difficulty !== 'Easy') return false;

      return true;
    });
  }, [selectedCategory, searchQuery, edibleOnly, petSafeOnly, indoorOnly, beginnerOnly]);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              🌱 Plant Knowledge &amp; Recommendations
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', color: 'var(--color-text-muted)' }}>
              Curated for Indian home gardens with transparent explanations, container limits, and provenance.
            </p>
          </div>

          {/* Mode Switcher */}
          <div role="group" aria-label="Catalog display mode" style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'var(--color-bg-base)', padding: '0.25rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setActiveMode('recommendations')}
              aria-pressed={activeMode === 'recommendations'}
              className={`btn btn-sm ${activeMode === 'recommendations' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            >
              <Sparkles size={14} style={{ marginRight: 4 }} />
              Best Fits ({filteredRecs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('all_library')}
              aria-pressed={activeMode === 'all_library'}
              className={`btn btn-sm ${activeMode === 'all_library' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            >
              <BookOpen size={14} style={{ marginRight: 4 }} />
              Full Library ({filteredLibrary.length})
            </button>
          </div>
        </div>
      </div>

      {/* Space Selector toolbar if multi-space */}
      {spaces.length > 1 && <SpaceSelector />}

      {/* Search and Filters Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          backgroundColor: '#FAFCFA'
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--color-text-subtle)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            id="plant-search-input"
            aria-label="Search plant catalog by name, regional name, or description"
            type="text"
            placeholder="Search by common name (Tulsi, Tomato), Hindi, scientific name (Ocimum), or regional synonyms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem 0.65rem 2.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
              backgroundColor: '#FFFFFF'
            }}
          />
        </div>

        {/* Category Pills */}
        <div
          role="group"
          aria-label="Plant category filters"
          style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Checkbox Chips: Edible, Pet Safe, Indoor, Beginner */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', paddingTop: '0.25rem', borderTop: '1px solid var(--color-border-subtle)' }}>
          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Quick Filters:
          </span>
          <label htmlFor="filter-edible" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            <input id="filter-edible" type="checkbox" checked={edibleOnly} onChange={(e) => setEdibleOnly(e.target.checked)} />
            <span>Edible Only</span>
          </label>
          <label htmlFor="filter-pet-safe" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            <input id="filter-pet-safe" type="checkbox" checked={petSafeOnly} onChange={(e) => setPetSafeOnly(e.target.checked)} />
            <span>Pet Safe Only 🐾</span>
          </label>
          <label htmlFor="filter-indoor" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            <input id="filter-indoor" type="checkbox" checked={indoorOnly} onChange={(e) => setIndoorOnly(e.target.checked)} />
            <span>Indoor Suitable 🏠</span>
          </label>
          <label htmlFor="filter-beginner" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            <input id="filter-beginner" type="checkbox" checked={beginnerOnly} onChange={(e) => setBeginnerOnly(e.target.checked)} />
            <span>Very Easy / Beginner</span>
          </label>
        </div>
      </div>

      {/* Mode 1: Recommendations View */}
      {activeMode === 'recommendations' && (
        <>
          {filteredRecs.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--color-bg-base)',
                border: '1px dashed var(--color-border-subtle)'
              }}
            >
              <Compass size={40} color="var(--color-primary-light)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
                No plant recommendations match your active filters
              </h3>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: 450, margin: '0 auto 1.5rem' }}>
                Try clearing search or filters to see more recommendations tailored to {selectedSpace ? selectedSpace.name : 'your space'}.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setEdibleOnly(false);
                  setPetSafeOnly(false);
                  setIndoorOnly(false);
                  setBeginnerOnly(false);
                }}
                className="btn btn-secondary btn-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {filteredRecs.map((rec) => {
                const { plant, matchScore, reasoning, warningNote, positiveReasons, potentialConflicts, missingInformation, confidenceLevel, nextAction } = rec;
                const inGarden = isPlantInGarden(plant.id);
                const isReasonOpen = expandedReasonId === plant.id;

                return (
                  <div
                    key={plant.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1.35rem',
                      border: inGarden ? '1.5px solid var(--color-primary)' : undefined,
                      backgroundColor: inGarden ? '#FAFCFA' : '#FFFFFF'
                    }}
                  >
                    <div>
                      {/* Badges row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.725rem' }}>
                          {plant.category.toUpperCase()}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                            {matchScore}% Match
                          </span>
                          {confidenceLevel && (
                            <span className="badge badge-neutral" style={{ fontSize: '0.725rem', textTransform: 'capitalize' }}>
                              {confidenceLevel}
                            </span>
                          )}
                          <span className={`badge ${plant.difficulty === 'Very Easy' ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '0.725rem' }}>
                            {plant.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Plant Name & Scientific Name */}
                      <h3
                        onClick={() => setSelectedPlantForDetail(plant)}
                        style={{
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          color: 'var(--color-primary-dark)',
                          margin: '0 0 0.15rem 0'
                        }}
                        title="Click to view detailed care card"
                      >
                        {plant.name}
                      </h3>
                      {plant.scientificName && (
                        <span style={{ display: 'block', fontSize: '0.775rem', fontStyle: 'italic', color: 'var(--color-text-subtle)', marginBottom: '0.45rem' }}>
                          {plant.scientificName}
                        </span>
                      )}

                      {/* Short Description */}
                      <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {plant.shortDescription}
                      </p>

                      {/* Quick Attributes */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                          <Sun size={12} color="var(--color-sun-gold)" />
                          {plant.sunlightText.split('(')[0].trim()}
                        </span>
                        {plant.containerFriendly && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                            Container Friendly
                          </span>
                        )}
                        {plant.containerRequirements?.minimumDepthCm && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                            Min Depth: {plant.containerRequirements.minimumDepthCm}cm
                          </span>
                        )}
                        {plant.edible && (
                          <span className="badge" style={{ backgroundColor: '#F0FDF4', color: '#166534', fontSize: '0.725rem' }}>
                            Edible
                          </span>
                        )}
                        {plant.toxicToPets ? (
                          <span className="badge" style={{ backgroundColor: '#FFFBEB', color: '#92400E', fontSize: '0.725rem' }}>
                            Toxic to Pets
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#F0FDF4', color: '#166534', fontSize: '0.725rem' }}>
                            Pet Safe
                          </span>
                        )}
                      </div>

                      {/* Warnings or Potential Conflicts */}
                      {(warningNote || (potentialConflicts && potentialConflicts.length > 0)) && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.4rem',
                            alignItems: 'flex-start',
                            backgroundColor: '#FFFDF0',
                            border: '1px solid #FEF3C7',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.5rem',
                            marginBottom: '0.75rem',
                            fontSize: '0.775rem',
                            color: '#92400E'
                          }}
                        >
                          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            {warningNote && <span>{warningNote}</span>}
                            {potentialConflicts && potentialConflicts.map((c, i) => (
                              <div key={i}>{c}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next Action */}
                      {nextAction && (
                        <div
                          style={{
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.45rem 0.65rem',
                            marginBottom: '0.85rem',
                            fontSize: '0.75rem',
                            color: '#15803D'
                          }}
                        >
                          <strong>Next action: </strong>
                          <span>{nextAction}</span>
                        </div>
                      )}

                      {/* Reasoning Dropdown */}
                      <div
                        style={{
                          backgroundColor: 'var(--color-bg-base)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-subtle)',
                          padding: '0.55rem 0.75rem',
                          marginBottom: '1rem'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedReasonId(isReasonOpen ? null : plant.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            fontWeight: 600,
                            fontSize: '0.775rem',
                            color: 'var(--color-primary-dark)'
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Sparkles size={13} color="var(--color-primary)" />
                            Why this plant? ({positiveReasons?.length || reasoning.length} reasons)
                          </span>
                          <span style={{ fontSize: '0.725rem', color: 'var(--color-text-subtle)' }}>
                            {isReasonOpen ? 'Hide' : 'Show'}
                          </span>
                        </button>

                        {isReasonOpen && (
                          <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <ul style={{ paddingLeft: '1rem', margin: '0 0 0.4rem 0' }}>
                              {(positiveReasons && positiveReasons.length > 0 ? positiveReasons : reasoning).map((r, idx) => (
                                <li key={idx} style={{ marginBottom: '0.2rem' }}>{r}</li>
                              ))}
                            </ul>
                            {missingInformation && missingInformation.length > 0 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.35rem' }}>
                                <em>Pending confirmation: {missingInformation.join('; ')}</em>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPlantForDetail(plant)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '0.8rem' }}
                      >
                        <Info size={14} />
                        <span>Care Details</span>
                      </button>

                      {inGarden ? (
                        <button
                          type="button"
                          onClick={() => removePlantFromGarden(plant.id)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            flex: 1,
                            backgroundColor: 'var(--color-primary-subtle)',
                            color: 'var(--color-primary-dark)',
                            borderColor: 'var(--color-primary-border)',
                            fontSize: '0.8rem'
                          }}
                          title="Click to remove from garden"
                        >
                          <Check size={14} />
                          <span>In Garden</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addPlantToGarden(plant)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontSize: '0.8rem' }}
                        >
                          <Plus size={14} />
                          <span>Add to Garden</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Mode 2: Full Catalog Library View */}
      {activeMode === 'all_library' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filteredLibrary.map((plant) => {
            const inGarden = isPlantInGarden(plant.id);
            const status = plant.dataQuality?.status || 'reviewed';

            return (
              <div
                key={plant.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.35rem',
                  border: inGarden ? '1.5px solid var(--color-primary)' : undefined,
                  backgroundColor: inGarden ? '#FAFCFA' : '#FFFFFF'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.725rem' }}>
                      {plant.category.toUpperCase()}
                    </span>
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: status === 'verified' ? '#DCFCE7' : status === 'reviewed' ? '#EFF6FF' : '#FEF3C7',
                        color: status === 'verified' ? '#15803D' : status === 'reviewed' ? '#1D4ED8' : '#B45309'
                      }}
                    >
                      {status === 'verified' ? '✓ Verified Source' : status === 'reviewed' ? 'Reviewed' : 'Provisional'}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedPlantForDetail(plant)}
                    style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', cursor: 'pointer', margin: '0 0 0.15rem 0' }}
                  >
                    {plant.name}
                  </h3>
                  {plant.scientificName && (
                    <span style={{ display: 'block', fontSize: '0.775rem', fontStyle: 'italic', color: 'var(--color-text-subtle)', marginBottom: '0.45rem' }}>
                      {plant.scientificName}
                    </span>
                  )}

                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    {plant.shortDescription}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                      <Sun size={12} color="var(--color-sun-gold)" />
                      {plant.sunlightText.split('(')[0].trim()}
                    </span>
                    {plant.containerRequirements?.minimumDepthCm && (
                      <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                        Min Depth: {plant.containerRequirements.minimumDepthCm}cm
                      </span>
                    )}
                    {plant.edible && (
                      <span className="badge" style={{ backgroundColor: '#F0FDF4', color: '#166534', fontSize: '0.725rem' }}>
                        Edible
                      </span>
                    )}
                    {plant.toxicToPets ? (
                      <span className="badge" style={{ backgroundColor: '#FFFBEB', color: '#92400E', fontSize: '0.725rem' }}>
                        Toxic to Pets
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#F0FDF4', color: '#166534', fontSize: '0.725rem' }}>
                        Pet Safe
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPlantForDetail(plant)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  >
                    <Info size={14} />
                    <span>Care Details</span>
                  </button>

                  {inGarden ? (
                    <button
                      type="button"
                      onClick={() => removePlantFromGarden(plant.id)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary-dark)',
                        borderColor: 'var(--color-primary-border)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <Check size={14} />
                      <span>In Garden</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addPlantToGarden(plant)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, fontSize: '0.8rem' }}
                    >
                      <Plus size={14} />
                      <span>Add to Garden</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
