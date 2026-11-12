import { useState, useEffect, useCallback } from 'react';

/**
 * useSelectPosition — Select ro‘yxat panelining koordinatalarini hisoblash hooki.
 * Trigger ostida yoki tepasida ochilishini dinamik aniqlaydi.
 */
export function useSelectPosition(triggerRef, isOpen) {
  const [position, setPosition] = useState({
    top: undefined,
    bottom: undefined,
    left: 0,
    width: 200,
    maxHeight: 320,
    placement: 'bottom',
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !isOpen) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const width = Math.max(rect.width, 200);
    // Ekrandan o‘ngga yoki chapga chiqib ketmasligi uchun
    const left = Math.min(Math.max(8, rect.left), Math.max(8, viewportWidth - width - 8));

    const spaceBelow = viewportHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;

    const prefersUpward = spaceBelow < 200 && spaceAbove > spaceBelow;

    if (prefersUpward) {
      const maxHeight = Math.max(120, Math.min(360, spaceAbove - 8));
      setPosition({
        top: undefined,
        bottom: viewportHeight - rect.top + 4,
        left,
        width,
        maxHeight,
        placement: 'top',
      });
    } else {
      const maxHeight = Math.max(120, Math.min(360, spaceBelow - 8));
      setPosition({
        top: rect.bottom + 4,
        bottom: undefined,
        left,
        width,
        maxHeight,
        placement: 'bottom',
      });
    }
  }, [triggerRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    // capture: true scroll hodisasini modal yoki boshqa konteynerlardan ham ushlaydi
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  return position;
}
