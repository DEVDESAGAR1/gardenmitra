import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { SpaceSelector } from './SpaceSelector';
import { ShoppingCategory } from '../types';
import {
  ShoppingBag,
  CheckCircle2,
  Circle,
  HelpCircle,
  Store,
  ArrowRight,
  Sprout,
  Layers
} from 'lucide-react';

export const ShoppingListView: React.FC = () => {
  const {
    shoppingList,
    allShoppingList,
    spaces,
    selectedSpace,
    toggleShoppingItem,
    setActiveTab
  } = useGarden();

  const [filterMode, setFilterMode] = useState<'selected' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ShoppingCategory | 'all'>('all');

  const baseItems = filterMode === 'all' ? allShoppingList : shoppingList;

  const filteredItems = baseItems.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const completedCount = baseItems.filter((i) => i.checked).length;
  const progressPercent = baseItems.length > 0
    ? Math.round((completedCount / baseItems.length) * 100)
    : 0;

  const categoryLabels: Record<ShoppingCategory, string> = {
    container: 'Containers & Saucers',
    plant: 'Seeds & Saplings',
    medium: 'Potting Mix & Soil',
    nutrients: 'Compost & Nutrients',
    tools: 'Garden Tools'
  };

  const filterTabs: { id: ShoppingCategory | 'all'; label: string }[] = [
    { id: 'all', label: `All Items (${baseItems.length})` },
    { id: 'container', label: 'Containers' },
    { id: 'plant', label: 'Seeds/Plants' },
    { id: 'medium', label: 'Growing Medium' },
    { id: 'nutrients', label: 'Nutrients' },
    { id: 'tools', label: 'Tools' }
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Title Header */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <ShoppingBag size={28} color="var(--color-terracotta)" />
          <h1 style={{ fontSize: '1.9rem', color: 'var(--color-primary-dark)', margin: 0 }}>
            Your Garden Shopping List 🛒
          </h1>
        </div>
        <p style={{ margin: 0 }}>
          {baseItems.length > 0
            ? `Generated automatically from your active plant choices. Clear explanations for every item.`
            : 'Generated automatically when you add plants to any growing space.'}
        </p>
      </div>

      {/* Multi-space Toggle Bar */}
      {spaces.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}
            >
              <Layers size={14} />
              <span>All Spaces Combined ({allShoppingList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('selected')}
              className={`btn btn-sm ${filterMode === 'selected' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}
            >
              <span>{selectedSpace?.name || 'Active Space'} Only ({shoppingList.length})</span>
            </button>
          </div>

          <SpaceSelector compact={true} />
        </div>
      )}

      {/* Empty State if no items */}
      {baseItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sprout size={32} />
          </div>
          <h3>No shopping items generated yet</h3>
          <p>
            Choose what you want to grow first. GardenMitra will calculate the exact pot sizes, soil quantity, and seeds you actually need.
          </p>
          <button
            onClick={() => setActiveTab('plants')}
            className="btn btn-primary"
          >
            <span>Browse Recommended Plants</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          {/* Progress Tracker Card */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.75rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                Items Prepared / Acquired
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {completedCount} of {baseItems.length} items ({progressPercent}%)
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: 'var(--color-bg-muted)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-primary)',
                  transition: 'width 0.25s ease'
                }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`btn btn-sm ${selectedCategory === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Shopping Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleShoppingItem(item.id)}
                className="card"
                style={{
                  padding: '1.15rem 1.25rem',
                  cursor: 'pointer',
                  border: item.checked ? '1px solid var(--color-border-subtle)' : '1px solid var(--color-border-medium)',
                  backgroundColor: item.checked ? '#F9FAF9' : '#FFFFFF',
                  opacity: item.checked ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Checkbox Icon */}
                <div style={{ marginTop: 2, flexShrink: 0, color: item.checked ? 'var(--color-primary)' : 'var(--color-border-medium)' }}>
                  {item.checked ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: item.checked ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                        textDecoration: item.checked ? 'line-through' : 'none'
                      }}
                    >
                      {item.name}
                    </span>
                    {item.spaceName && (
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                        📍 {item.spaceName}
                      </span>
                    )}
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {categoryLabels[item.category]}
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      Qty: {item.estimatedQuantity}
                    </span>
                  </div>

                  {/* What is this for? Box */}
                  <div
                    style={{
                      marginTop: '0.4rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                      <HelpCircle size={13} color="var(--color-primary)" />
                      <strong style={{ fontSize: '0.775rem', color: 'var(--color-primary-dark)' }}>
                        What is this for?
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {item.whatIsThisFor}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Honest Future Shopping Provider Banner */}
          <div
            className="touch-grass-strip"
            style={{
              marginTop: '2.5rem',
              backgroundColor: '#FFF8F0',
              borderColor: '#FEEBC8',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Store size={20} color="var(--color-terracotta)" />
              <strong style={{ color: 'var(--color-terracotta)' }}>
                Future Nursery &amp; Online Search
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
              Later, GardenMitra can help you find these exact items online or at nearby local nurseries. For now, take this checklist to your local neighborhood plant shop or garden stall!
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '0.25rem' }}>
              Architecture hook: <code>ShoppingProvider.generateShoppingList()</code> ready for future SerpApi / Local Nursery integrations.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
