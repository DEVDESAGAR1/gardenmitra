/**
 * Local Media Storage using IndexedDB (Milestone 8)
 * Local-First, Privacy-Conscious media persistence:
 * - Stores large binary Blobs/Files in IndexedDB to prevent LocalStorage quota exhaustion.
 * - Generates fast lightweight thumbnails for instant UI rendering.
 * - Manages object URLs responsibly and prevents memory leaks.
 * - Zero cloud upload without user awareness and consent.
 */

const DB_NAME = 'gardenmitra_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

export interface StoredBlobRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  savedAt: string;
}

class LocalMediaStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private activeObjectUrls: Set<string> = new Set();

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported in this browser environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(request.error?.message || 'Failed to open GardenMitra media database.'));
      };
    });

    return this.dbPromise;
  }

  /**
   * Save a binary Blob/File to IndexedDB
   */
  async saveMediaBlob(id: string, blob: Blob): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const record: StoredBlobRecord = {
          id,
          blob,
          mimeType: blob.type,
          sizeBytes: blob.size,
          savedAt: new Date().toISOString()
        };

        const putReq = store.put(record);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => {
          if (putReq.error?.name === 'QuotaExceededError') {
            reject(new Error('Browser storage quota exceeded. Please free up space or delete older media.'));
          } else {
            reject(new Error(putReq.error?.message || 'Failed to save media item to local storage.'));
          }
        };
      });
    } catch (err: any) {
      throw new Error(`Local media save failed: ${err.message}`);
    }
  }

  /**
   * Retrieve a Blob by its unique media ID
   */
  async getMediaBlob(id: string): Promise<Blob | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
          const record: StoredBlobRecord | undefined = getReq.result;
          resolve(record ? record.blob : null);
        };

        getReq.onerror = () => {
          reject(new Error(getReq.error?.message || `Failed to read media asset ${id}.`));
        };
      });
    } catch {
      return null;
    }
  }

  /**
   * Delete a single media blob
   */
  async deleteMediaBlob(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const delReq = store.delete(id);

        delReq.onsuccess = () => resolve();
        delReq.onerror = () => reject(new Error(delReq.error?.message || `Failed to delete media ${id}.`));
      });
    } catch {
      // Ignore deletion errors
    }
  }

  /**
   * Delete multiple media blobs (e.g. when clearing a space or session)
   */
  async deleteMediaBlobs(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.deleteMediaBlob(id)));
  }

  /**
   * Create a tracked temporary object URL for preview rendering
   */
  async getMediaObjectUrl(id: string): Promise<string | null> {
    const blob = await this.getMediaBlob(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    this.activeObjectUrls.add(url);
    return url;
  }

  /**
   * Revoke a specific object URL
   */
  revokeObjectUrl(url: string): void {
    if (this.activeObjectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.activeObjectUrls.delete(url);
    }
  }

  /**
   * Clean up all tracked object URLs
   */
  revokeAllObjectUrls(): void {
    this.activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.activeObjectUrls.clear();
  }

  /**
   * Convert a Blob to Base64 data URL
   */
  blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read blob as data URL'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Generate lightweight downscaled image thumbnail (JPEG/WebP) for efficient UI display
   */
  async createThumbnail(imageBlob: Blob, maxDim = 320): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const tempUrl = URL.createObjectURL(imageBlob);

      img.onload = () => {
        URL.revokeObjectURL(tempUrl);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context for thumbnail'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(thumbDataUrl);
        } catch (e: any) {
          reject(e);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        reject(new Error('Failed to load image for thumbnail creation'));
      };

      img.src = tempUrl;
    });
  }
}

export const localMediaStorage = new LocalMediaStorageService();
