import React, { useState, Suspense, lazy } from 'react';
import { useGarden } from '../context/GardenContext';
import { Bot, X, Maximize2, Loader2 } from 'lucide-react';

const ChatbotView = lazy(() => import('./ChatbotView').then((m) => ({ default: m.ChatbotView })));

export const FloatingAssistantWidget: React.FC = () => {
  const { activeTab, setActiveTab, chatMessages } = useGarden();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render floating trigger if already on dedicated chat page
  if (activeTab === 'chat') {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <aside aria-label="Garden Assistant Widget">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="floating-assistant-btn"
          aria-label={isOpen ? 'Close GardenMitra Assistant' : 'Open GardenMitra Assistant'}
          aria-expanded={isOpen}
          title="Ask Mitra Assistant"
          style={{
            position: 'fixed',
            bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
            right: '1.25rem',
            zIndex: 48,
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #10B981, #047857)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          {isOpen ? <X size={24} /> : <Bot size={26} />}
          {!isOpen && chatMessages.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: 'var(--color-terracotta)',
                border: '2px solid #fff'
              }}
              aria-label="Active conversation"
            />
          )}
        </button>
      </aside>

      {/* Floating Popover Assistant Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="GardenMitra Quick Assistant"
          className="floating-assistant-panel"
          style={{
            position: 'fixed',
            bottom: 'calc(8.25rem + env(safe-area-inset-bottom, 0px))',
            right: '1.25rem',
            zIndex: 49,
            width: 'min(440px, calc(100vw - 2.5rem))',
            maxHeight: 'min(580px, calc(100vh - 10rem))',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.16)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.2s ease-out'
          }}
        >
          {/* Quick Header */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAFCFA'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={20} color="#047857" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                Ask Mitra Quick Chat
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('chat');
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                title="Expand to Full Screen"
                aria-label="Open Full Chat Screen"
              >
                <Maximize2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem 0.4rem' }}
                aria-label="Close Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem 1rem' }}>
            <Suspense
              fallback={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                  <Loader2 size={20} className="spin-animation" />
                  <span>Loading Mitra Assistant...</span>
                </div>
              }
            >
              <ChatbotView />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
};
