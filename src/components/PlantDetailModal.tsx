import React from 'react';
import { useGarden } from '../context/GardenContext';
import { Plant } from '../types';
import {
  X,
  Sun,
  Droplets,
  Box,
  Clock,
  Sparkles,
  AlertCircle,
  Plus
} from 'lucide-react';

interface PlantDetailModalProps {
  plant: Plant | null;
  onClose: () => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({ plant, onClose }) => {
  const { isPlantInGarden, addPlantToGarden, removePlantFromGarden, profile } = useGarden();

  if (!plant) return null;

  const inGarden = isPlantInGarden(plant.id);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-green">{plant.category.toUpperCase()}</span>
              <span className={`badge ${plant.difficulty === 'Very Easy' ? 'badge-green' : 'badge-gold'}`}>
                {plant.difficulty}
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {plant.name}
            </h2>
            {plant.scientificName && (
              <span style={{ fontSize: '0.825rem', fontStyle: 'italic', color: 'var(--color-text-subtle)' }}>
                {plant.scientificName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Short Description */}
        <p style={{ fontSize: '1rem', color: 'var(--color-text-main)', marginBottom: '1.25rem' }}>
          {plant.shortDescription}
        </p>

        {/* Why it may suit your garden */}
        <div
          style={{
            backgroundColor: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
              Why this suits your {profile?.spaceType || 'garden'}
            </strong>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', margin: 0 }}>
            {plant.containerFriendly
              ? `Compact and container-friendly. Perfect for your ${profile?.spaceType || 'balcony'} setup without demanding in-ground roots.`
              : 'Adaptable root structure with forgiving care requirements for new gardeners.'}
          </p>
        </div>

        {/* Care Quick Attributes Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.9rem',
            marginBottom: '1.5rem'
          }}
        >
          <div className="card" style={{ padding: '0.9rem', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-sun-gold)', marginBottom: '0.25rem' }}>
              <Sun size={16} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Sunlight</strong>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>{plant.sunlightText}</span>
          </div>

          <div className="card" style={{ padding: '0.9rem', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3182CE', marginBottom: '0.25rem' }}>
              <Droplets size={16} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Watering</strong>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>{plant.wateringText}</span>
          </div>

          <div className="card" style={{ padding: '0.9rem', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-terracotta)', marginBottom: '0.25rem' }}>
              <Box size={16} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Container</strong>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>{plant.spaceText}</span>
          </div>

          <div className="card" style={{ padding: '0.9rem', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              <Clock size={16} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Timeline</strong>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>{plant.approximateGrowthTime}</span>
          </div>
        </div>

        {/* Container Guidance & Growing Timeline */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>Container &amp; Soil Guidance</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {plant.containerGuidance}
          </p>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>Growth &amp; Harvesting Timeline</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {plant.growingTimeline}
          </p>
        </div>

        {/* Basic Care Steps */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Basic Care for Beginners</h4>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {plant.basicCare.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '0.35rem' }}>{step}</li>
            ))}
          </ul>
        </div>

        {/* Things to Watch For */}
        <div
          style={{
            backgroundColor: '#FFF8F0',
            border: '1px solid #FEEBC8',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)', marginBottom: '0.4rem' }}>
            <AlertCircle size={16} />
            <strong style={{ fontSize: '0.85rem' }}>Things to Watch For (Gotchas)</strong>
          </div>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#744210', margin: 0 }}>
            {plant.thingsToWatchFor.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
          {inGarden ? (
            <button
              type="button"
              onClick={() => removePlantFromGarden(plant.id)}
              className="btn btn-secondary"
              style={{ color: '#C53030', borderColor: '#FEB2B2' }}
            >
              <span>Remove from My Garden</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                addPlantToGarden(plant);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add to My Garden</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
