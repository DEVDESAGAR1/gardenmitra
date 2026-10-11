import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

describe('Milestone 19.2: React Error Boundary (FIND-REL-01)', () => {
  if (!window.location) {
    (window as any).location = { hash: '' };
  }
  it('updates state to hasError: true when getDerivedStateFromError is triggered', () => {
    const error = new Error('Test canvas render crash');
    const state = ErrorBoundary.getDerivedStateFromError(error);

    expect(state.hasError).toBe(true);
    expect(state.error).toBe(error);
  });

  it('componentDidCatch logs error safely with section name', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boundary = new ErrorBoundary({
      children: React.createElement('div', null, 'content'),
      sectionName: 'Digital Twin Canvas'
    });

    const error = new Error('Out of bounds error');
    const errorInfo: React.ErrorInfo = { componentStack: 'at DigitalTwinCanvas\nat App' };

    boundary.componentDidCatch(error, errorInfo);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[GardenMitra ErrorBoundary - Digital Twin Canvas]'),
      error,
      errorInfo
    );
    consoleSpy.mockRestore();
  });

  it('handleRetry resets hasError and calls onReset callback', () => {
    const onReset = vi.fn();
    const boundary = new ErrorBoundary({
      children: React.createElement('div', null, 'content'),
      onReset
    });

    boundary.state = { hasError: true, error: new Error('Simulated crash') };
    boundary.setState = vi.fn((newState: any) => {
      boundary.state = { ...boundary.state, ...newState };
    });

    // Simulate clicking retry
    (boundary as any).handleRetry();

    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBe(null);
    expect(boundary.setState).toHaveBeenCalledWith({ hasError: false, error: null });
    expect(onReset).toHaveBeenCalled();
  });

  it('handleGoHome resets error state and directs location to today hash', () => {
    const onReset = vi.fn();
    const boundary = new ErrorBoundary({
      children: React.createElement('div', null, 'content'),
      onReset
    });

    boundary.state = { hasError: true, error: new Error('Simulated crash') };
    boundary.setState = vi.fn((newState: any) => {
      boundary.state = { ...boundary.state, ...newState };
    });

    boundary.state = { hasError: true, error: new Error('Fatal error') };

    (boundary as any).handleGoHome();

    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBe(null);
    expect(window.location.hash).toContain('today');
    expect(onReset).toHaveBeenCalled();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = React.createElement('div', { id: 'custom-error' }, 'Custom Error Message');
    const boundary = new ErrorBoundary({
      children: React.createElement('div', null, 'content'),
      fallback: customFallback
    });

    boundary.state = { hasError: true, error: new Error('Error') };
    const rendered = boundary.render();

    expect(rendered).toBe(customFallback);
  });
});
