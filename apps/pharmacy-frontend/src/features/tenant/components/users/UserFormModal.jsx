import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useUserFormModal } from '../../hooks/useUserFormModal';
import UserCredentialsCreatedModal from './UserCredentialsCreatedModal';
import UserFormModalFields from './UserFormModalFields';

export default function UserFormModal(props) {
  const p = useUserFormModal(props);
  const modalContainerRef = useRef(null);
  const discardConfirmRef = useRef(null);
  const keepEditingBtnRef = useRef(null);
  const lastActiveElementRef = useRef(null);
  const wasOpenRef = useRef(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleSafeClose = () => {
    if (p.isDirty) {
      lastActiveElementRef.current = document.activeElement;
      setShowDiscardConfirm(true);
      return;
    }
    p.onClose?.();
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    p.onClose?.();
  };

  const handleCancelDiscard = () => {
    setShowDiscardConfirm(false);
    setTimeout(() => {
      lastActiveElementRef.current?.focus?.();
    }, 20);
  };

  useEffect(() => {
    if (showDiscardConfirm) {
      keepEditingBtnRef.current?.focus?.();
      const raf = requestAnimationFrame(() => {
        keepEditingBtnRef.current?.focus?.();
      });
      const timer = setTimeout(() => {
        keepEditingBtnRef.current?.focus?.();
      }, 30);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [showDiscardConfirm]);

  useEffect(() => {
    if (p.open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      const timer = setTimeout(() => {
        if (modalContainerRef.current) {
          const formEl = modalContainerRef.current.querySelector('form');
          const firstField = formEl?.querySelector(
            'button.base-select__trigger:not([disabled]), input:not([type="hidden"]):not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), textarea:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"])'
          );
          firstField?.focus?.();
        }
      }, 60);
      return () => clearTimeout(timer);
    }
    if (!p.open) {
      wasOpenRef.current = false;
      setShowDiscardConfirm(false);
    }
    return undefined;
  }, [p.open]);

  useEffect(() => {
    if (!p.open) return undefined;

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
  }, [p.open, showDiscardConfirm, p.isDirty, p.onClose]);

  if (!p.open && !p.createdCredentials) return null;

  const renderPortal = (content) => {
    if (typeof document !== 'undefined' && document.body) {
      return createPortal(content, document.body);
    }
    return content;
  };

  if (p.open && p.isEdit && !p.user?.id) {
    return renderPortal(
      <div className="ui-modal-overlay z-[1000]">
        <div className="ui-modal-panel max-w-xs p-6 text-sm font-medium text-ink-muted">
          {p.t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <>
      <UserCredentialsCreatedModal
        credentials={p.createdCredentials}
        t={p.t}
        onClose={p.dismissCredentials}
      />
      {p.open ? renderPortal(
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-form-modal-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/45 transition-opacity"
            onClick={handleSafeClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            ref={modalContainerRef}
            inert={showDiscardConfirm ? '' : undefined}
            aria-hidden={showDiscardConfirm ? 'true' : undefined}
            className="ui-modal-panel relative max-w-2xl max-h-[92vh]"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-6 py-4">
              <div>
                <h2 id="user-form-modal-title" className="text-base sm:text-lg font-semibold text-ink">
                  {p.isEdit ? p.t('users.editUser') : p.t('users.newUser')}
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  {p.isEdit
                    ? p.t('users.editUserDesc', { defaultValue: 'Foydalanuvchi ma\'lumotlari va huquqlarini yangilash' })
                    : p.t('users.newUserDesc', { defaultValue: 'Kassa yoki boshqaruv uchun yangi xodim qo\'shish' })}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSafeClose}
                className="ui-icon-btn"
                aria-label={p.t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form & Fields */}
            <UserFormModalFields {...p} onClose={handleSafeClose} />
          </div>

          {/* Unsaved Changes Confirmation Dialog */}
          {showDiscardConfirm ? (
            <div
              className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-ink/50"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="discard-confirm-title"
              aria-describedby="discard-confirm-desc"
            >
              <div
                ref={discardConfirmRef}
                className="ui-modal-panel max-w-sm p-6 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-input bg-warning-soft text-warning shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 id="discard-confirm-title" className="text-base font-semibold text-ink">
                      {p.t('users.discardChangesTitle', { defaultValue: 'O‘zgarishlar saqlanmadi' })}
                    </h3>
                    <p id="discard-confirm-desc" className="text-xs text-ink-muted mt-1">
                      {p.t('users.discardChangesDesc', { defaultValue: 'Kiritilgan barcha ma’lumotlar yo‘qoladi. Rostdan ham chiqishni xohlaysizmi?' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    ref={keepEditingBtnRef}
                    type="button"
                    onClick={handleCancelDiscard}
                    className="ui-btn-secondary h-9 px-3.5 text-xs"
                  >
                    {p.t('users.discardChangesKeepEditing', { defaultValue: 'Tahrirlashda qolish' })}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDiscard}
                    className="ui-btn-danger-solid h-9 px-3.5 text-xs"
                  >
                    {p.t('users.discardChangesDiscard', { defaultValue: 'O‘zgarishlarni bekor qilish' })}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
