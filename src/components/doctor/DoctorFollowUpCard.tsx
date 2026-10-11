import React from 'react';
import { Clock } from 'lucide-react';

interface DoctorFollowUpCardProps {
  selectedStatus: 'resolved' | 'improved' | 'no_change' | 'declined' | null;
  onStatusChange: (status: 'resolved' | 'improved' | 'no_change' | 'declined') => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  isSuccess: boolean;
  userVerified: boolean | null;
  onUserVerified: (verified: boolean) => void;
}

export const DoctorFollowUpCard: React.FC<DoctorFollowUpCardProps> = ({
  selectedStatus,
  onStatusChange,
  notes,
  onNotesChange,
  onSubmit,
  isSuccess,
  userVerified,
  onUserVerified
}) => {
  return (
    <div>
      <div
        style={{
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '10px',
          padding: '1.15rem',
          backgroundColor: 'var(--color-bg-base)',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <Clock size={16} color="var(--color-primary)" />
          <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
            Track Recovery Outcome (48–72 Hours Follow-up)
          </strong>
        </div>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Give safe adjustments 2 to 3 days to take effect before changing care again. How is your plant responding?
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
          {[
            { id: 'resolved', label: '🌿 Resolved / Recovered' },
            { id: 'improved', label: '🌱 Showing Improvement' },
            { id: 'no_change', label: '⏱️ No Noticeable Change' },
            { id: 'declined', label: '⚠️ Condition Declined' }
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={selectedStatus === opt.id}
              onClick={() => onStatusChange(opt.id as any)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '16px',
                fontSize: '0.775rem',
                border: selectedStatus === opt.id
                  ? '1px solid var(--color-primary)'
                  : '1px solid var(--color-border-subtle)',
                backgroundColor: selectedStatus === opt.id
                  ? 'var(--color-primary-subtle)'
                  : '#FFFFFF',
                color: selectedStatus === opt.id
                  ? 'var(--color-primary-dark)'
                  : 'var(--color-text-main)',
                cursor: 'pointer',
                fontWeight: selectedStatus === opt.id ? 600 : 400
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            id="followup-notes-input"
            aria-label="Follow-up observation notes"
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Optional notes: e.g. Yellowing stopped on new leaves, soil dry..."
            style={{
              flex: 1,
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-medium)',
              fontSize: '0.8rem'
            }}
          />
          <button
            type="button"
            disabled={!selectedStatus || isSuccess}
            onClick={onSubmit}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.775rem' }}
          >
            {isSuccess ? '✓ Saved to Journal' : 'Save Follow-up'}
          </button>
        </div>
      </div>

      {/* User Verification / Helpfulness Feedback */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          flexWrap: 'wrap'
        }}
      >
        <span>Was this contextual diagnosis clear and actionable?</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onUserVerified(true)}
            className={`btn btn-sm ${userVerified === true ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Yes, helpful
          </button>
          <button
            type="button"
            onClick={() => onUserVerified(false)}
            className={`btn btn-sm ${userVerified === false ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Needs more info
          </button>
        </div>
      </div>
    </div>
  );
};
