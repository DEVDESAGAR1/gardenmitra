import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTrapKeyDown, FOCUSABLE_SELECTORS } from '../hooks/useFocusTrap';

describe('Milestone 19.2: Accessible Modal Focus Management (FIND-A11Y-01)', () => {
  let mockContainer: any;
  let btnFirst: any;
  let btnLast: any;

  beforeEach(() => {
    btnFirst = {
      focus: vi.fn(),
      getAttribute: (attr: string) => (attr === 'tabindex' ? '0' : null),
      hasAttribute: () => false
    };

    btnLast = {
      focus: vi.fn(),
      getAttribute: (attr: string) => (attr === 'tabindex' ? '0' : null),
      hasAttribute: () => false
    };

    mockContainer = {
      querySelectorAll: () => [btnFirst, btnLast],
      contains: (el: any) => el === btnFirst || el === btnLast
    };
  });

  it('contains comprehensive interactive selectors for focus trapping', () => {
    expect(FOCUSABLE_SELECTORS).toContain('button:not([disabled])');
    expect(FOCUSABLE_SELECTORS).toContain('input:not([disabled])');
    expect(FOCUSABLE_SELECTORS).toContain('select:not([disabled])');
    expect(FOCUSABLE_SELECTORS).toContain('textarea:not([disabled])');
    expect(FOCUSABLE_SELECTORS).toContain('a[href]');
    expect(FOCUSABLE_SELECTORS).toContain('[tabindex]:not([tabindex="-1"])');
  });

  it('calls onClose and prevents default when Escape is pressed', () => {
    const onClose = vi.fn();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    const event = {
      key: 'Escape',
      preventDefault,
      stopPropagation
    } as any;

    const handled = handleTrapKeyDown(event, mockContainer, onClose);

    expect(handled).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('does nothing when Escape is pressed but onClose is not provided', () => {
    const preventDefault = vi.fn();
    const event = { key: 'Escape', preventDefault } as any;

    const handled = handleTrapKeyDown(event, mockContainer, undefined);
    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('cycles focus to first element when Tab is pressed on last element', () => {
    // Current active element is btnLast
    Object.defineProperty(document, 'activeElement', {
      value: btnLast,
      configurable: true
    });

    const preventDefault = vi.fn();
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault
    } as any;

    const handled = handleTrapKeyDown(event, mockContainer);

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(btnFirst.focus).toHaveBeenCalledTimes(1);
    expect(btnLast.focus).not.toHaveBeenCalled();
  });

  it('cycles focus to last element when Shift+Tab is pressed on first element', () => {
    // Current active element is btnFirst
    Object.defineProperty(document, 'activeElement', {
      value: btnFirst,
      configurable: true
    });

    const preventDefault = vi.fn();
    const event = {
      key: 'Tab',
      shiftKey: true,
      preventDefault
    } as any;

    const handled = handleTrapKeyDown(event, mockContainer);

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(btnLast.focus).toHaveBeenCalledTimes(1);
    expect(btnFirst.focus).not.toHaveBeenCalled();
  });

  it('cycles focus to first element when focus has escaped outside container', () => {
    const outsideElement = { focus: vi.fn() };
    Object.defineProperty(document, 'activeElement', {
      value: outsideElement,
      configurable: true
    });

    const preventDefault = vi.fn();
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault
    } as any;

    const handled = handleTrapKeyDown(event, mockContainer);

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(btnFirst.focus).toHaveBeenCalledTimes(1);
  });

  it('prevents default Tab when container has no focusable elements', () => {
    const emptyContainer = {
      querySelectorAll: () => [],
      contains: () => false
    } as any;

    const preventDefault = vi.fn();
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault
    } as any;

    const handled = handleTrapKeyDown(event, emptyContainer);

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('ignores other keys like ArrowDown, Enter, or Space', () => {
    const preventDefault = vi.fn();
    const event = {
      key: 'Enter',
      preventDefault
    } as any;

    const handled = handleTrapKeyDown(event, mockContainer);
    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
