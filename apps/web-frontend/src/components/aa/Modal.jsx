import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import Button from './Button';

/**
 * Aurent Admin — Modal dialog komponenti.
 * aa-components.css dagi .aa-scrim va .aa-modal sinflaridan foydalanadi.
 */
export default function Modal({
  open = false,
  title,
  onClose,
  primaryAction,
  secondaryAction,
  danger = false,
  children,
  className,
  ...props
}) {
  const modalRef = useRef(null);
  const prevActiveElementRef = useRef(null);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    prevActiveElementRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalRef.current.focus?.();
        }
      }
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (prevActiveElementRef.current?.focus) {
        prevActiveElementRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const generatedTitleId = useId();
  const titleId = title ? generatedTitleId : undefined;

  const renderAction = (action, isPrimary) => {
    if (!action) return null;
    if (React.isValidElement(action)) return action;

    return (
      <Button
        variant={isPrimary ? (danger ? 'danger' : 'primary') : 'secondary'}
        onClick={action.onClick}
        loading={action.loading}
        disabled={action.disabled}
      >
        {action.label}
      </Button>
    );
  };

  const modalContent = (
    <div
      className="aa-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx('aa-modal', className)}
        {...props}
      >
        <div className="aa-modal__head">
          {title ? (
            <h2 id={titleId} className="aa-modal__title">
              {title}
            </h2>
          ) : <span />}
          {onClose ? (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon={<X className="aa-icon" aria-hidden="true" />}
              aria-label="Yopish"
              onClick={onClose}
            />
          ) : null}
        </div>

        <div className="aa-modal__body">{children}</div>

        {primaryAction || secondaryAction ? (
          <div className="aa-modal__foot">
            {renderAction(secondaryAction, false)}
            {renderAction(primaryAction, true)}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
