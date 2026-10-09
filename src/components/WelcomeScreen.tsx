import React from 'react';
import { useGarden } from '../context/GardenContext';
import { ArrowRight, Sparkles, Sun, Droplets, HeartHandshake, Compass, Camera } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { setActiveTab, profile } = useGarden();

  const handleStart = () => {
    if (profile) {
      setActiveTab('my_garden');
    } else {
      setActiveTab('setup');
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '1rem 0 3rem' }}>
      {/* Touch Grass Philosophy Pill */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            backgroundColor: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-primary-dark)'
          }}
        >
          <Sparkles size={16} />
          <span>Hacktoberfest Week 1: “Touch Grass” Challenge</span>
        </div>
      </div>

      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            fontWeight: 700,
            color: 'var(--color-primary-dark)',
            letterSpacing: '-0.025em',
            marginBottom: '1rem',
            lineHeight: 1.15
          }}
        >
          Your first garden, <br />
          <span style={{ color: 'var(--color-terracotta)' }}>from zero.</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--color-text-muted)',
            maxWidth: 620,
            margin: '0 auto 2rem',
            lineHeight: 1.6
          }}
        >
          Don't know anything about gardening? That's okay.
          <br />
          <strong>GardenMitra</strong> helps you choose what to grow, what you need, and what to do next.
        </p>

        {/* Primary CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={handleStart}
            className="btn btn-primary btn-lg"
            style={{ minWidth: 240, fontSize: '1.1rem', gap: '0.75rem' }}
          >
            <span>{profile ? 'Resume My Garden' : 'Start My Garden'}</span>
            <ArrowRight size={20} />
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', fontWeight: 500 }}>
            Built for beginners 🌱
          </span>
        </div>
      </div>

      {/* Philosophy Banner */}
      <div className="touch-grass-strip" style={{ marginBottom: '3rem' }}>
        <div className="touch-grass-text">
          <span style={{ fontSize: '1.4rem' }}>🌿</span>
          <div>
            <strong>Our Touch Grass Philosophy</strong>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              We believe great gardening tools shouldn't keep you hooked on a screen. Discover your plants, get your checklist, then close the app and step outside into real fresh air.
            </p>
          </div>
        </div>
      </div>

      {/* The 4 Core Steps */}
      <div style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1.75rem', color: 'var(--color-text-main)' }}>
          How GardenMitra guides you from zero:
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem'
          }}
        >
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Camera size={22} />
            </div>
            <h3>1. Show Your Space</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Balcony, windowsill, or open terrace. Tell us where you live and snap a quick photo.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-terracotta-light)',
                color: 'var(--color-terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Compass size={22} />
            </div>
            <h3>2. Beginner Plants</h3>
            <p style={{ fontSize: '0.9rem' }}>
              No overwhelming lists. Only resilient, foolproof plants with personalized “Why this plant?” reasoning.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-sun-subtle)',
                color: '#975A16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Droplets size={22} />
            </div>
            <h3>3. No-Fluff Shopping</h3>
            <p style={{ fontSize: '0.9rem' }}>
              We compile exactly what you need—pot size, soil type, and seeds—explaining what each item actually does.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sun size={22} />
            </div>
            <h3>4. Today's 8-Min Task</h3>
            <p style={{ fontSize: '0.9rem' }}>
              A bite-sized 8-minute daily routine. Tick off your check, close the app, and connect with nature.
            </p>
          </div>
        </div>
      </div>

      {/* Friendly Reassurance Quote */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--color-primary)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem'
        }}
      >
        <div style={{ color: 'var(--color-primary)' }}>
          <HeartHandshake size={32} />
        </div>
        <div>
          <h4 style={{ marginBottom: '0.2rem' }}>“I have a black thumb and kill every plant.”</h4>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            Almost every beginner who kills a plant simply gave it too much love (overwatering) or put it in darkness.
            GardenMitra turns those common gotchas into simple daily habits.
          </p>
        </div>
      </div>
    </div>
  );
};
