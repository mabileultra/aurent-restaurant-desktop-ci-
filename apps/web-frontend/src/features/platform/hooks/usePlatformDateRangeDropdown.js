import { useEffect, useState } from 'react';

export function usePlatformDateRangeDropdown({
  isOpen,
  setIsOpen,
  containerRef,
  align,
  from,
  to,
  setDraftFrom,
  setDraftTo,
  setSelectionStep,
  setHoverDate,
  setCursorDate,
}) {
  const [effectiveAlign, setEffectiveAlign] = useState(align);

  useEffect(() => {
    if (isOpen) {
      if (align === 'right') {
        setEffectiveAlign('right');
      } else if (containerRef.current && typeof window !== 'undefined') {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.left + 500 > window.innerWidth - 16) {
          setEffectiveAlign('right');
        } else {
          setEffectiveAlign(align || 'left');
        }
      }
    }
  }, [isOpen, align, containerRef]);

  useEffect(() => {
    if (!isOpen) {
      setDraftFrom(from || '');
      setDraftTo(to || '');
      const initIso = from || to;
      if (initIso && /^\d{4}-\d{2}-\d{2}$/.test(initIso)) {
        const parts = initIso.split('-').map(Number);
        setCursorDate(new Date(parts[0], parts[1] - 1, 1));
      }
    }
  }, [from, to, isOpen, setDraftFrom, setDraftTo, setCursorDate]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleDocumentClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDraftFrom(from || '');
        setDraftTo(to || '');
        setSelectionStep('start');
        setHoverDate('');
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDraftFrom(from || '');
        setDraftTo(to || '');
        setSelectionStep('start');
        setHoverDate('');
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, from, to, containerRef, setDraftFrom, setDraftTo, setSelectionStep, setHoverDate, setIsOpen]);

  return { effectiveAlign };
}
