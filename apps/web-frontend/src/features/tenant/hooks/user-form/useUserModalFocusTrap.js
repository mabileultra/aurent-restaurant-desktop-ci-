import { useEffect, useRef } from 'react';

/**
 * useUserModalFocusTrap
 * Handles initial auto-focusing (including reset password mode) and keyboard accessibility (Tab focus trap & Escape).
 */
export function useUserModalFocusTrap({
  open,
  showDiscardConfirm,
  handleSafeClose,
  handleCancelDiscard,
  modalContainerRef,
  discardConfirmRef,
  resetPasswordMode,
  editingUser,
}) {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      const timer = setTimeout(() => {
        if (modalContainerRef.current) {
          const isResetMode = resetPasswordMode || editingUser?.resetPasswordMode;
          if (isResetMode) {
            const credField = modalContainerRef.current.querySelector('#user-password, #user-pin');
            if (credField) {
              credField.focus?.();
              credField.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
              return;
            }
          }
          const formEl = modalContainerRef.current.querySelector('form');
          const firstField = formEl?.querySelector(
            'button.base-select__trigger:not([disabled]), input:not([type="hidden"]):not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), textarea:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"])'
          );
          firstField?.focus?.();
        }
      }, 60);
      return () => clearTimeout(timer);
    }
    if (!open) {
      wasOpenRef.current = false;
    }
    return undefined;
  }, [open, resetPasswordMode, editingUser, modalContainerRef]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (e) => {
      if (showDiscardConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          handleCancelDiscard();
          return;
        }
        if (e.key === 'Tab') {
          if (!discardConfirmRef.current) return;
          const focusables = Array.from(
            discardConfirmRef.current.querySelectorAll(
              'button:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"])'
            )
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !discardConfirmRef.current.contains(document.activeElement)) {
              e.preventDefault();
              e.stopPropagation();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !discardConfirmRef.current.contains(document.activeElement)) {
              e.preventDefault();
              e.stopPropagation();
              first.focus();
            }
          }
        }
        return;
      }

      if (e.key === 'Escape') {
        const openDropdown = document.querySelector('[role="listbox"], [data-popover-open="true"]');
        if (openDropdown) return;
        handleSafeClose();
      } else if (e.key === 'Tab') {
        if (!modalContainerRef.current) return;
        const focusableElements = Array.from(
          modalContainerRef.current.querySelectorAll(
            'button:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), [href]:not([aria-hidden="true"]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"]):not([tabindex="-1"]), select:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), textarea:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
          )
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !modalContainerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            e.stopPropagation();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalContainerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            e.stopPropagation();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, showDiscardConfirm, handleCancelDiscard, handleSafeClose, modalContainerRef, discardConfirmRef]);
}
