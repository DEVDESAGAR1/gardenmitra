import { Component, ErrorInfo, ReactNode } from 'react';
import { Sprout, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep errors in development visible to developers while avoiding external data leaks
    console.error(`[GardenMitra ErrorBoundary - ${this.props.sectionName || 'Application'}]`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.state = { hasError: false, error: null };
    this.props.onReset?.();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    this.state = { hasError: false, error: null };
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = 'today';
    }
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isSectional = Boolean(this.props.sectionName);

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="card"
          style={{
            maxWidth: isSectional ? '100%' : 580,
            margin: '2rem auto',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1.5px solid var(--color-primary-border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <Sprout size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
            {isSectional
              ? `A hiccup occurred in ${this.props.sectionName}`
              : 'Take a breath & touch grass 🌱'}
          </h2>

          <p style={{ fontSize: '0.925rem', color: 'var(--color-text-main)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {isSectional
              ? 'This section stumbled, but your real garden and data remain safe.'
              : 'A momentary interface error occurred. Your garden memory, plants, and care logs are completely intact.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRetry}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={15} />
              <span>Try Again</span>
            </button>

            {!isSectional && (
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Home size={15} />
                <span>Return to Today's Garden</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
