import { useEffect } from 'react';
import clsx from 'clsx';

/**
 * Legacy full-screen dimmer. Closes when the backdrop (not the card) is clicked.
 */
export default function RstOverlay({
  onClose,
  children,
  className = '',
  role = 'dialog',
}) {
  useEffect(() => {
    if (!onClose) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={clsx('rst-modal', className)}
      role={role}
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {children}
    </div>
  );
}
