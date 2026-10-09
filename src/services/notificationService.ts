/**
 * Browser Notification Service for GardenMitra (Milestone 3)
 * Follows strict notification safety:
 * - Only requested upon explicit user interaction (never on page load)
 * - Safe de-duplication to prevent notification spam
 * - Graceful fallback if unsupported or denied
 */

const STORAGE_KEY_NOTIFIED = 'gardenmitra_notified_keys_v1';

export type NotificationPermissionStatus = 'unsupported' | 'default' | 'granted' | 'denied';

export class NotificationService {
  private sentKeys: Set<string>;

  constructor() {
    this.sentKeys = this.loadSentKeys();
  }

  private loadSentKeys(): Set<string> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFIED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch {
      // ignore
    }
    return new Set();
  }

  private persistSentKeys() {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(Array.from(this.sentKeys)));
    } catch {
      // ignore
    }
  }

  /**
   * Check browser notification permission status safely
   */
  getPermissionStatus(): NotificationPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionStatus;
  }

  /**
   * Explicitly ask user permission.
   * Must ONLY be triggered from a user gesture (e.g. clicking 'Enable Garden Reminders')
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      return result as NotificationPermissionStatus;
    } catch {
      return 'denied';
    }
  }

  /**
   * Send a garden care reminder notification with strict de-duplication.
   * Returns true if notification was shown, false otherwise.
   */
  sendCareReminder(options: {
    key: string;
    title: string;
    body: string;
    icon?: string;
  }): boolean {
    const status = this.getPermissionStatus();
    if (status !== 'granted') {
      return false;
    }

    // Safety: Prevent spamming notification for the same plant/task key today
    const datePrefix = new Date().toISOString().split('T')[0];
    const fullKey = `${datePrefix}:${options.key}`;

    if (this.sentKeys.has(fullKey)) {
      return false; // Already notified today
    }

    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.key // ensures browser replaces existing notifications with same tag
      });

      this.sentKeys.add(fullKey);
      this.persistSentKeys();
      return true;
    } catch (e) {
      console.warn('Failed to display browser notification:', e);
      return false;
    }
  }

  /**
   * Check if a specific reminder key was already sent today
   */
  isAlreadyNotified(key: string): boolean {
    const datePrefix = new Date().toISOString().split('T')[0];
    return this.sentKeys.has(`${datePrefix}:${key}`);
  }

  /**
   * Reset sent keys (for testing / reset)
   */
  resetSentKeys() {
    this.sentKeys.clear();
    try {
      localStorage.removeItem(STORAGE_KEY_NOTIFIED);
    } catch {
      // ignore
    }
  }
}

export const notificationService = new NotificationService();
