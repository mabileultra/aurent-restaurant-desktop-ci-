import { useEffect, useLayoutEffect, useState } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const MENU_WIDTH = 210;
const MENU_HEIGHT = 166;
const GAP = 4;

export function usePlatformDesktopRowMenuPosition({
  isOpen,
  triggerRef,
  menuRef,
  onClose,
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    let top = rect.bottom + GAP;
    if (top + MENU_HEIGHT > window.innerHeight - 8) {
      top = Math.max(8, rect.top - MENU_HEIGHT - GAP);
    }

    let left = rect.right - MENU_WIDTH;
    if (left < 8) {
      left = 8;
    } else if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - MENU_WIDTH - 8);
    }

    setPosition({ top, left });
  }, [isOpen]);

  useIsomorphicLayoutEffect(() => {
    if (isOpen && menuRef.current) {
      const firstInteractive = menuRef.current.querySelector('button:not(:disabled)');
      firstInteractive?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      const target = e.target;
      if (
        (menuRef.current && menuRef.current.contains(target)) ||
        (triggerRef.current && triggerRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!menuRef.current) return;
        const buttons = Array.from(menuRef.current.querySelectorAll('button:not(:disabled)'));
        if (!buttons.length) return;
        const currentIndex = buttons.indexOf(document.activeElement);
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex >= 0 && currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        }
        buttons[nextIndex]?.focus();
      }
    };

    const handleScrollOrResize = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  return { position, MENU_WIDTH };
}
