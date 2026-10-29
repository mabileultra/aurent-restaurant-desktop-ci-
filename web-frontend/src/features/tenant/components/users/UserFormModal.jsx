import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useUserFormModal } from '../../hooks/useUserFormModal';
import UserCredentialsCreatedModal from './UserCredentialsCreatedModal';
import UserFormModalFields from './UserFormModalFields';

export default function UserFormModal(props) {
  const p = useUserFormModal(props);
  const modalContainerRef = useRef(null);

  const handleSafeClose = () => {
    if (p.isDirty) {
      const confirmed = window.confirm(
        p.t('users.unsavedChangesConfirm', {
          defaultValue: 'Kiritilgan ma\'lumotlar saqlanmadi. Oynani yopishni xohlaysizmi?',
        })
      );
      if (!confirmed) return;
    }
    p.onClose?.();
  };

  useEffect(() => {
    if (!p.open) return undefined;

    // Focus first interactive input inside modal
    const timer = setTimeout(() => {
      if (modalContainerRef.current) {
        const firstInput = modalContainerRef.current.querySelector(
          'input:not([type="hidden"]):not([tabindex="-1"]), select, button[type="button"]'
        );
        firstInput?.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const openDropdown = document.querySelector('[role="listbox"], [data-popover-open="true"]');
        if (openDropdown) return;
        handleSafeClose();
      } else if (e.key === 'Tab') {
        if (!modalContainerRef.current) return;
        const focusableElements = modalContainerRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, [p.open, p.isDirty, p.onClose]);

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
        </div>
      ) : null}
    </>
  );
}
