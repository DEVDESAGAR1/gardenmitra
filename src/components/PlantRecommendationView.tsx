import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import { PlantCategory } from '../types';
import {
  Sparkles,
  Sun,
  Check,
  Plus,
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react';

export const PlantRecommendationView: React.FC = () => {
  const {
    recommendations,
    profile,
    addPlantToGarden,
    removePlantFromGarden,
    isPlantInGarden,
    setSelectedPlantForDetail,
    setActiveTab
  } = useGarden();

  const [selectedCategory, setSelectedCategory] = useState<PlantCategory | 'all'>('all');
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);

  const filteredRecs = recommendations.filter((rec) => {
    if (selectedCategory === 'all') return true;
    return rec.plant.category === selectedCategory;
  });

  const categories: { id: PlantCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Recommendations' },
    { id: 'herbs', label: 'Aromatic Herbs' },
    { id: 'vegetables', label: 'Crisp Vegetables' },
    { id: 'flowers', label: 'Beneficial Flowers' }
  ];

  const { spaces, selectedSpace } = useGarden();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)', margin: 0 }}>
            🌱 Good choices for {selectedSpace ? selectedSpace.name : 'your space'}
          </h2>
        </div>
        <p style={{ margin: 0 }}>
          {profile
            ? `Curated specifically for ${selectedSpace ? selectedSpace.name : profile.spaceType} in ${profile.location.city} (${profile.sunlight.replace(/_/g, ' ')} sun).`
            : 'Personalized recommendations based on forgiving care and proven container success.'}
        </p>
      </div>

      {/* Space Selector toolbar if multi-space */}
      {spaces.length > 1 && <SpaceSelector />}

      {/* Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.75rem'
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {filteredRecs.map(({ plant, matchScore, reasoning, warningNote }) => {
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
                  <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                    {plant.category.toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                      {matchScore}% Match
                    </span>
                    <span className={`badge ${plant.difficulty === 'Very Easy' ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '0.75rem' }}>
                      {plant.difficulty}
                    </span>
                  </div>
                </div>

                {/* Plant Name */}
                <h3
                  onClick={() => setSelectedPlantForDetail(plant)}
                  style={{
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: 'var(--color-primary-dark)',
                    marginBottom: '0.25rem'
                  }}
                  title="Click to view detailed care card"
                >
                  {plant.name}
                </h3>

                {/* Short Description */}
                <p style={{ fontSize: '0.875rem', marginBottom: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {plant.shortDescription}
                </p>

                {/* Quick Attributes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                    <Sun size={12} color="var(--color-sun-gold)" />
                    {plant.sunlightText.split('(')[0].trim()}
                  </span>
                  {plant.containerFriendly && (
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                      Container Friendly
                    </span>
                  )}
                </div>

                {/* Warning note if any */}
                {warningNote && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.4rem',
                      alignItems: 'flex-start',
                      backgroundColor: '#FFFDF0',
                      border: '1px solid #FEF3C7',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem',
                      marginBottom: '0.85rem',
                      fontSize: '0.775rem',
                      color: '#92400E'
                    }}
                  >
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{warningNote}</span>
                  </div>
                )}

                {/* Why this plant? Reasoning dropdown/box */}
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-base)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1.25rem'
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
                      fontSize: '0.8rem',
                      color: 'var(--color-primary-dark)'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={14} color="var(--color-primary)" />
                      Why this plant for you?
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                      {isReasonOpen ? 'Hide' : 'Show reasoning'}
                    </span>
                  </button>

                  {isReasonOpen && (
                    <ul style={{ paddingLeft: '1.1rem', marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
                      {reasoning.map((reason, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPlantForDetail(plant)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.825rem' }}
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
                      fontSize: '0.825rem'
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
                    style={{ flex: 1, fontSize: '0.825rem' }}
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

      {/* Floating Next Steps Bar */}
      <div
        style={{
          marginTop: '2.5rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
            Selected what you want to grow?
          </strong>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            GardenMitra will automatically generate your starter container &amp; soil shopping list.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('shopping')}
            className="btn btn-terracotta"
          >
            <span>View Shopping List</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
