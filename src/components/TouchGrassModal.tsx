import React from 'react';
import { useGarden } from '../context/GardenContext';
import { X, Sun, Wind, Eye, Sparkles, Sprout } from 'lucide-react';

export const TouchGrassModal: React.FC = () => {
  const { showTouchGrassModal, setShowTouchGrassModal, profile } = useGarden();

  if (!showTouchGrassModal) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => setShowTouchGrassModal(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ textAlign: 'center', maxWidth: 520, padding: '2.5rem 2rem' }}
      >
        <button
          onClick={() => setShowTouchGrassModal(false)}
          className="btn btn-ghost btn-sm"
          style={{ position: 'absolute', top: 16, right: 16, borderRadius: 'var(--radius-full)' }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}
        >
          <Sun size={32} />
        </div>

        <h2 style={{ fontSize: '1.75rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
          Time to Touch Grass 🌿
        </h2>

        <p style={{ fontSize: '1rem', color: 'var(--color-text-main)', marginBottom: '1.75rem' }}>
          Step away from your screen. Your {profile?.spaceType || 'outdoor space'} is waiting.
        </p>

        {/* 3-Minute Sensory Grounding Exercise */}
        <div
          style={{
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            backgroundColor: 'var(--color-bg-base)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.75rem',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--color-primary)', marginTop: 2 }}>
              <Eye size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>1. Look:</strong>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Look at the horizon, the sky, or light passing through a leaf for 60 seconds without checking notifications.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--color-terracotta)', marginTop: 2 }}>
              <Sprout size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>2. Touch:</strong>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Touch real potting mix or a gentle stem. Feel the temperature and texture under your fingers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ color: '#3182CE', marginTop: 2 }}>
              <Wind size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>3. Breathe:</strong>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Inhale 3 slow, deep breaths of outdoor air. Notice the earthy aroma.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowTouchGrassModal(false)}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', fontSize: '1.05rem', gap: '0.5rem' }}
        >
          <Sparkles size={18} />
          <span>I&apos;m Stepping Outside Now! 🌱</span>
        </button>
      </div>
    </div>
  );
};
