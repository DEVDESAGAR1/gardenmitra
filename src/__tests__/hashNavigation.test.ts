import { describe, it, expect } from 'vitest';
import { getTabFromHash, VALID_NAV_TABS, NavigationTab } from '../context/GardenContext';

describe('Milestone 19.2: URL Hash Synchronization & History (FIND-UX-01)', () => {
  it('covers all 14 core navigation destinations in VALID_NAV_TABS', () => {
    const expectedTabs: NavigationTab[] = [
      'home',
      'setup',
      'my_garden',
      'plants',
      'shopping',
      'chat',
      'doctor',
      'today',
      'layout',
      'twin',
      'journal',
      'environment',
      'planner',
      'performance'
    ];

    expectedTabs.forEach((tab) => {
      expect(VALID_NAV_TABS[tab]).toBe(tab);
    });
  });

  it('correctly maps supported hash paths to corresponding activeTab', () => {
    expect(getTabFromHash('#today')).toBe('today');
    expect(getTabFromHash('#/doctor')).toBe('doctor');
    expect(getTabFromHash('#my_garden')).toBe('my_garden');
    expect(getTabFromHash('#twin')).toBe('twin');
    expect(getTabFromHash('#journal')).toBe('journal');
    expect(getTabFromHash('#performance')).toBe('performance');
    expect(getTabFromHash('#environment')).toBe('environment');
  });

  it('handles case insensitivity and extra whitespace in hashes', () => {
    expect(getTabFromHash('  #TODAY  ')).toBe('today');
    expect(getTabFromHash('#Doctor')).toBe('doctor');
  });

  it('falls back safely to home for unknown, malformed, or empty hashes', () => {
    expect(getTabFromHash('')).toBe('home');
    expect(getTabFromHash('#')).toBe('home');
    expect(getTabFromHash('#non_existent_screen_12345')).toBe('home');
    expect(getTabFromHash('#random/nested/path')).toBe('home');
  });
});
