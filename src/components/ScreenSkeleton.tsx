import React from 'react';
import { Sprout } from 'lucide-react';

interface ScreenSkeletonProps {
  label?: string;
}

export const ScreenSkeleton: React.FC<ScreenSkeletonProps> = ({ label = 'Loading garden view...' }) => {
  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      style={{
        width: '100%',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        maxWidth: 960,
        margin: '0 auto',
        animation: 'fadeIn 0.2s ease-in'
      }}
    >
      {/* Skeleton Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}
        >
          <Sprout size={24} style={{ animation: 'pulse 1.8s ease-in-out infinite' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              width: '40%',
              height: '1.4rem',
              backgroundColor: '#E2E8F0',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '0.4rem',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
          <div
            style={{
              width: '65%',
              height: '0.85rem',
              backgroundColor: '#F1F5F9',
              borderRadius: 'var(--radius-sm)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      {/* Skeleton Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}
      >
        {[1, 2, 3].map((key) => (
          <div
            key={key}
            className="card"
            style={{
              padding: '1.5rem',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}
          >
            <div
              style={{
                width: '60%',
                height: '1.1rem',
                backgroundColor: '#E2E8F0',
                borderRadius: 'var(--radius-sm)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            <div
              style={{
                width: '90%',
                height: '0.8rem',
                backgroundColor: '#F1F5F9',
                borderRadius: 'var(--radius-sm)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            <div
              style={{
                width: '75%',
                height: '0.8rem',
                backgroundColor: '#F1F5F9',
                borderRadius: 'var(--radius-sm)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            <div
              style={{
                marginTop: 'auto',
                width: '35%',
                height: '1.75rem',
                backgroundColor: '#E2E8F0',
                borderRadius: 'var(--radius-sm)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </div>
        ))}
      </div>

      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {label}
      </span>
    </div>
  );
};
