import React, { useEffect, useRef } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';

/**
 * Aurent Admin — Mobil uchun chapdan chiqadigan Super-admin paneli.
 * Ortida aa-scrim, Esc bilan yopiladi, fokus panel ichida qoladi va yopilganda tugmaga qaytadi.
 */
export default function SuperAdminMobileDrawer({
  isOpen,
  onClose,
  triggerRef,
  groupedLinks,
  openGroups,
  toggleGroup,
  location,
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Esc tugmasi bilan yopish
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Fokusni panel ichida ushlab turish (Focus Trap)
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Dastlabki fokus
    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const firstFocusable = drawerRef.current.querySelector('button, a[href]');
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          drawerRef.current.focus();
        }
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      triggerRef?.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 aa-desktop:hidden" role="presentation">
      {/* Scrim foni */}
      <div
        className="fixed inset-0 bg-aa-scrim transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Chapdan chiqadigan sidebar paneli */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menyu"
        tabIndex={-1}
        className="fixed top-0 bottom-0 left-0 z-50 w-[248px] bg-aa-surface shadow-aa-modal flex flex-col outline-none"
      >
        <SuperAdminSidebar
          className="w-full h-full border-r-0 aa-nav--mobile"
          groupedLinks={groupedLinks}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
          location={location}
          onCloseMobileNav={onClose}
          isMobile
        />
      </div>
    </div>
  );
}
