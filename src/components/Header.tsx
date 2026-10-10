import React from 'react';
import { useGarden, NavigationTab } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
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
  BookOpen
} from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, selectedGardenPlants, profile, spaces, setShowTouchGrassModal } = useGarden();

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    { id: 'home', label: 'Home', icon: <Sprout size={18} /> },
    {
      id: 'my_garden',
      label: 'My Garden',
      icon: <LayoutDashboard size={18} />,
      badgeCount: selectedGardenPlants.length > 0 ? selectedGardenPlants.length : undefined
    },
    { id: 'journal', label: 'Journal', icon: <BookOpen size={18} /> },
    { id: 'twin', label: 'Digital Twin', icon: <Box size={18} /> },
    { id: 'layout', label: 'Layout', icon: <Layers size={18} /> },
    { id: 'plants', label: 'Plants', icon: <Compass size={18} /> },
    { id: 'today', label: "Today's Garden", icon: <CheckCircle2 size={18} /> },
    { id: 'shopping', label: 'Shopping', icon: <ShoppingBag size={18} /> },
    { id: 'chat', label: 'Ask Mitra', icon: <MessageSquare size={18} /> },
    { id: 'doctor', label: 'Doctor', icon: <Stethoscope size={18} /> }
  ];

  return (
    <>
      <header className="header-nav">
        <div className="container header-container">
          {/* Brand Logo */}
          <button
            onClick={() => setActiveTab('home')}
            className="brand-logo"
            aria-label="GardenMitra Home"
          >
            <span>GardenMitra</span>
            <span className="brand-badge">Touch Grass 🌱</span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav-links" aria-label="Main Navigation">
            {navItems.map((item) => (
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
                <span>Go Outside 🌿</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="mobile-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
            aria-label={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};
