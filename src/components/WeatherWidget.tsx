import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert,
  Info,
  CheckCircle2,
  Navigation,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';

const POPULAR_CITIES = [
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'London',
  'Seattle'
];

export const WeatherWidget: React.FC = () => {
  const {
    environmentalContext,
    environmentalAdvice,
    garden,
    gardenLocation,
    weatherMode,
    setWeatherMode,
    requestCurrentLocation,
    setManualLocation,
    clearLocation,
    refreshWeather
  } = useGarden();

  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [manualCityInput, setManualCityInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!garden) return null;

  const snapshot = environmentalContext?.snapshot;

  const handleUseLocation = async () => {
    setIsLocating(true);
    setFeedbackMessage(null);
    try {
      const res = await requestCurrentLocation();
      setFeedbackMessage(res.message);
      if (res.success) {
        await refreshWeather(true);
      }
    } catch {
      setFeedbackMessage('Failed to acquire browser location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWeather(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCityInput.trim()) return;
    await setManualLocation(manualCityInput.trim());
    setManualCityInput('');
    setFeedbackMessage(`Location set to ${manualCityInput.trim()}`);
    await refreshWeather(true);
  };

  const handleQuickCitySelect = async (city: string) => {
    await setManualLocation(city);
    setFeedbackMessage(`Location set to ${city}`);
    await refreshWeather(true);
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'rain':
        return { bg: '#EBF8FF', text: '#2B6CB0', border: '#BEE3F8' };
      case 'heat':
        return { bg: '#FFF5F5', text: '#C53030', border: '#FEB2B2' };
      case 'wind':
        return { bg: '#FEFCBF', text: '#975A16', border: '#FAF089' };
      default:
        return {
          bg: 'var(--color-primary-subtle)',
          text: 'var(--color-primary-dark)',
          border: 'var(--color-primary-border)'
        };
    }
  };

  const badgeStyle = environmentalAdvice ? getActionBadgeColor(environmentalAdvice.actionType) : null;

  // Render weather source badge
  const renderSourceBadge = () => {
    if (!environmentalContext) {
      return (
        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
          No weather data
        </span>
      );
    }

    if (environmentalContext.isUnavailable || environmentalContext.source === 'unavailable') {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#FFF5F5',
            color: '#C53030',
            border: '1px solid #FEB2B2',
            fontSize: '0.72rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <AlertCircle size={12} />
          Unavailable
        </span>
      );
    }

    if (environmentalContext.isStale || environmentalContext.source === 'stale') {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#FFFAF0',
            color: '#DD6B20',
            border: '1px solid #FBD38D',
            fontSize: '0.72rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
          title="Network unreachable. Displaying cached weather."
        >
          <Info size={12} />
          Cached (Offline)
        </span>
      );
    }

    if (environmentalContext.isCached || environmentalContext.source === 'cached') {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#E6FFFA',
            color: '#234E52',
            border: '1px solid #B2F5EA',
            fontSize: '0.72rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
          title="Recently cached from Open-Meteo"
        >
          <CheckCircle2 size={12} />
          Cached live data
        </span>
      );
    }

    if (environmentalContext.isLive || environmentalContext.source === 'open_meteo_live') {
      return (
        <span
          className="badge badge-green"
          style={{
            fontSize: '0.72rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
          title="Direct live metrics from Open-Meteo"
        >
          <CheckCircle2 size={12} />
          Live Open-Meteo
        </span>
      );
    }

    return (
      <span
        className="badge badge-neutral"
        style={{
          fontSize: '0.72rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}
        title="Simulated weather for development & testing"
      >
        <Info size={12} />
        Demo simulated
      </span>
    );
  };

  const displayName =
    gardenLocation?.displayName ||
    garden.location.displayName ||
    garden.location.city ||
    'Unconfigured Location';

  const hasCoords =
    typeof garden.location.latitude === 'number' && typeof garden.location.longitude === 'number';

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--color-border-subtle)',
        marginBottom: '1.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Header with Title, Source Badge, and Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CloudSun size={22} color="var(--color-primary)" />
          <div>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--color-primary-dark)' }}>
              Environmental Intelligence
            </h3>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-text-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <MapPin size={12} />
              {displayName} {hasCoords && `(${garden.location.latitude?.toFixed(2)}°, ${garden.location.longitude?.toFixed(2)}°)`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {renderSourceBadge()}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
            title="Refresh current forecast"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.78rem',
              backgroundColor: showSettings ? 'var(--color-primary-subtle)' : undefined
            }}
            title="Configure location and data source"
          >
            <SlidersHorizontal size={13} />
            <span>Location</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            marginBottom: '0.85rem',
            backgroundColor: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--color-primary-dark)'
          }}
        >
          {feedbackMessage}
        </div>
      )}

      {/* Expandable Location & Weather Settings Drawer */}
      {showSettings && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem'
          }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Configure Garden Location
            </span>
            <p style={{ margin: '0.2rem 0 0.6rem 0', fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
              Exact coordinates help GardenMitra accurately calculate real solar trajectories and hyper-local rain forecasts. Location is stored locally on your device only.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <button
              onClick={handleUseLocation}
              disabled={isLocating}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              <Navigation size={13} />
              <span>{isLocating ? 'Detecting Location...' : 'Use My Device Location'}</span>
            </button>

            <button
              onClick={() => {
                clearLocation();
                setFeedbackMessage('Location reset.');
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}
              title="Clear saved coordinates"
            >
              <Trash2 size={13} />
              <span>Clear Location</span>
            </button>
          </div>

          {/* Quick city select */}
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block', marginBottom: '0.35rem' }}>
              Or choose your nearest city:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleQuickCitySelect(c)}
                  aria-pressed={displayName.toLowerCase().includes(c.toLowerCase())}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor:
                      displayName.toLowerCase().includes(c.toLowerCase()) ? 'var(--color-primary-subtle)' : undefined
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Manual city entry */}
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <input
              id="weather-custom-city"
              aria-label="Enter custom city name"
              type="text"
              value={manualCityInput}
              onChange={(e) => setManualCityInput(e.target.value)}
              placeholder="Enter custom city..."
              style={{
                flex: 1,
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)'
              }}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
              Save City
            </button>
          </form>

          {/* Weather data mode switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.6rem',
              borderTop: '1px solid var(--color-border-subtle)',
              fontSize: '0.78rem'
            }}
          >
            <span style={{ color: 'var(--color-text-subtle)' }}>Data Source Mode:</span>
            <div role="group" aria-label="Weather data source mode" style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setWeatherMode('live')}
                aria-pressed={weatherMode === 'live'}
                className={`btn btn-sm ${weatherMode === 'live' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
              >
                Live Open-Meteo
              </button>
              <button
                type="button"
                onClick={() => setWeatherMode('mock')}
                aria-pressed={weatherMode === 'mock'}
                className={`btn btn-sm ${weatherMode === 'mock' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
              >
                Local Mock (Dev)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unavailable state honest card */}
      {environmentalContext?.isUnavailable ? (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#FFF5F5',
            border: '1px solid #FEB2B2',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div>
            <strong style={{ color: '#C53030', display: 'block', fontSize: '0.9rem' }}>
              Real weather currently unreachable
            </strong>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
              {environmentalContext.errorMessage || 'Please check your network connection or try again shortly.'}
            </p>
          </div>
          <button onClick={handleRefresh} className="btn btn-secondary btn-sm">
            Retry Live
          </button>
        </div>
      ) : snapshot ? (
        <>
          {/* Snapshot Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}
          >
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--color-bg-base)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-subtle)',
                  marginBottom: '0.2rem'
                }}
              >
                <Thermometer size={14} color="var(--color-terracotta)" />
                <span>Temperature</span>
              </div>
              <strong style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>
                {snapshot.temperatureC}°C
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                {snapshot.minTemperatureC}° / {snapshot.maxTemperatureC}°C
              </span>
            </div>

            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--color-bg-base)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-subtle)',
                  marginBottom: '0.2rem'
                }}
              >
                <Droplets size={14} color="#3182CE" />
                <span>Rain &amp; Moisture</span>
              </div>
              <strong style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>
                {snapshot.precipitationProbabilityPercent}%
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                {snapshot.humidityPercent}% humidity ({snapshot.rainfallMm}mm rain)
              </span>
            </div>

            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--color-bg-base)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-subtle)',
                  marginBottom: '0.2rem'
                }}
              >
                <Wind size={14} color="var(--color-primary)" />
                <span>Wind Speed</span>
              </div>
              <strong style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>
                {snapshot.windSpeedKmh} km/h
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                {snapshot.conditionText}
              </span>
            </div>
          </div>

          {/* 3-Day Forecast mini strip if available */}
          {environmentalContext.forecast?.daily && environmentalContext.forecast.daily.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              {environmentalContext.forecast.daily.slice(0, 3).map((day, idx) => (
                <div
                  key={day.date || idx}
                  style={{
                    padding: '0.5rem 0.65rem',
                    backgroundColor: 'var(--color-bg-base)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.75rem'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--color-text-subtle)',
                      marginBottom: '0.2rem'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{idx === 0 ? 'Today' : `Day +${idx}`}</span>
                    <Calendar size={11} />
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {day.minTempC}° - {day.maxTempC}°C
                  </div>
                  <div style={{ color: '#3182CE', fontSize: '0.72rem' }}>
                    {day.precipitationProbPercent}% rain
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* Environmental Advice Banner */}
      {environmentalAdvice && badgeStyle && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: badgeStyle.bg,
            border: `1px solid ${badgeStyle.border}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem'
          }}
        >
          <div style={{ color: badgeStyle.text, marginTop: 2, flexShrink: 0 }}>
            {environmentalAdvice.actionType === 'normal' ? (
              <CheckCircle2 size={18} />
            ) : (
              <ShieldAlert size={18} />
            )}
          </div>
          <div>
            <strong
              style={{
                fontSize: '0.85rem',
                color: badgeStyle.text,
                display: 'block',
                marginBottom: '0.15rem'
              }}
            >
              {environmentalAdvice.headline}
            </strong>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-main)' }}>
              {environmentalAdvice.advice}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
