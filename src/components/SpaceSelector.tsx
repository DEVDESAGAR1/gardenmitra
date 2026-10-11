import React from 'react';
import { useGarden } from '../context/GardenContext';
import {
  Plus,
  Edit2,
  Trash2,
  Layers
} from 'lucide-react';

interface SpaceSelectorProps {
  compact?: boolean;
  extraActions?: React.ReactNode;
}

export const SpaceSelector: React.FC<SpaceSelectorProps> = ({ compact = false, extraActions }) => {
  const {
    spaces,
    selectedSpaceId,
    selectedSpace,
    selectSpace,
    openCreateSpaceModal,
    openEditSpaceModal,
    deleteSpace
  } = useGarden();

  if (!spaces.length) return null;

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedSpaceId || ''}
            onChange={(e) => {
              if (e.target.value === '__add__') {
                openCreateSpaceModal();
              } else {
                selectSpace(e.target.value);
              }
            }}
            className="form-select"
            style={{
              padding: '0.35rem 1.75rem 0.35rem 0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-primary-subtle)',
              borderColor: 'var(--color-primary-border)',
              color: 'var(--color-primary-dark)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-full)'
            }}
            aria-label="Select Growing Space"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                📍 {s.name} ({s.plants.length} {s.plants.length === 1 ? 'plant' : 'plants'})
              </option>
            ))}
            <option value="__add__">+ Add New Space...</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Layers size={15} color="var(--color-primary)" />
          Active Space:
        </span>

        {/* Space selection tabs / pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {spaces.map((space) => {
            const isSelected = space.id === selectedSpaceId;
            return (
              <button
                key={space.id}
                type="button"
                onClick={() => selectSpace(space.id)}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.825rem',
                  padding: '0.35rem 0.85rem'
                }}
              >
                <span>{space.name}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--color-bg-muted)',
                    color: isSelected ? '#FFFFFF' : 'var(--color-text-subtle)'
                  }}
                >
                  {space.plants.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons: Extra actions (Reevaluate Care), Edit current space, Add new space */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {extraActions}

        {selectedSpace && (
          <button
            type="button"
            onClick={() => openEditSpaceModal(selectedSpace)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            title="Edit this space's name, sunlight, or size"
          >
            <Edit2 size={13} />
            <span>Edit Space</span>
          </button>
        )}

        {spaces.length > 1 && selectedSpace && (
          <button
            type="button"
            onClick={() => deleteSpace(selectedSpace.id)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.8rem', color: '#C53030', padding: '0.35rem 0.65rem' }}
            title="Delete this space"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        )}

        <button
          type="button"
          onClick={openCreateSpaceModal}
          className="btn btn-terracotta btn-sm"
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
        >
          <Plus size={14} />
          <span>+ Add New Space</span>
        </button>
      </div>
    </div>
  );
};
