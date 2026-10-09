import React, { useState, useEffect } from 'react';
import { useGarden } from '../context/GardenContext';
import {
  SpaceType,
  SpaceSize,
  SunlightAmount,
  GardeningGoal
} from '../types';
import {
  X,
  Plus,
  Home,
  Sun,
  Target,
  Maximize2,
  Camera,
  UploadCloud,
  Check
} from 'lucide-react';

export const SpaceModal: React.FC = () => {
  const {
    isSpaceModalOpen,
    spaceModalMode,
    editingSpace,
    closeSpaceModal,
    addSpace,
    editSpace
  } = useGarden();

  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType>('balcony');
  const [size, setSize] = useState<SpaceSize>('small');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [unit, setUnit] = useState<'ft' | 'm'>('ft');
  const [sunlight, setSunlight] = useState<SunlightAmount>('2_to_4h');
  const [goal, setGoal] = useState<GardeningGoal>('kitchen_garden');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');

  // Populate fields when modal opens or editingSpace changes
  useEffect(() => {
    if (!isSpaceModalOpen) return;

    if (spaceModalMode === 'edit' && editingSpace) {
      setName(editingSpace.name);
      setType(editingSpace.type);
      setSize(editingSpace.size);
      setWidth(editingSpace.dimensions?.width || '');
      setLength(editingSpace.dimensions?.length || '');
      setUnit(editingSpace.dimensions?.unit || 'ft');
      setSunlight(editingSpace.sunlight);
      setGoal(editingSpace.goal);
      setPhotoDataUrl(editingSpace.photos[0]?.dataUrl);
      setErrorMsg('');
    } else {
      setName('');
      setType('balcony');
      setSize('small');
      setWidth('');
      setLength('');
      setUnit('ft');
      setSunlight('2_to_4h');
      setGoal('kitchen_garden');
      setPhotoDataUrl(undefined);
      setErrorMsg('');
    }
  }, [isSpaceModalOpen, spaceModalMode, editingSpace]);

  if (!isSpaceModalOpen) return null;

  const spaceOptions: { id: SpaceType; label: string; desc: string }[] = [
    { id: 'balcony', label: 'Balcony', desc: 'Railing & containers' },
    { id: 'terrace', label: 'Terrace', desc: 'Open rooftop / patio' },
    { id: 'windowsill', label: 'Windowsill', desc: 'Sunny ledge' },
    { id: 'pots', label: 'Pots / Containers', desc: 'Potted grouping' },
    { id: 'backyard', label: 'Backyard', desc: 'Outdoor yard ground' },
    { id: 'garden', label: 'Garden Bed', desc: 'In-ground soil bed' },
    { id: 'indoor', label: 'Indoor', desc: 'Counters & plant stands' },
    { id: 'other', label: 'Other Space', desc: 'Veranda or mixed' }
  ];

  const sizeOptions: { id: SpaceSize; label: string; desc: string }[] = [
    { id: 'very_small', label: 'Very Small', desc: '1–2 small pots' },
    { id: 'small', label: 'Small', desc: 'Corner, 3–6 pots' },
    { id: 'medium', label: 'Medium', desc: 'Generous patio area' },
    { id: 'large', label: 'Large', desc: 'Expansive terrace or yard' }
  ];

  const sunOptions: { id: SunlightAmount; label: string; desc: string }[] = [
    { id: 'less_than_2h', label: '< 2 hrs', desc: 'Mostly shade' },
    { id: '2_to_4h', label: '2–4 hrs', desc: 'Gentle partial sun' },
    { id: '4_to_6h', label: '4–6 hrs', desc: 'Bright half-day sun' },
    { id: 'more_than_6h', label: '6+ hrs', desc: 'Full unbroken sun' },
    { id: 'unknown', label: "I don't know", desc: 'Safe adaptable plants' }
  ];

  const goalOptions: { id: GardeningGoal; label: string; desc: string }[] = [
    { id: 'kitchen_garden', label: 'Kitchen Garden', desc: 'Cooking herbs & greens' },
    { id: 'herbs', label: 'Aromatic Herbs', desc: 'Mint, coriander, basil' },
    { id: 'vegetables', label: 'Fresh Vegetables', desc: 'Spinach, chillies, tomatoes' },
    { id: 'flowers', label: 'Flowers', desc: 'Marigolds & pollinators' },
    { id: 'easy_plants', label: 'Easiest Plants', desc: 'Virtually unkillable starters' },
    { id: 'unknown', label: 'Recommend For Me', desc: 'Curated mix of starters' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)}`;

    const dimensions = width || length ? { width, length, unit } : undefined;

    if (spaceModalMode === 'create') {
      addSpace({
        name: finalName,
        type,
        size,
        dimensions,
        sunlight,
        goal,
        photoDataUrl,
        fileName: 'space.jpg'
      });
    } else if (spaceModalMode === 'edit' && editingSpace) {
      editSpace(editingSpace.id, {
        name: finalName,
        type,
        size,
        dimensions,
        sunlight,
        goal,
        photos: photoDataUrl ? [{
          id: 'photo-' + Date.now(),
          dataUrl: photoDataUrl,
          fileName: 'space.jpg',
          uploadedAt: new Date().toISOString()
        }] : editingSpace.photos
      });
    }

    closeSpaceModal();
  };

  return (
    <div className="modal-overlay" onClick={closeSpaceModal} role="dialog" aria-modal="true">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, maxHeight: '92vh' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary-dark)', margin: 0 }}>
              {spaceModalMode === 'create' ? '+ Add New Space' : 'Edit Growing Space'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Configure individual sunlight, size, and goals for this specific space.
            </p>
          </div>
          <button
            onClick={closeSpaceModal}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Space Name */}
          <div>
            <label className="form-label">Space Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Sunny Balcony, Kitchen Window, North Terrace"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg('');
              }}
              required
            />
            <span className="form-hint">A friendly name to distinguish it from your other spaces.</span>
          </div>

          {/* Space Type */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Home size={16} color="var(--color-primary)" />
              <label className="form-label" style={{ margin: 0 }}>Where is this space located?</label>
            </div>
            <div className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {spaceOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`option-tile ${type === opt.id ? 'selected' : ''}`}
                  style={{ padding: '0.65rem 0.5rem' }}
                >
                  <span className="option-tile-title" style={{ fontSize: '0.825rem' }}>{opt.label}</span>
                  <span className="option-tile-subtitle" style={{ fontSize: '0.7rem' }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Space Size & Dimensions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Maximize2 size={16} color="var(--color-primary)" />
              <label className="form-label" style={{ margin: 0 }}>Approximate Size</label>
            </div>
            <div className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', marginBottom: '0.6rem' }}>
              {sizeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSize(opt.id)}
                  className={`option-tile ${size === opt.id ? 'selected' : ''}`}
                  style={{ padding: '0.65rem 0.5rem' }}
                >
                  <span className="option-tile-title" style={{ fontSize: '0.825rem' }}>{opt.label}</span>
                  <span className="option-tile-subtitle" style={{ fontSize: '0.7rem' }}>{opt.desc}</span>
                </button>
              ))}
            </div>

            <details style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-primary)' }}>
                + Optional: Enter dimensions (width × length)
              </summary>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="form-input"
                  style={{ width: 100, padding: '0.5rem' }}
                />
                <span>×</span>
                <input
                  type="text"
                  placeholder="Length"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="form-input"
                  style={{ width: 100, padding: '0.5rem' }}
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'ft' | 'm')}
                  className="form-select"
                  style={{ width: 85, padding: '0.5rem' }}
                >
                  <option value="ft">Feet</option>
                  <option value="m">Meters</option>
                </select>
              </div>
            </details>
          </div>

          {/* Sunlight */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Sun size={16} color="var(--color-sun-gold)" />
              <label className="form-label" style={{ margin: 0 }}>Direct Sunlight for this space</label>
            </div>
            <div className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
              {sunOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSunlight(opt.id)}
                  className={`option-tile ${sunlight === opt.id ? 'selected' : ''}`}
                  style={{ padding: '0.6rem 0.4rem' }}
                >
                  <span className="option-tile-title" style={{ fontSize: '0.8rem' }}>{opt.label}</span>
                  <span className="option-tile-subtitle" style={{ fontSize: '0.675rem' }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Target size={16} color="var(--color-terracotta)" />
              <label className="form-label" style={{ margin: 0 }}>What would you love to grow here?</label>
            </div>
            <div className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {goalOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGoal(opt.id)}
                  className={`option-tile ${goal === opt.id ? 'selected' : ''}`}
                  style={{ padding: '0.6rem 0.5rem', textAlign: 'left', alignItems: 'flex-start' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span className="option-tile-title" style={{ fontSize: '0.8rem' }}>{opt.label}</span>
                    {goal === opt.id && <Check size={14} color="var(--color-primary)" />}
                  </div>
                  <span className="option-tile-subtitle" style={{ fontSize: '0.7rem' }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Photo Upload */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Camera size={16} color="var(--color-primary)" />
              <label className="form-label" style={{ margin: 0 }}>Optional Space Photo</label>
            </div>
            {photoDataUrl ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 160 }}>
                <img
                  src={photoDataUrl}
                  alt="Space preview"
                  style={{ width: '100%', height: 140, objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(undefined)}
                  className="btn btn-secondary btn-sm"
                  style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', color: '#C53030' }}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  border: '1.5px dashed var(--color-border-medium)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-bg-base)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)'
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <UploadCloud size={18} />
                <span>Upload a photo of this space (Optional)</span>
              </label>
            )}
          </div>

          {errorMsg && (
            <div style={{ color: '#C53030', fontSize: '0.85rem' }}>{errorMsg}</div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={closeSpaceModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>{spaceModalMode === 'create' ? 'Create Space' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
