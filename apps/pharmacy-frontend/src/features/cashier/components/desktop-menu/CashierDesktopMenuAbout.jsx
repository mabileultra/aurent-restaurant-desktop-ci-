import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { AboutAppModal } from '@aurent/shared-ui';

/**
 * Меню аптечной кассы: кнопка «О программе» и модальное окно.
 * Работает как в десктоп-кассе, так и в браузере.
 */
export default function CashierDesktopMenuAbout({
  t,
  onCloseMenu,
  appName = 'Aurent Dorixona',
}) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    onCloseMenu?.();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className="cashier-desktop-menu__item"
        role="menuitem"
        onClick={handleClick}
      >
        <Info size={15} strokeWidth={2} aria-hidden />
        <span>{t('desktop.aboutApp', { defaultValue: 'Dastur haqida' })}</span>
      </button>

      <AboutAppModal
        open={open}
        onClose={() => setOpen(false)}
        appName={appName}
        t={t}
      />
    </>
  );
}
