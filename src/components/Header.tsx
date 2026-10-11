import React, { useState, useRef } from 'react';
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
  Menu
} from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, selectedGardenPlants, profile, spaces, setShowTouchGrassModal } = useGarden();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // All 13 desktop navigation items
  const desktopNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    { id: 'today', label: "Today's Garden", icon: <CheckCircle2 size={18} /> },
    {
      id: 'my_garden',
      label: 'My Garden',
      icon: <LayoutDashboard size={18} />,
      badgeCount: selectedGardenPlants.length > 0 ? selectedGardenPlants.length : undefined
    },
    { id: 'planner', label: 'Care Planner', icon: <CalendarCheck size={18} /> },
    { id: 'doctor', label: 'Doctor', icon: <Stethoscope size={18} /> },
    { id: 'performance', label: 'Insights & Growth', icon: <TrendingUp size={18} /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen size={18} /> },
    { id: 'environment', label: 'Environment', icon: <Activity size={18} /> },
    { id: 'twin', label: 'Digital Twin', icon: <Box size={18} /> },
    { id: 'layout', label: 'Layout', icon: <Layers size={18} /> },
    { id: 'plants', label: 'Plants', icon: <Compass size={18} /> },
    { id: 'shopping', label: 'Shopping', icon: <ShoppingBag size={18} /> },
    { id: 'chat', label: 'Ask Mitra', icon: <MessageSquare size={18} /> },
    { id: 'home', label: 'Home', icon: <Sprout size={18} /> }
  ];

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
            {desktopNavItems.map((item) => (
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
          </nav>

          {/* Header Action Button & Space Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {spaces.length > 0 && <SpaceSelector compact={true} />}
            {profile && (
              <button
                onClick={() => setShowTouchGrassModal(true)}
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
