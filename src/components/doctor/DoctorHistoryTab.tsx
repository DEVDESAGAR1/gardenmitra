import React from 'react';
import { History } from 'lucide-react';
import { DiagnosisRecord } from '../../types';

interface DoctorHistoryTabProps {
  diagnosisHistory: DiagnosisRecord[];
  onSelectRecord: (record: DiagnosisRecord) => void;
}

export const DoctorHistoryTab: React.FC<DoctorHistoryTabProps> = ({
  diagnosisHistory,
  onSelectRecord
}) => {
  return (
    <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Saved Diagnosis Records</h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Integrated with Garden Journal
        </span>
      </div>

      {diagnosisHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
          <History size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 500 }}>No plant diagnoses recorded yet.</p>
          <p style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
            Run an evidence-based check from the New Diagnosis tab to log symptoms and track recovery.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {diagnosisHistory.map((rec) => {
            const rep = rec.report;
            const topCause = rep.rankedCauses[0];
            return (
              <div
                key={rec.id}
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '10px',
                  padding: '1.15rem',
                  backgroundColor: 'var(--color-bg-base)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                      {rep.plantName}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        fontWeight: 600,
                        backgroundColor:
                          rep.overallEvidenceStrength === 'likely'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : rep.overallEvidenceStrength === 'possible'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(100, 116, 139, 0.15)',
                        color:
                          rep.overallEvidenceStrength === 'likely'
                            ? '#065F46'
                            : rep.overallEvidenceStrength === 'possible'
                            ? '#92400E'
                            : '#334155'
                      }}
                    >
                      {rep.overallEvidenceStrength.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {new Date(rec.createdAt).toLocaleDateString()} {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                  <strong>Primary Symptom:</strong> {rep.symptoms.primarySymptom.replace(/_/g, ' ')}
                  {topCause && ` • Primary finding: ${topCause.title}`}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>
                    Follow-up outcome:{' '}
                    <strong>
                      {rec.followUpStatus
                        ? rec.followUpStatus.toUpperCase()
                        : 'Pending (reassess after 48h)'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectRecord(rec)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                  >
                    Inspect Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
