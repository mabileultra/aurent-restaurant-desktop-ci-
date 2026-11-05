import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useUserFormModal } from '../../hooks/useUserFormModal';
import UserCredentialsCreatedModal from './UserCredentialsCreatedModal';
import UserFormModalFields from './UserFormModalFields';
import UserFormDiscardModal from './UserFormDiscardModal';
import { useUserModalFocusTrap } from '../../hooks/user-form/useUserModalFocusTrap';

export default function UserFormModal(props) {
  const p = useUserFormModal(props);
  const modalContainerRef = useRef(null);
  const discardConfirmRef = useRef(null);
  const keepEditingBtnRef = useRef(null);
  const lastActiveElementRef = useRef(null);
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

  useUserModalFocusTrap({
    open: p.open,
    showDiscardConfirm,
    handleSafeClose,
    handleCancelDiscard,
    modalContainerRef,
    discardConfirmRef,
    resetPasswordMode: props.resetPasswordMode,
    editingUser: props.editingUser,
  });

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
            <UserFormDiscardModal
              t={p.t}
              dialogRef={discardConfirmRef}
              keepEditingBtnRef={keepEditingBtnRef}
              onCancel={handleCancelDiscard}
              onConfirm={handleConfirmDiscard}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
