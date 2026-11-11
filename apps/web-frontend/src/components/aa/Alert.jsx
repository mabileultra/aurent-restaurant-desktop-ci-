import React from 'react';
import clsx from 'clsx';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const TONE_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

/**
 * Aurent Admin — Alert ogohlantirish komponenti.
 * aa-components.css dagi .aa-alert sinflaridan foydalanadi.
 */
export default function Alert({
  tone = 'info',
  title,
  children,
  action,
  className,
  ...props
}) {
  const IconComponent = TONE_ICONS[tone] || Info;
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={clsx('aa-alert', `aa-alert--${tone}`, className)}
      {...props}
    >
      <IconComponent className="aa-icon" aria-hidden="true" />
      <div className="aa-alert__body">
        {title ? <div className="aa-alert__title">{title}</div> : null}
        {children ? <div className="aa-alert__text">{children}</div> : null}
      </div>
      {action ? <div className="ml-auto flex-none">{action}</div> : null}
    </div>
  );
}
