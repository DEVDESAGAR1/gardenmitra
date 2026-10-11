import { describe, it, expect } from 'vitest';
import { generateSecureRandomString, generateEntityId, secureIds } from '../utils/secureId';

describe('Phase 10 Remediation: Cryptographically Secure Identifiers (CodeQL Alert #2)', () => {
  it('generates random strings using Web Crypto API', () => {
    const s1 = generateSecureRandomString(8);
    const s2 = generateSecureRandomString(8);
    expect(s1).toBeDefined();
    expect(s2).toBeDefined();
    expect(s1.length).toBe(8);
    expect(s2.length).toBe(8);
    expect(s1).not.toBe(s2);
  });

  it('generates formatted entity IDs preserving legacy GardenMitra prefix formats', () => {
    const sessionId = secureIds.session();
    expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);

    const mediaId = secureIds.media();
    expect(mediaId).toMatch(/^media-\d+-[a-z0-9]+$/);

    const containerId = secureIds.container();
    expect(containerId).toMatch(/^cnt-\d+-[a-z0-9]+$/);

    const placementId = secureIds.placement();
    expect(placementId).toMatch(/^plm-\d+-[a-z0-9]+$/);

    const zoneId = secureIds.zone();
    expect(zoneId).toMatch(/^zone-\d+-[a-z0-9]+$/);

    const spaceZoneId = secureIds.spaceZone();
    expect(spaceZoneId).toMatch(/^sz-\d+-[a-z0-9]+$/);

    const diagTaskId = secureIds.task('diag');
    expect(diagTaskId).toMatch(/^task-diag-\d+-[a-z0-9]+$/);

    const recordId = secureIds.record();
    expect(recordId).toMatch(/^rec-\d+-[a-z0-9]+$/);

    const observationId = secureIds.observation();
    expect(observationId).toMatch(/^obs-\d+-[a-z0-9]+$/);

    const journalId = secureIds.journal();
    expect(journalId).toMatch(/^journal-\d+-[a-z0-9]+$/);

    const envObsId = secureIds.envObs();
    expect(envObsId).toMatch(/^env-obs-\d+-[a-z0-9]+$/);

    const devId = secureIds.device();
    expect(devId).toMatch(/^dev-\d+-[a-z0-9]+$/);

    const waterCareId = secureIds.care('water');
    expect(waterCareId).toMatch(/^care-water-\d+-[a-z0-9]+$/);

    const toastId = secureIds.toast();
    expect(toastId).toMatch(/^toast-\d+-[a-z0-9]+$/);
  });

  it('guarantees uniqueness across 1,000 rapidly generated IDs without collisions', () => {
    const idSet = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      const id = secureIds.container();
      expect(idSet.has(id)).toBe(false);
      idSet.add(id);
    }

    expect(idSet.size).toBe(count);
  });

  it('preserves timestamps within ID for chronological order and backward compatibility', () => {
    const before = Date.now();
    const id = generateEntityId('test', 6);
    const after = Date.now();

    const parts = id.split('-');
    expect(parts[0]).toBe('test');
    const timestamp = parseInt(parts[1], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});
