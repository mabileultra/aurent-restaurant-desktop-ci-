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
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleSafeClose = () => {
    if (p.isDirty) {
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
  };

  useEffect(() => {
    if (showDiscardConfirm) {
      keepEditingBtnRef.current?.focus();
      const raf = requestAnimationFrame(() => {
        keepEditingBtnRef.current?.focus();
      });
      const timer = setTimeout(() => {
        keepEditingBtnRef.current?.focus();
      }, 30);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [showDiscardConfirm]);

  useEffect(() => {
    if (!p.open) {
      setShowDiscardConfirm(false);
      return undefined;
    }
    if (showDiscardConfirm) {
      return undefined;
    }

    // Focus first interactive form field only when modal is open and not showing discard confirm
    const timer = setTimeout(() => {
      if (modalContainerRef.current && !showDiscardConfirm) {
        const formEl = modalContainerRef.current.querySelector('form');
        const firstField = formEl?.querySelector(
          'button.base-select__trigger:not([disabled]), input:not([type="hidden"]):not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), textarea:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"])'
        );
        firstField?.focus();
      }
    }, 60);

    const handleKeyDown = (e) => {
      if (showDiscardConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowDiscardConfirm(false);
          return;
        }
        if (e.key === 'Tab') {
          if (!discardConfirmRef.current) return;
          const focusables = discardConfirmRef.current.querySelectorAll(
            'button:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !discardConfirmRef.current.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !discardConfirmRef.current.contains(document.activeElement)) {
              e.preventDefault();
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
        const focusableElements = modalContainerRef.current.querySelectorAll(
          'button:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), [href]:not([aria-hidden="true"]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"]):not([tabindex="-1"]), select:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), textarea:not([disabled]):not([aria-hidden="true"]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [p.open, p.isDirty, p.onClose, showDiscardConfirm]);

  if (!p.open && !p.createdCredentials) return null;

  const renderPortal = (content) => {
    if (typeof document !== 'undefined' && document.body) {
      return createPortal(content, document.body);
    }
    return content;
  };

  if (p.open && p.isEdit && !p.user?.id) {
    return renderPortal(
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-slate-600 shadow-xl dark:bg-slate-900 dark:text-slate-300">
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
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
            onClick={handleSafeClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            ref={modalContainerRef}
            inert={showDiscardConfirm ? '' : undefined}
            aria-hidden={showDiscardConfirm ? 'true' : undefined}
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <h2 id="user-form-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {p.isEdit ? p.t('users.editUser') : p.t('users.newUser')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {p.isEdit
                    ? p.t('users.editUserDesc', { defaultValue: 'Foydalanuvchi ma\'lumotlari va huquqlarini yangilash' })
                    : p.t('users.newUserDesc', { defaultValue: 'Kassa yoki boshqaruv uchun yangi xodim qo\'shish' })}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSafeClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                aria-label={p.t('common.close')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form & Fields */}
            <UserFormModalFields {...p} onClose={handleSafeClose} />
          </div>

          {/* Unsaved Changes Confirmation Dialog */}
          {showDiscardConfirm ? (
            <div
              className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="discard-confirm-title"
              aria-describedby="discard-confirm-desc"
            >
              <div
                ref={discardConfirmRef}
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 id="discard-confirm-title" className="text-base font-bold text-slate-900 dark:text-white">
                      {p.t('users.discardChangesTitle', { defaultValue: 'O‘zgarishlar saqlanmadi' })}
                    </h3>
                    <p id="discard-confirm-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {p.t('users.discardChangesDesc', { defaultValue: 'Kiritilgan barcha ma’lumotlar yo‘qoladi. Rostdan ham chiqishni xohlaysizmi?' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    ref={keepEditingBtnRef}
                    type="button"
                    onClick={handleCancelDiscard}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {p.t('users.discardChangesKeepEditing', { defaultValue: 'Tahrirlashda qolish' })}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDiscard}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors cursor-pointer"
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
