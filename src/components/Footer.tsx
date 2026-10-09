import React from 'react';
import { useGarden } from '../context/GardenContext';
import { Heart, RotateCcw, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { resetAll } = useGarden();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        backgroundColor: '#FFFFFF',
        padding: '2.5rem 1rem',
        marginTop: 'auto'
      }}
    >
      <div className="container" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
            GardenMitra 🌱
          </span>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Built for Hacktoberfest Week 1 “Touch Grass” Challenge.
          </p>
        </div>

        {/* Philosophy loop */}
        <div
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'var(--color-bg-base)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            marginBottom: '1.5rem'
          }}
        >
          <span>PHOTO</span>
          <span>→</span>
          <span>UNDERSTAND</span>
          <span>→</span>
          <span>RECOMMEND</span>
          <span>→</span>
          <span>PREPARE</span>
          <span>→</span>
          <span>GROW</span>
          <span>→</span>
          <span style={{ color: 'var(--color-primary-dark)' }}>GO OUTSIDE 🌿</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.825rem',
            color: 'var(--color-text-subtle)',
            marginBottom: '1.5rem'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={16} color="var(--color-primary)" />
            Local-First &amp; Private: Data stays in your browser
          </span>
          <span>•</span>
          <span>No accounts • No ads • Open Source MIT</span>
          <span>•</span>
          <button
            onClick={() => {
              if (window.confirm('Reset all garden data and start from zero?')) {
                resetAll();
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: 'var(--color-text-subtle)',
              fontSize: '0.825rem'
            }}
          >
            <RotateCcw size={13} />
            Reset Demo Data
          </button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
          Crafted with care to help beginner humans spend less time staring at pixels and more time nurturing living plants. <Heart size={12} style={{ display: 'inline', verticalAlign: 'middle', color: '#E53E3E' }} />
        </p>
      </div>
    </footer>
  );
};
