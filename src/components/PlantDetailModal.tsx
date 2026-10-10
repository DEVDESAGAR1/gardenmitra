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
  Plus,
  ShieldCheck,
  ShieldAlert,
  Thermometer,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface PlantDetailModalProps {
  plant: Plant | null;
  onClose: () => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({ plant, onClose }) => {
  const { isPlantInGarden, addPlantToGarden, removePlantFromGarden, profile } = useGarden();

  if (!plant) return null;

  const inGarden = isPlantInGarden(plant.id);
  const dataQuality = plant.dataQuality;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-green">{plant.category.toUpperCase()}</span>
              <span className={`badge ${plant.difficulty === 'Very Easy' ? 'badge-green' : 'badge-gold'}`}>
                {plant.difficulty}
              </span>
              {dataQuality && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: dataQuality.status === 'verified' ? '#DCFCE7' : dataQuality.status === 'reviewed' ? '#EFF6FF' : '#FEF3C7',
                    color: dataQuality.status === 'verified' ? '#15803D' : dataQuality.status === 'reviewed' ? '#1D4ED8' : '#B45309',
                    fontSize: '0.725rem'
                  }}
                >
                  {dataQuality.status === 'verified' ? '✓ Verified Data' : dataQuality.status === 'reviewed' ? 'Reviewed' : 'Provisional'}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.6rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {plant.name}
            </h2>

            {plant.scientificName && (
              <span style={{ display: 'block', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-text-subtle)' }}>
                {plant.scientificName}
              </span>
            )}

            {/* Regional Names */}
            {plant.regionalNames && Object.keys(plant.regionalNames).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {Object.entries(plant.regionalNames).map(([lang, names]) => (
                  <span key={lang} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {lang.toUpperCase()}: {names.join(', ')}
                  </span>
                ))}
              </div>
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
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginBottom: '1.25rem' }}>
          {plant.shortDescription}
        </p>

        {/* Safety & Toxicity Banner */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {plant.toxicToPets ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FEF3C7',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                color: '#92400E'
              }}
            >
              <ShieldAlert size={15} />
              <span>Pet Warning: Toxic to cats/dogs if ingested. Keep out of pet reach.</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                color: '#15803D'
              }}
            >
              <ShieldCheck size={15} />
              <span>Pet Safe: Non-toxic to household cats and dogs.</span>
            </div>
          )}

          {plant.edible && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                color: '#15803D'
              }}
            >
              <CheckCircle2 size={15} />
              <span>Edible: Safe for home kitchen harvest.</span>
            </div>
          )}
        </div>

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.5rem'
          }}
        >
          <div className="card" style={{ padding: '0.85rem', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-sun-gold)', marginBottom: '0.25rem' }}>
              <Sun size={16} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Sunlight</strong>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>{plant.sunlightText}</span>
          </div>

          <div className="card" style={{ padding: '0.85rem', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3182CE', marginBottom: '0.25rem' }}>
              <Droplets size={16} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Watering</strong>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>{plant.wateringText}</span>
          </div>

          <div className="card" style={{ padding: '0.85rem', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-terracotta)', marginBottom: '0.25rem' }}>
              <Box size={16} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Container</strong>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              {plant.containerRequirements?.minimumDepthCm
                ? `Min ${plant.containerRequirements.minimumDepthCm}cm depth (${plant.containerRequirements.recommendedDepthCm || plant.containerRequirements.minimumDepthCm}cm ideal)`
                : plant.spaceText}
            </span>
          </div>

          <div className="card" style={{ padding: '0.85rem', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              <Clock size={16} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Timeline</strong>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>{plant.approximateGrowthTime}</span>
          </div>

          {plant.temperatureRequirements && (
            <div className="card" style={{ padding: '0.85rem', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DD6B20', marginBottom: '0.25rem' }}>
                <Thermometer size={16} />
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Temperature</strong>
              </div>
              <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                {plant.temperatureRequirements.optimalMinC}°C – {plant.temperatureRequirements.optimalMaxC}°C optimal
              </span>
            </div>
          )}
        </div>

        {/* Seasonal Planting Rules */}
        {plant.seasonalRules && plant.seasonalRules.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Calendar size={15} color="var(--color-primary)" />
              <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Seasonal Planting Guidance (India)</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {plant.seasonalRules.map((rule, idx) => (
                <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
                  <strong>{rule.seasons.join(', ').toUpperCase()} {rule.region ? `(${rule.region})` : ''}: </strong>
                  <span style={{ color: 'var(--color-text-muted)' }}>{rule.guidance}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Container Guidance & Growing Timeline */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>Container &amp; Soil Guidance</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {plant.containerGuidance}
          </p>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>Growth &amp; Harvesting Timeline</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {plant.growingTimeline}
          </p>
        </div>

        {/* Care Instructions by Category */}
        {plant.careInstructions && plant.careInstructions.length > 0 ? (
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>Care Instructions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {plant.careInstructions.map((inst, idx) => (
                <div key={idx} style={{ backgroundColor: '#FAFCFA', border: '1px solid var(--color-border-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
                  <strong style={{ color: 'var(--color-primary-dark)' }}>{inst.title} ({inst.category}): </strong>
                  <span style={{ color: 'var(--color-text-muted)' }}>{inst.instruction}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>Basic Care for Beginners</h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
              {plant.basicCare.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '0.3rem' }}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Things to Watch For */}
        <div
          style={{
            backgroundColor: '#FFF8F0',
            border: '1px solid #FEEBC8',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)', marginBottom: '0.35rem' }}>
            <AlertCircle size={16} />
            <strong style={{ fontSize: '0.85rem' }}>Things to Watch For (Gotchas)</strong>
          </div>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#744210', margin: 0 }}>
            {plant.thingsToWatchFor.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '0.2rem' }}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Data Provenance & Sources */}
        {dataQuality && dataQuality.sources && dataQuality.sources.length > 0 && (
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.8rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
            <strong>Data Provenance &amp; Attribution:</strong>
            <ul style={{ paddingLeft: '1rem', margin: '0.25rem 0 0 0' }}>
              {dataQuality.sources.map((src, idx) => (
                <li key={idx}>
                  {src.name} {src.licence ? `(${src.licence})` : ''} {src.url ? `— ${src.url}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
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
              <span>Remove from Garden</span>
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
              <span>Add to Garden</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
