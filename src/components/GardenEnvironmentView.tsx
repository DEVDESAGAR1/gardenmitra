import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import {
  EnvironmentalMeasurementType,
  EnvironmentalUnit,
  ObservationSource,
  SensorDeviceType
} from '../types';
import {
  Thermometer,
  Droplets,
  Sun,
  CloudRain,
  Activity,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';

export const GardenEnvironmentView: React.FC = () => {
  const {
    spaces,
    selectedSpace,
    environmentalObservations,
    environmentalSummaries,
    plantEnvironmentalInsights,
    addObservation,
    sensorDevices,
    registerSensorDevice
  } = useGarden();

  // Tab state: 'overview' | 'history' | 'devices'
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'history' | 'devices'>('overview');

  // Manual observation modal state
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [formType, setFormType] = useState<EnvironmentalMeasurementType>('air_temperature');
  const [formValue, setFormValue] = useState<string>('28');
  const [formUnit, setFormUnit] = useState<EnvironmentalUnit>('°C');
  const [formPlantInstanceId, setFormPlantInstanceId] = useState<string>('');
  const [formSource, setFormSource] = useState<ObservationSource>('manual');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Device registration modal state
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<SensorDeviceType>('soil_sensor');
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // History filtering
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');

  // Filter observations for currently selected space
  const currentSpaceObservations = useMemo(() => {
    if (!selectedSpace) return [];
    return environmentalObservations.filter((o) => o.spaceId === selectedSpace.id);
  }, [environmentalObservations, selectedSpace]);

  // Filtered history list
  const filteredHistory = useMemo(() => {
    if (historyTypeFilter === 'all') return currentSpaceObservations;
    return currentSpaceObservations.filter((o) => o.type === historyTypeFilter);
  }, [currentSpaceObservations, historyTypeFilter]);

  // Metric helpers
  const getMeasurementIcon = (type: EnvironmentalMeasurementType) => {
    switch (type) {
      case 'air_temperature':
      case 'soil_temperature':
        return <Thermometer size={18} color="#D97706" />;
      case 'relative_humidity':
      case 'soil_moisture':
        return <Droplets size={18} color="#2563EB" />;
      case 'ambient_light':
        return <Sun size={18} color="#CA8A04" />;
      case 'rainfall':
        return <CloudRain size={18} color="#0284C7" />;
      default:
        return <Activity size={18} color="#16A34A" />;
    }
  };

  const getMeasurementLabel = (type: EnvironmentalMeasurementType): string => {
    switch (type) {
      case 'air_temperature':
        return 'Air Temperature';
      case 'relative_humidity':
        return 'Relative Humidity';
      case 'soil_moisture':
        return 'Soil Moisture';
      case 'ambient_light':
        return 'Ambient Sunlight';
      case 'soil_temperature':
        return 'Soil Temperature';
      case 'rainfall':
        return 'Rainfall';
      default:
        return type;
    }
  };

  // Unit synchronization when type changes in form
  const handleTypeChange = (newType: EnvironmentalMeasurementType) => {
    setFormType(newType);
    if (newType === 'air_temperature' || newType === 'soil_temperature') {
      setFormUnit('°C');
      setFormValue('28');
    } else if (newType === 'relative_humidity' || newType === 'soil_moisture') {
      setFormUnit('%');
      setFormValue('45');
    } else if (newType === 'ambient_light') {
      setFormUnit('lux');
      setFormValue('5000');
    } else if (newType === 'rainfall') {
      setFormUnit('mm');
      setFormValue('0');
    }
  };

  // Handle Manual Observation Submission
  const handleSubmitObservation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setFormSuccessMessage(null);

    if (!selectedSpace) {
      setFormErrors(['Please select an active garden space first.']);
      return;
    }

    const numValue = parseFloat(formValue);
    if (isNaN(numValue)) {
      setFormErrors(['Value must be a valid number.']);
      return;
    }

    const res = addObservation({
      spaceId: selectedSpace.id,
      plantInstanceId: formPlantInstanceId ? formPlantInstanceId : undefined,
      type: formType,
      value: numValue,
      unit: formUnit,
      timestamp: new Date().toISOString(),
      source: formSource,
      notes: formNotes.trim() ? formNotes.trim() : undefined
    });

    if (!res.success) {
      setFormErrors(res.errors || ['Observation failed validation.']);
    } else {
      setFormSuccessMessage('Observation recorded and saved to garden memory!');
      setFormNotes('');
      setTimeout(() => {
        setIsObservationModalOpen(false);
        setFormSuccessMessage(null);
      }, 1200);
    }
  };

  // Handle Device Registration
  const handleRegisterDevice = (e: React.FormEvent) => {
    e.preventDefault();
    setDeviceError(null);

    if (!selectedSpace) {
      setDeviceError('Please select a garden space.');
      return;
    }

    let supported: EnvironmentalMeasurementType[] = ['soil_moisture'];
    if (deviceType === 'weather_station') {
      supported = ['air_temperature', 'relative_humidity', 'rainfall'];
    } else if (deviceType === 'light_meter') {
      supported = ['ambient_light'];
    } else if (deviceType === 'all_in_one') {
      supported = ['air_temperature', 'soil_moisture', 'relative_humidity', 'ambient_light'];
    }

    const res = registerSensorDevice({
      name: deviceName.trim(),
      type: deviceType,
      spaceId: selectedSpace.id,
      supportedTypes: supported,
      status: 'active'
    });

    if (!res.success) {
      setDeviceError(res.error || 'Failed to register device.');
    } else {
      setDeviceName('');
      setIsDeviceModalOpen(false);
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Activity size={24} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--color-primary-dark)' }}>
              Garden Environment
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.925rem' }}>
            Physical garden measurements, sensor integration, and botanical requirement tracking.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {spaces.length > 0 && <SpaceSelector compact={false} />}
          <button
            onClick={() => setIsObservationModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} />
            <span>Record Observation</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`btn btn-sm ${activeSubTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}
        >
          <Activity size={14} style={{ marginRight: '0.35rem' }} />
          Readings & Insights
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`btn btn-sm ${activeSubTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}
        >
          <Calendar size={14} style={{ marginRight: '0.35rem' }} />
          History Log ({currentSpaceObservations.length})
        </button>
        <button
          onClick={() => setActiveSubTab('devices')}
          className={`btn btn-sm ${activeSubTab === 'devices' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}
        >
          <Cpu size={14} style={{ marginRight: '0.35rem' }} />
          Connected Devices ({sensorDevices.filter((d) => d.spaceId === selectedSpace?.id).length})
        </button>
      </div>

      {/* TAB 1: READINGS & BOTANICAL INSIGHTS */}
      {activeSubTab === 'overview' && (
        <div>
          {/* Key Metric Summary Cards */}
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.85rem', color: 'var(--color-primary-dark)' }}>
            Physical Measurements ({selectedSpace?.name || 'Selected Space'})
          </h2>

          {environmentalSummaries.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F9FAF8', marginBottom: '2rem' }}>
              <Thermometer size={36} color="var(--color-text-subtle)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.7 }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                No Physical Environmental Readings Yet
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
                GardenMitra never invents fake sensor readings. Log a quick manual temperature, soil moisture, or sunlight reading to unlock grounded botanical comparisons.
              </p>
              <button
                onClick={() => setIsObservationModalOpen(true)}
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} />
                <span>Log First Observation</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {environmentalSummaries.map((summary) => (
                <div
                  key={summary.type}
                  className="card"
                  style={{
                    padding: '1.15rem',
                    borderLeft: `4px solid ${summary.isStale ? '#9CA3AF' : 'var(--color-primary)'}`,
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getMeasurementIcon(summary.type)}
                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                        {getMeasurementLabel(summary.type)}
                      </span>
                    </div>
                    {summary.isStale ? (
                      <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
                        Stale (&gt;24h)
                      </span>
                    ) : (
                      <span className="badge badge-green" style={{ fontSize: '0.675rem' }}>
                        Recent
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.35rem' }}>
                    {summary.latestValue} {summary.unit}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                    <span>Min: {summary.min} {summary.unit}</span>
                    <span>Avg: {summary.avg} {summary.unit}</span>
                    <span>Max: {summary.max} {summary.unit}</span>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', marginTop: '0.4rem' }}>
                    Recorded: {new Date(summary.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(summary.latestTimestamp).toLocaleDateString()})
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Plant-Specific Environmental Insights */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Sparkles size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--color-primary-dark)' }}>
                Plant Requirement Compatibility & Insights
              </h2>
            </div>

            {plantEnvironmentalInsights.length === 0 ? (
              <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FAFCFA' }}>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No active plants in this space, or add plants from the Plants library to see personalized environmental comparisons.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {plantEnvironmentalInsights.map((insight) => {
                  const isAlert = insight.severity === 'alert';
                  const isWarning = insight.severity === 'warning';
                  const borderCol = isAlert ? '#DC2626' : isWarning ? '#D97706' : 'var(--color-primary)';
                  const bgCol = isAlert ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#F0FDF4';

                  return (
                    <div
                      key={insight.id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        borderLeft: `4px solid ${borderCol}`,
                        backgroundColor: bgCol
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {isAlert ? (
                            <AlertTriangle size={18} color="#DC2626" />
                          ) : isWarning ? (
                            <AlertTriangle size={18} color="#D97706" />
                          ) : (
                            <CheckCircle2 size={18} color="var(--color-primary)" />
                          )}
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#1F2937' }}>
                            {insight.title}
                          </h3>
                        </div>
                        <span
                          className={`badge ${
                            insight.evidenceQuality === 'verified_evidence'
                              ? 'badge-green'
                              : insight.evidenceQuality === 'reviewed_guidance'
                              ? 'badge-gold'
                              : 'badge-neutral'
                          }`}
                          style={{ fontSize: '0.725rem', textTransform: 'capitalize' }}
                        >
                          {insight.evidenceQuality.replace('_', ' ')}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: '#4B5563', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
                        {insight.description}
                      </p>

                      {/* Referenced Botanical Requirement with Provenance */}
                      {insight.referencedRequirement && (
                        <div
                          style={{
                            fontSize: '0.775rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            marginBottom: '0.6rem',
                            color: '#374151'
                          }}
                        >
                          <strong>Documented Botanical Requirement:</strong> {insight.referencedRequirement.requirement}
                          <br />
                          <span style={{ color: 'var(--color-text-subtle)' }}>
                            Source: {insight.referencedRequirement.source}
                          </span>
                        </div>
                      )}

                      {/* Recommended Practical Action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 500, color: '#111827' }}>
                        <Info size={14} color="var(--color-primary)" />
                        <span>Recommended action: {insight.recommendedNextStep}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OBSERVATION HISTORY */}
      {activeSubTab === 'history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--color-primary-dark)' }}>
              Environmental Readings Log
            </h2>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {(['all', 'air_temperature', 'soil_moisture', 'relative_humidity', 'ambient_light', 'rainfall'] as const).map(
                (filterVal) => (
                  <button
                    key={filterVal}
                    onClick={() => setHistoryTypeFilter(filterVal)}
                    className={`btn btn-sm ${historyTypeFilter === filterVal ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', textTransform: 'capitalize' }}
                  >
                    {filterVal.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F9FAF8' }}>
              <Clock size={32} color="var(--color-text-subtle)" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No readings match this filter. Use the "Record Observation" button to log manual or connected sensor measurements.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAF8', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Value</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Source</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Plant / Target</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((obs) => {
                    const plant = selectedSpace?.plants?.find(
                      (p) => p.instanceId === obs.plantInstanceId || p.plantId === obs.plantInstanceId
                    );

                    return (
                      <tr key={obs.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {getMeasurementIcon(obs.type)}
                          <span>{getMeasurementLabel(obs.type)}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                          {obs.value} {obs.unit}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            className={`badge ${
                              obs.source === 'connected_sensor'
                                ? 'badge-green'
                                : obs.source === 'manual'
                                ? 'badge-neutral'
                                : 'badge-gold'
                            }`}
                            style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}
                          >
                            {obs.source.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: plant ? 'var(--color-primary-dark)' : 'var(--color-text-subtle)' }}>
                          {plant ? plant.plant.name : 'Space-wide'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-subtle)' }}>
                          {new Date(obs.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>
                          {obs.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONNECTED DEVICES */}
      {activeSubTab === 'devices' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--color-primary-dark)' }}>
                Registered Environmental Sensors
              </h2>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Hardware abstractions for soil moisture probes, weather stations, and ambient light sensors.
              </p>
            </div>
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} />
              <span>Register Sensor</span>
            </button>
          </div>

          {sensorDevices.filter((d) => d.spaceId === selectedSpace?.id).length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F9FAF8' }}>
              <Cpu size={36} color="var(--color-text-subtle)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--color-text)' }}>
                No Physical Sensor Devices Registered in {selectedSpace?.name}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
                GardenMitra supports pluggable adapters for Bluetooth, Wi-Fi, and manual probes. Register your sensor probe to link automated incoming telemetry.
              </p>
              <button
                onClick={() => setIsDeviceModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={14} />
                <span>Register Hardware Sensor</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {sensorDevices
                .filter((d) => d.spaceId === selectedSpace?.id)
                .map((device) => (
                  <div key={device.id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Cpu size={16} color="var(--color-primary)" />
                        <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 600 }}>{device.name}</h4>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                        {device.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      Type: <strong style={{ textTransform: 'capitalize' }}>{device.type.replace('_', ' ')}</strong>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                      Supported Metrics: {device.supportedTypes.map((t) => t.replace('_', ' ')).join(', ')}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
                      Last seen: {new Date(device.lastSeenAt || device.registeredAt).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Record Manual Observation */}
      {isObservationModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={() => setIsObservationModalOpen(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
              Record Physical Environmental Reading
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Enter real measurements for {selectedSpace?.name || 'this space'}. Data will be validated against physical bounds.
            </p>

            {formErrors.length > 0 && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#991B1B', fontWeight: 600, fontSize: '0.825rem' }}>
                  <AlertTriangle size={15} />
                  <span>Validation Error</span>
                </div>
                <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0, fontSize: '0.8rem', color: '#B91C1C' }}>
                  {formErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {formSuccessMessage && (
              <div
                style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  color: '#166534',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitObservation}>
              {/* Measurement Type */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Measurement Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => handleTypeChange(e.target.value as EnvironmentalMeasurementType)}
                  className="input-select"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="air_temperature">Air Temperature (°C)</option>
                  <option value="soil_moisture">Soil Moisture (%)</option>
                  <option value="relative_humidity">Relative Humidity (%)</option>
                  <option value="ambient_light">Ambient Sunlight (lux / ppfd)</option>
                  <option value="soil_temperature">Soil Temperature (°C)</option>
                  <option value="rainfall">Rainfall (mm)</option>
                </select>
              </div>

              {/* Value and Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="env-form-value" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Measured Value
                  </label>
                  <input
                    id="env-form-value"
                    type="number"
                    step="any"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div>
                  <label htmlFor="env-form-unit" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Unit
                  </label>
                  <select
                    id="env-form-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as EnvironmentalUnit)}
                    className="input-select"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  >
                    {formType === 'air_temperature' || formType === 'soil_temperature' ? (
                      <option value="°C">°C</option>
                    ) : formType === 'relative_humidity' || formType === 'soil_moisture' ? (
                      <option value="%">%</option>
                    ) : formType === 'ambient_light' ? (
                      <>
                        <option value="lux">lux</option>
                        <option value="ppfd">ppfd</option>
                      </>
                    ) : (
                      <option value="mm">mm</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Plant Association (Optional) */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Target Plant (Optional)
                </label>
                <select
                  value={formPlantInstanceId}
                  onChange={(e) => setFormPlantInstanceId(e.target.value)}
                  className="input-select"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="">Space-wide (all plants)</option>
                  {(selectedSpace?.plants || []).map((gp) => (
                    <option key={gp.instanceId || gp.plantId} value={gp.instanceId || gp.plantId}>
                      {gp.plant.name} ({gp.instanceId ? gp.instanceId.slice(-6) : 'Pot'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Data Source
                </label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value as ObservationSource)}
                  className="input-select"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="manual">Manual Observation (User Entry)</option>
                  <option value="connected_sensor">Connected Physical Sensor</option>
                  <option value="simulated">Simulated / Test Data</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="env-form-notes" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Notes (Optional)
                </label>
                <input
                  id="env-form-notes"
                  type="text"
                  placeholder="e.g. Measured on south balcony after noon rain"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsObservationModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register Sensor Device */}
      {isDeviceModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={() => setIsDeviceModalOpen(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
              Register Sensor Hardware Device
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Add a sensor device identity for {selectedSpace?.name}.
            </p>

            {deviceError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  color: '#991B1B',
                  fontSize: '0.8rem'
                }}
              >
                {deviceError}
              </div>
            )}

            <form onSubmit={handleRegisterDevice}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="env-device-name" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Device Name
                </label>
                <input
                  id="env-device-name"
                  type="text"
                  placeholder="e.g. Balcony Soil Moisture Probe 1"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="env-device-category" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Device Category
                </label>
                <select
                  id="env-device-category"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as SensorDeviceType)}
                  className="input-select"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="soil_sensor">Soil Moisture & Temperature Probe</option>
                  <option value="weather_station">Micro Weather Station</option>
                  <option value="light_meter">PAR / Lux Meter</option>
                  <option value="all_in_one">All-in-One Environmental Monitor</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setIsDeviceModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
