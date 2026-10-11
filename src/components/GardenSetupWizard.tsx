import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import {
  SpaceType,
  SpaceSize,
  SunlightAmount,
  ExperienceLevel,
  GardeningGoal,
  GardenProfile
} from '../types';
import {
  MapPin,
  Home,
  Sun,
  Sprout,
  Target,
  ArrowRight,
  Maximize2,
  Check
} from 'lucide-react';

export const GardenSetupWizard: React.FC = () => {
  const { profile, saveProfile, setActiveTab } = useGarden();

  // Local form state initialized with existing profile if editing
  const [city, setCity] = useState(profile?.location.city || '');
  const [state, setState] = useState(profile?.location.state || '');
  const [country, setCountry] = useState(profile?.location.country || 'India');

  const [spaceType, setSpaceType] = useState<SpaceType>(profile?.spaceType || 'balcony');
  const [spaceSize, setSpaceSize] = useState<SpaceSize>(profile?.spaceSize || 'small');
  const [width, setWidth] = useState(profile?.dimensions?.width || '');
  const [length, setLength] = useState(profile?.dimensions?.length || '');
  const [dimensionUnit, setDimensionUnit] = useState<'ft' | 'm'>(profile?.dimensions?.unit || 'ft');

  const [sunlight, setSunlight] = useState<SunlightAmount>(profile?.sunlight || '2_to_4h');
  const [experience, setExperience] = useState<ExperienceLevel>(profile?.experience || 'complete_beginner');
  const [goal, setGoal] = useState<GardeningGoal>(profile?.goal || 'unknown');

  const [errorMsg, setErrorMsg] = useState('');

  // Preset location quick helpers
  const handleQuickLocation = (c: string, s: string, co: string) => {
    setCity(c);
    setState(s);
    setCountry(co);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      setErrorMsg('Please enter your city so we can adapt plant seasons appropriately.');
      return;
    }

    const newProfile: GardenProfile = {
      id: profile?.id || 'prof-' + Date.now(),
      location: {
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || 'India'
      },
      spaceType,
      spaceSize,
      dimensions: width || length ? { width, length, unit: dimensionUnit } : undefined,
      sunlight,
      experience,
      goal,
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveProfile(newProfile);
    // Proceed to photo upload next!
    setActiveTab('my_garden');
  };

  const spaceOptions: { id: SpaceType; label: string; desc: string }[] = [
    { id: 'balcony', label: 'Balcony', desc: 'Railing, pots, fresh air' },
    { id: 'terrace', label: 'Terrace', desc: 'Open rooftop or large patio' },
    { id: 'windowsill', label: 'Windowsill', desc: 'Compact sunny ledge' },
    { id: 'pots', label: 'Pots / Containers', desc: 'Potted grouping' },
    { id: 'backyard', label: 'Backyard', desc: 'Outdoor home ground' },
    { id: 'garden', label: 'Garden Bed', desc: 'Direct in-ground soil' },
    { id: 'indoor', label: 'Indoor', desc: 'Living room / kitchen counter' },
    { id: 'other', label: 'Other', desc: 'Mixed or veranda space' }
  ];

  const sizeOptions: { id: SpaceSize; label: string; desc: string }[] = [
    { id: 'very_small', label: 'Very Small', desc: '1–2 small pots' },
    { id: 'small', label: 'Small', desc: 'Balcony corner, 3–6 pots' },
    { id: 'medium', label: 'Medium', desc: 'Full balcony or patio space' },
    { id: 'large', label: 'Large', desc: 'Spacious terrace or yard' }
  ];

  const sunOptions: { id: SunlightAmount; label: string; desc: string }[] = [
    { id: 'less_than_2h', label: 'Less than 2 hrs', desc: 'Mostly shade / high walls' },
    { id: '2_to_4h', label: '2–4 hours', desc: 'Gentle morning or evening sun' },
    { id: '4_to_6h', label: '4–6 hours', desc: 'Good bright half-day sun' },
    { id: 'more_than_6h', label: '6+ hours', desc: 'Full unbroken sunshine' },
    { id: 'unknown', label: "I don't know", desc: 'Not sure yet (safe options)' }
  ];

  const expOptions: { id: ExperienceLevel; label: string; desc: string }[] = [
    { id: 'complete_beginner', label: 'Complete Beginner', desc: 'Never grown a plant before (Default)' },
    { id: 'beginner', label: 'Beginner', desc: 'Kept a plant or two alive' },
    { id: 'some_experience', label: 'Some Experience', desc: 'Familiar with basic watering' },
    { id: 'experienced', label: 'Experienced', desc: 'Comfortable with plant care' }
  ];

  const goalOptions: { id: GardeningGoal; label: string; desc: string }[] = [
    { id: 'unknown', label: "I don't know — recommend for me 🌱", desc: 'Give me the most resilient starter plants' },
    { id: 'kitchen_garden', label: 'Kitchen Garden', desc: 'Essential daily cooking herbs & greens' },
    { id: 'herbs', label: 'Herbs', desc: 'Mint, coriander, basil, tulsi' },
    { id: 'vegetables', label: 'Vegetables', desc: 'Spinach, chillies, tomatoes' },
    { id: 'flowers', label: 'Flowers', desc: 'Marigolds, bright colors, pollinators' },
    { id: 'fruits', label: 'Fruits', desc: 'Berries, patio citrus, cherry tomatoes' },
    { id: 'easy_plants', label: 'Easiest Plants', desc: 'Virtually unkillable starters' }
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 0 3rem' }}>
      <div className="section-header" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.85rem', color: 'var(--color-primary-dark)' }}>
          Set Up Your Garden Profile 🌱
        </h2>
        <p style={{ margin: '0 auto' }}>
          Takes less than 60 seconds. No gardening jargon, no GPS required.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Step A: Location */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <MapPin size={22} color="var(--color-primary)" />
            <h3>A. Location (Climate &amp; Region)</h3>
          </div>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Helps us know your general temperatures and sunlight angle. No exact GPS needed.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label htmlFor="wizard-city-input" className="form-label">City *</label>
              <input
                id="wizard-city-input"
                type="text"
                className="form-input"
                placeholder="e.g. Mumbai, Bengaluru, Austin"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setErrorMsg('');
                }}
                required
              />
            </div>
            <div>
              <label htmlFor="wizard-state-input" className="form-label">State / Region</label>
              <input
                id="wizard-state-input"
                type="text"
                className="form-input"
                placeholder="e.g. Maharashtra, Texas"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="wizard-country-input" className="form-label">Country</label>
              <input
                id="wizard-country-input"
                type="text"
                className="form-input"
                placeholder="e.g. India, USA, UK"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          {/* Quick city suggestions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>Quick select:</span>
            {[
              { c: 'Mumbai', s: 'Maharashtra', co: 'India' },
              { c: 'Bengaluru', s: 'Karnataka', co: 'India' },
              { c: 'Delhi', s: 'Delhi', co: 'India' },
              { c: 'Pune', s: 'Maharashtra', co: 'India' },
              { c: 'London', s: 'England', co: 'UK' },
              { c: 'Austin', s: 'Texas', co: 'USA' }
            ].map((loc) => (
              <button
                key={loc.c}
                type="button"
                onClick={() => handleQuickLocation(loc.c, loc.s, loc.co)}
                className="badge badge-neutral"
                style={{ cursor: 'pointer' }}
              >
                {loc.c}
              </button>
            ))}
          </div>
        </div>

        {/* Step B: Growing Space */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Home size={22} color="var(--color-primary)" />
            <h3>B. Where will your garden live?</h3>
          </div>
          <div role="group" aria-label="Garden space type" className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {spaceOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={spaceType === opt.id}
                onClick={() => setSpaceType(opt.id)}
                className={`option-tile ${spaceType === opt.id ? 'selected' : ''}`}
              >
                <span className="option-tile-title">{opt.label}</span>
                <span className="option-tile-subtitle">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step C: Space Size & Optional Dimensions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Maximize2 size={22} color="var(--color-primary)" />
            <h3>C. Approximate space size</h3>
          </div>
          <div role="group" aria-label="Approximate space size" className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', marginBottom: '1.25rem' }}>
            {sizeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={spaceSize === opt.id}
                onClick={() => setSpaceSize(opt.id)}
                className={`option-tile ${spaceSize === opt.id ? 'selected' : ''}`}
              >
                <span className="option-tile-title">{opt.label}</span>
                <span className="option-tile-subtitle">{opt.desc}</span>
              </button>
            ))}
          </div>

          <details style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-primary)' }}>
              + Optional: Enter rough dimensions (width × length)
            </summary>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <input
                id="wizard-width-input"
                aria-label="Garden width"
                type="text"
                placeholder="Width (e.g. 6)"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="form-input"
                style={{ width: 120 }}
              />
              <span>×</span>
              <input
                id="wizard-length-input"
                aria-label="Garden length"
                type="text"
                placeholder="Length (e.g. 10)"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="form-input"
                style={{ width: 120 }}
              />
              <select
                aria-label="Dimension unit"
                value={dimensionUnit}
                onChange={(e) => setDimensionUnit(e.target.value as 'ft' | 'm')}
                className="form-select"
                style={{ width: 90 }}
              >
                <option value="ft">Feet</option>
                <option value="m">Meters</option>
              </select>
            </div>
          </details>
        </div>

        {/* Step D: Sunlight */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Sun size={22} color="var(--color-sun-gold)" />
            <h3>D. Direct Sunlight</h3>
          </div>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            How many hours of direct, unbroken sunlight reaches this space on a clear day?
          </p>
          <div role="group" aria-label="Direct sunlight exposure" className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {sunOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={sunlight === opt.id}
                onClick={() => setSunlight(opt.id)}
                className={`option-tile ${sunlight === opt.id ? 'selected' : ''}`}
              >
                <span className="option-tile-title">{opt.label}</span>
                <span className="option-tile-subtitle">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step E: Gardening Experience */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Sprout size={22} color="var(--color-primary)" />
            <h3>E. Gardening Experience</h3>
          </div>
          <div role="group" aria-label="Gardening experience level" className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {expOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={experience === opt.id}
                onClick={() => setExperience(opt.id)}
                className={`option-tile ${experience === opt.id ? 'selected' : ''}`}
              >
                <span className="option-tile-title">{opt.label}</span>
                <span className="option-tile-subtitle">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step F: Goal */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Target size={22} color="var(--color-terracotta)" />
            <h3>F. What would you love to grow?</h3>
          </div>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Not sure? Select &ldquo;I don't know&rdquo; and we'll pick the most resilient starter crops.
          </p>
          <div role="group" aria-label="Gardening goals" className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {goalOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={goal === opt.id}
                onClick={() => setGoal(opt.id)}
                className={`option-tile ${goal === opt.id ? 'selected' : ''}`}
                style={{ textAlign: 'left', alignItems: 'flex-start', padding: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span className="option-tile-title">{opt.label}</span>
                  {goal === opt.id && <Check size={16} color="var(--color-primary)" />}
                </div>
                <span className="option-tile-subtitle" style={{ marginTop: '0.3rem' }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Validation error */}
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#FFF5F5',
              border: '1px solid #FEB2B2',
              borderRadius: 'var(--radius-md)',
              color: '#C53030',
              fontSize: '0.9rem'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Submit Button */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ minWidth: 260, fontSize: '1.05rem', gap: '0.75rem' }}
          >
            <span>Save Profile &amp; Show My Space</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};
