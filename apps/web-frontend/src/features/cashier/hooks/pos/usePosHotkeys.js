import { useEffect } from 'react';

export function usePosHotkeys({
  posPane,
  handleGoToRegister,
  handleHoldCart,
  searchInputRef,
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'F2' && !e.repeat) {
        e.preventDefault();
        if (posPane !== 'register') handleGoToRegister();
        queueMicrotask(() => searchInputRef.current?.focus?.());
        return;
      }
      if (e.key !== 'F6' || e.repeat) return;
      e.preventDefault();
      handleHoldCart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleGoToRegister, handleHoldCart, posPane, searchInputRef]);
}
