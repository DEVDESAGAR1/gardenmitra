import React, { useEffect, useRef } from 'react';
import { NavigationTab } from '../context/GardenContext';
import {
  X,
  TrendingUp,
  BookOpen,
  Activity,
  Box,
  Layers,
  Compass,
  ShoppingBag,
  MessageSquare,
  Sprout,
  ChevronRight
} from 'lucide-react';

export interface DrawerItem {
  id: NavigationTab;
  label: string;
  category: 'Growth & Insights' | 'Design & Space' | 'Plant Knowledge & Tools';
  description: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

export const DRAWER_NAV_ITEMS: DrawerItem[] = [
  {
    id: 'performance',
    label: 'Insights & Performance',
    category: 'Growth & Insights',
    description: 'Track plant growth rates, milestones, and care completion',
    icon: <TrendingUp size={20} />
  },
  {
    id: 'journal',
    label: 'Growth Journal',
    category: 'Growth & Insights',
    description: 'Chronological timeline of dated photos and observations',
    icon: <BookOpen size={20} />
  },
  {
    id: 'environment',
    label: 'Environment & Sensors',
    category: 'Growth & Insights',
    description: 'Live telemetry, temperature, humidity, and moisture readings',
    icon: <Activity size={20} />
  },
  {
    id: 'twin',
    label: 'Digital Twin Studio',
    category: 'Design & Space',
    description: 'Interactive 2D garden model and automated layout proposals',
    icon: <Box size={20} />
  },
  {
    id: 'layout',
    label: 'Space Layout Planner',
    category: 'Design & Space',
    description: 'Container placement, walking clearance, and companion zoning',
    icon: <Layers size={20} />
  },
  {
    id: 'plants',
    label: 'Plant Library & Matcher',
    category: 'Plant Knowledge & Tools',
    description: 'Explore 104 curated plants with botanical requirements',
    icon: <Compass size={20} />
  },
  {
    id: 'shopping',
    label: 'Shopping Checklist',
    category: 'Plant Knowledge & Tools',
    description: 'Supplies, pots, organic soil, and beginner tools checklist',
    icon: <ShoppingBag size={20} />
  },
  {
    id: 'chat',
    label: 'Ask Mitra Assistant',
    category: 'Plant Knowledge & Tools',
    description: 'Friendly gardening answers tailored to beginner setups',
    icon: <MessageSquare size={20} />
  },
  {
    id: 'home',
    label: 'Welcome & Onboarding',
    category: 'Plant Knowledge & Tools',
    description: 'Return to start, garden setup wizard, and guidance',
    icon: <Sprout size={20} />
  }
];

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  triggerRef
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap and Escape listener
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on mount
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const modal = drawerRef.current;
        if (!modal) return;

        const focusables = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Return focus to trigger button
      triggerRef?.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(DRAWER_NAV_ITEMS.map((item) => item.category)));

  return (
    <div
      className="mobile-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        ref={drawerRef}
        className="mobile-drawer-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🌱</span>
            <h2 id="drawer-title" style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
              All Garden Destinations
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem' }}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Category Groups */}
        <div className="mobile-drawer-body">
          {categories.map((category) => {
            const items = DRAWER_NAV_ITEMS.filter((i) => i.category === category);
            return (
              <div key={category} className="mobile-drawer-group">
                <div className="mobile-drawer-group-title">{category}</div>
                <div className="mobile-drawer-group-list">
                  {items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          onClose();
                        }}
                        className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="mobile-drawer-item-icon">{item.icon}</div>
                        <div className="mobile-drawer-item-text">
                          <div className="mobile-drawer-item-title">
                            {item.label}
                            {item.badgeCount !== undefined && (
                              <span className="badge badge-green" style={{ marginLeft: '0.4rem', fontSize: '0.675rem' }}>
                                {item.badgeCount}
                              </span>
                            )}
                          </div>
                          <div className="mobile-drawer-item-desc">{item.description}</div>
                        </div>
                        <ChevronRight size={16} color="var(--color-text-subtle)" style={{ flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
