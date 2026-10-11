import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { secureIds } from '../utils/secureId';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = secureIds.toast();
    const newToast: ToastItem = { id, type, message, duration };

    setToasts((prev) => {
      // Prevent duplicate immediate messages
      if (prev.length > 0 && prev[prev.length - 1].message === message) {
        return prev;
      }
      return [...prev, newToast];
    });

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error', 5000), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning', 4500), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast, success, error, warning, info }),
    [toasts, showToast, dismissToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

const fallbackToast: ToastContextType = {
  toasts: [],
  showToast: (msg: string) => { console.log(`[GardenMitra Toast] ${msg}`); },
  dismissToast: () => {},
  success: (msg: string) => { console.log(`[GardenMitra Toast] Success: ${msg}`); },
  error: (msg: string) => { console.error(`[GardenMitra Toast] Error: ${msg}`); },
  warning: (msg: string) => { console.warn(`[GardenMitra Toast] Warning: ${msg}`); },
  info: (msg: string) => { console.info(`[GardenMitra Toast] Info: ${msg}`); }
};

export const useToast = (): ToastContextType => {
  try {
    const context = useContext(ToastContext);
    if (!context) {
      return fallbackToast;
    }
    return context;
  } catch {
    return fallbackToast;
  }
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const getTypeStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: '#ECFDF5',
          border: '#10B981',
          color: '#065F46',
          icon: <CheckCircle2 size={18} color="#059669" />
        };
      case 'error':
        return {
          bg: '#FEF2F2',
          border: '#EF4444',
          color: '#991B1B',
          icon: <AlertCircle size={18} color="#DC2626" />
        };
      case 'warning':
        return {
          bg: '#FFFBEB',
          border: '#F59E0B',
          color: '#92400E',
          icon: <AlertTriangle size={18} color="#D97706" />
        };
      case 'info':
      default:
        return {
          bg: '#EFF6FF',
          border: '#3B82F6',
          color: '#1E40AF',
          icon: <Info size={18} color="#2563EB" />
        };
    }
  };

  return (
    <aside
      aria-label="Garden notifications"
      className="toast-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
        width: 'calc(100vw - 40px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const style = getTypeStyle(toast.type);
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className="toast-message"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: style.bg,
              borderLeft: `4px solid ${style.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              color: style.color,
              fontSize: '0.9rem',
              fontWeight: 500,
              lineHeight: 1.4,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <span style={{ display: 'flex', flexShrink: 0 }}>{style.icon}</span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: style.color,
                opacity: 0.7,
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
