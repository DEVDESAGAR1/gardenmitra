// Test environment setup for Vitest
// Provides lightweight mocks for localStorage, document, and window in Node test runner

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    }
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  });
}

if (typeof globalThis.document === 'undefined') {
  const documentMock = {
    createElement: (tag: string) => {
      if (tag === 'video') {
        return {
          preload: '',
          muted: false,
          playsInline: false,
          src: '',
          duration: 0,
          videoWidth: 640,
          videoHeight: 480,
          addEventListener: () => {},
          removeEventListener: () => {},
          load: () => {}
        };
      }
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => null,
          toBlob: (cb: any) => cb(null),
          toDataURL: () => ''
        };
      }
      return {};
    }
  };

  Object.defineProperty(globalThis, 'document', {
    value: documentMock,
    writable: true,
    configurable: true
  });
}

if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    writable: true,
    configurable: true
  });
}

if (typeof (globalThis as any).indexedDB === 'undefined') {
  const dbStore = new Map<string, any>();
  const fakeDb: any = {
    objectStoreNames: { contains: () => true },
    transaction: () => ({
      objectStore: () => ({
        put: (record: any) => {
          const req: any = {};
          setTimeout(() => {
            if ((globalThis as any).__MOCK_QUOTA_EXCEEDED__) {
              const err = new Error('Browser storage quota exceeded');
              err.name = 'QuotaExceededError';
              req.error = err;
              req.onerror?.();
            } else {
              dbStore.set(record.id, record);
              req.onsuccess?.();
            }
          }, 0);
          return req;
        },
        get: (id: string) => {
          const req: any = {};
          setTimeout(() => {
            req.result = dbStore.get(id);
            req.onsuccess?.();
          }, 0);
          return req;
        },
        delete: (id: string) => {
          const req: any = {};
          setTimeout(() => {
            dbStore.delete(id);
            req.onsuccess?.();
          }, 0);
          return req;
        }
      })
    })
  };

  const fakeIndexedDB = {
    open: () => {
      const req: any = {};
      setTimeout(() => {
        req.result = fakeDb;
        req.onsuccess?.();
      }, 0);
      return req;
    }
  };

  Object.defineProperty(globalThis, 'indexedDB', {
    value: fakeIndexedDB,
    writable: true,
    configurable: true
  });
}

if (typeof (globalThis as any).URL.createObjectURL === 'undefined') {
  let counter = 0;
  (globalThis as any).URL.createObjectURL = () => `blob:mock-url-${++counter}`;
  (globalThis as any).URL.revokeObjectURL = () => {};
}

