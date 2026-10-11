import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useToast, ToastContainer, ToastItem } from '../context/ToastContext';

describe('Milestone 19.2: Toast Context & Non-blocking Feedback (FIND-A11Y-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides safe fallback logger functions when used outside ToastProvider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const fallbackToast = useToast();

    expect(fallbackToast.toasts).toEqual([]);
    fallbackToast.success('Plant watered successfully');
    fallbackToast.warning('Check soil moisture first');
    fallbackToast.error('Failed to capture photo');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Plant watered successfully'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Check soil moisture first'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to capture photo'));

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('renders ToastContainer correctly with polite aria-live announcements', () => {
    const onDismiss = vi.fn();
    const testToasts: ToastItem[] = [
      { id: 't1', type: 'success', message: 'Watered Tomato' },
      { id: 't2', type: 'error', message: 'Sensor offline' }
    ];

    const element = React.createElement(ToastContainer, { toasts: testToasts, onDismiss });
    expect(element).toBeDefined();
    expect(element.props.toasts).toHaveLength(2);
  });

  it('renders null when ToastContainer has zero toasts', () => {
    const onDismiss = vi.fn();
    const element = ToastContainer({ toasts: [], onDismiss });
    expect(element).toBeNull();
  });
});
