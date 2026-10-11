import { useEffect, useRef } from 'react';

export interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  lockScroll?: boolean;
}

export const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
].join(', ');

/**
 * Handles Tab trapping and Escape closing for modal containers.
 * Returns true if keydown was intercepted and handled.
 */
export function handleTrapKeyDown(
  event: KeyboardEvent,
  container: HTMLElement | null,
  onClose?: () => void
): boolean {
  if (event.key === 'Escape' && onClose) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (typeof event.preventDefault === 'function') event.preventDefault();
    onClose();
    return true;
  }

  if (event.key === 'Tab' && container) {
    const rawFocusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    const focusables = Array.from(rawFocusables).filter(el => {
      if (typeof el.hasAttribute === 'function' && el.getAttribute('tabindex') === '-1') return false;
      return true;
    });

    if (focusables.length === 0) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      return true;
    }

    const firstElement = focusables[0];
    const lastElement = focusables[focusables.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        lastElement.focus?.();
        return true;
      }
    } else {
      if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        firstElement.focus?.();
        return true;
      }
    }
  }

  return false;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions
) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const { isOpen, onClose, initialFocusRef, lockScroll = true } = options;

  useEffect(() => {
    if (!isOpen) return;
    if (typeof document === 'undefined') return;

    // Save previous active element for restoring focus on close
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Handle scroll lock
    const originalOverflow = document.body ? document.body.style.overflow : '';
    if (lockScroll && document.body) {
      document.body.style.overflow = 'hidden';
    }

    // Set initial focus
    const frame = requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          if (!containerRef.current.hasAttribute('tabindex')) {
            containerRef.current.setAttribute('tabindex', '-1');
          }
          containerRef.current.focus();
        }
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      handleTrapKeyDown(event, containerRef.current, onClose);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);

      if (lockScroll && document.body) {
        document.body.style.overflow = originalOverflow;
      }

      // Restore focus to original active element
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef, lockScroll]);

  return containerRef;
}
