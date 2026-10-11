import React, { useState, useRef, useEffect } from 'react';
import { useGarden, NavigationTab } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import { MobileNavDrawer, DRAWER_NAV_ITEMS } from './MobileNavDrawer';
import {
  Sprout,
  Compass,
  ShoppingBag,
  MessageSquare,
  CheckCircle2,
  Stethoscope,
  Sun,
  LayoutDashboard,
  Layers,
  Box,
  BookOpen,
  Activity,
  CalendarCheck,
  TrendingUp,
  Menu,
  ChevronDown,
  Wrench
} from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, selectedGardenPlants, profile, spaces, setShowTouchGrassModal } = useGarden();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // 4 Primary Desktop Navigation Items
  const primaryDesktopNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    { id: 'today', label: "Today's Garden", icon: <CheckCircle2 size={18} /> },
    {
      id: 'my_garden',
      label: 'My Garden',
      icon: <LayoutDashboard size={18} />,
      badgeCount: selectedGardenPlants.length > 0 ? selectedGardenPlants.length : undefined
    },
    { id: 'planner', label: 'Care Planner', icon: <CalendarCheck size={18} /> },
    { id: 'performance', label: 'Insights', icon: <TrendingUp size={18} /> }
  ];

  // Secondary Tools available in the Tools dropdown
  const toolsNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; description?: string; isFeatured?: boolean }[] = [
    {
      id: 'doctor',
      label: 'Garden Doctor',
      icon: <Stethoscope size={18} />,
      description: 'Plant symptoms & recovery',
      isFeatured: true
    },
    { id: 'plants', label: 'Plants Catalog', icon: <Compass size={18} /> },
    { id: 'journal', label: 'Growth Journal', icon: <BookOpen size={18} /> },
    { id: 'environment', label: 'Environment & Sensors', icon: <Activity size={18} /> },
    { id: 'twin', label: 'Digital Twin Studio', icon: <Box size={18} /> },
    { id: 'layout', label: 'Space Layout Planner', icon: <Layers size={18} /> },
    { id: 'shopping', label: 'Shopping List', icon: <ShoppingBag size={18} /> },
    { id: 'chat', label: 'Ask Mitra Assistant', icon: <MessageSquare size={18} /> },
    { id: 'home', label: 'Getting Started', icon: <Sprout size={18} /> }
  ];

  // Whether active tab is one of the secondary tools
  const isToolsActive = toolsNavItems.some((item) => item.id === activeTab);

  // Close tools dropdown on outside click
  useEffect(() => {
    if (!isToolsOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(target) &&
        toolsButtonRef.current &&
        !toolsButtonRef.current.contains(target)
      ) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isToolsOpen]);

  // Handle keyboard navigation for Tools dropdown
  const handleToolsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsToolsOpen(false);
      toolsButtonRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      if (!isToolsOpen) {
        e.preventDefault();
        setIsToolsOpen(true);
      }
    }
  };

  // 4 Primary Mobile Destinations
  const mobilePrimaryItems: { id: NavigationTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    { id: 'today', label: 'Today', icon: <CheckCircle2 size={20} /> },
    {
      id: 'my_garden',
      label: 'Garden',
      icon: <LayoutDashboard size={20} />,
      badgeCount: selectedGardenPlants.length > 0 ? selectedGardenPlants.length : undefined
    },
    { id: 'planner', label: 'Care', icon: <CalendarCheck size={20} /> },
    { id: 'doctor', label: 'Doctor', icon: <Stethoscope size={20} /> }
  ];

  // Check if active tab is in the "More" drawer list
  const isDrawerTabActive = DRAWER_NAV_ITEMS.some((item) => item.id === activeTab);

  return (
    <>
      <header className="header-nav">
        <div className="container header-container">
          {/* Brand Logo */}
          <button
            onClick={() => setActiveTab('home')}
            className="brand-logo"
            aria-label="GardenMitra Home - Your first garden from zero"
          >
            <span>GardenMitra</span>
            <span className="brand-badge">Touch Grass 🌱</span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav-links" aria-label="Main Navigation">
            {primaryDesktopNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badgeCount !== undefined && (
                  <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                    {item.badgeCount}
                  </span>
                )}
              </button>
            ))}

            {/* Tools Dropdown Trigger & Accessible Menu */}
            <div className="nav-dropdown" style={{ position: 'relative' }}>
              <button
                ref={toolsButtonRef}
                onClick={() => setIsToolsOpen((prev) => !prev)}
                onKeyDown={handleToolsKeyDown}
                className={`nav-link nav-dropdown-toggle ${isToolsActive ? 'active' : ''}`}
                aria-haspopup="menu"
                aria-expanded={isToolsOpen}
                aria-controls="desktop-tools-menu"
                id="tools-menu-button"
                aria-label="Garden Tools Menu"
              >
                <Wrench size={18} />
                <span>Tools</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: isToolsOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                  aria-hidden="true"
                />
              </button>

              {isToolsOpen && (
                <div
                  ref={toolsMenuRef}
                  id="desktop-tools-menu"
                  className="nav-dropdown-menu"
                  role="menu"
                  aria-labelledby="tools-menu-button"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsToolsOpen(false);
                      toolsButtonRef.current?.focus();
                    }
                  }}
                >
                  {toolsNavItems.map((tool, idx) => {
                    const isDoctor = tool.id === 'doctor';
                    const isItemActive = activeTab === tool.id;

                    return (
                      <React.Fragment key={tool.id}>
                        {idx === 1 && <div className="nav-dropdown-divider" role="separator" />}
                        <button
                          role="menuitem"
                          onClick={() => {
                            setActiveTab(tool.id);
                            setIsToolsOpen(false);
                          }}
                          className={`nav-dropdown-item ${
                            isItemActive ? 'active' : ''
                          } ${tool.isFeatured ? 'nav-dropdown-item-featured' : ''}`}
                          aria-current={isItemActive ? 'page' : undefined}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', color: isDoctor ? '#047857' : 'inherit' }}>
                            {tool.icon}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontWeight: isDoctor || isItemActive ? 600 : 500 }}>
                              {tool.label}
                            </span>
                            {tool.description && (
                              <span style={{ fontSize: '0.72rem', opacity: 0.8, color: isDoctor ? '#065f46' : 'var(--color-text-subtle)' }}>
                                {tool.description}
                              </span>
                            )}
                          </div>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Header Action Button & Space Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            {spaces.length > 0 && <SpaceSelector compact={true} />}
            {profile && (
              <button
                onClick={() => {
                  setActiveTab('today');
                  setShowTouchGrassModal(true);
                }}
                className="btn btn-terracotta btn-sm"
                title="Hacktoberfest Week 1: Step outside and touch grass"
                aria-label="Step outside and touch grass"
              >
                <Sun size={15} />
                <span className="hide-on-compact">Go Outside 🌿</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Redesigned Ergonomic Mobile Bottom Tab Navigation (FIND-NAV-01) */}
      <nav className="mobile-nav" aria-label="Mobile Bottom Navigation">
        {mobilePrimaryItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.label} section`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badgeCount !== undefined && (
                <span className="badge badge-green mobile-badge">
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}

        {/* 5th Mobile Destination: "More..." Drawer Trigger */}
        <button
          ref={moreButtonRef}
          onClick={() => setIsDrawerOpen(true)}
          className={`mobile-nav-item ${isDrawerTabActive ? 'active' : ''}`}
          aria-label="Open more garden tools and settings"
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
        >
          <Menu size={20} />
          <span>More</span>
          {isDrawerTabActive && <span className="mobile-active-dot" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile Nav Slide-Over Drawer */}
      <MobileNavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        triggerRef={moreButtonRef}
      />
    </>
  );
};
