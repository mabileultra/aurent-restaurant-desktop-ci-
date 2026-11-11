import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button, PageHeader } from '../../components/aa';
import UiKitButtonsBadgesSection from './ui-kit/UiKitButtonsBadgesSection';
import UiKitFormsSection from './ui-kit/UiKitFormsSection';
import UiKitDataSection from './ui-kit/UiKitDataSection';
import UiKitFeedbackNavSection from './ui-kit/UiKitFeedbackNavSection';

/**
 * Aurent Admin — UI-Kit ko‘rgazma sahifasi (/platform/ui-kit).
 * Faqat DEV rejimida ulanadi. Barcha 17 ta yangi komponentning barcha
 * variantlari, o‘lchamlari va holatlarini yorug‘/tungi temada ko‘rsatadi.
 */
export default function PlatformUiKitPage() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <div className="aa-app min-h-screen bg-aa-canvas text-aa-ink p-4 sm:p-6 md:p-8 space-y-8 max-w-aa-content mx-auto">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform', to: '/platform' },
          { label: 'UI-Kit ko‘rgazmasi' },
        ]}
        title="Aurent Admin UI-Kit"
        meta={(
          <span className="text-aa-ink-muted text-sm font-medium">
            17 ta yangi dizayn tizimi komponenti · React 18 · Tailwind aaTheme
          </span>
        )}
        actions={(
          <Button
            variant="secondary"
            onClick={toggleTheme}
            icon={isDark ? <Sun className="aa-icon text-amber-500" /> : <Moon className="aa-icon text-blue-500" />}
          >
            {isDark ? 'Yorug‘ tema' : 'Tungi tema'}
          </Button>
        )}
      />

      <div className="p-4 rounded-aa-lg border border-aa-line bg-aa-surface text-sm text-aa-ink-muted">
        Ushbu sahifa Aurent Admin yangi dizayn tizimining 2-bosqich UI komponentlarini tekshirish uchun maxsus yaratilgan.
        Har bir komponent faqat <code className="aa-id text-aa-brand font-semibold">aa-components.css</code> sinflaridan
        foydalanadi va ichida inline rang yoki o‘lcham yozilmagan.
      </div>

      <UiKitButtonsBadgesSection />
      <UiKitFormsSection />
      <UiKitDataSection />
      <UiKitFeedbackNavSection />
    </div>
  );
}
