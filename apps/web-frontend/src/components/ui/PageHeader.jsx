import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AaPageHeader from '../aa/PageHeader';
import {
  PLATFORM_NAV,
  PLATFORM_NAV_GROUPS,
} from '../../features/platform/nav/platformNav';

/**
 * Umumiy PageHeader.
 * Agar platform sahifasida bo'lsa (location /platform bilan boshlansa),
 * avtomatik ravishda aa PageHeader (yo‘l, h1, meta va amallar) render qilinadi.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs: customBreadcrumbs,
  meta: customMeta,
  className,
}) {
  const { t } = useTranslation();

  let location = null;
  try {
    location = useLocation();
  } catch {
    // Router mavjud bo'lmagan muhit (testlar)
  }

  const isPlatform = location?.pathname?.startsWith('/platform');

  if (isPlatform) {
    let breadcrumbs = customBreadcrumbs;
    if (!breadcrumbs || breadcrumbs.length === 0) {
      const navItem = PLATFORM_NAV.find(
        (item) =>
          location.pathname === item.to ||
          location.pathname.startsWith(`${item.to}/`)
      );
      const group = PLATFORM_NAV_GROUPS.find((g) => g.id === navItem?.group);
      const groupLabel = group ? t(group.key) : null;
      const pageLabel = navItem ? t(navItem.key) : null;

      if (groupLabel && pageLabel) {
        breadcrumbs = [{ label: groupLabel }, { label: pageLabel }];
      } else if (pageLabel) {
        breadcrumbs = [{ label: pageLabel }];
      }
    }

    let cleanTitle = title;
    let extractedCount = null;
    if (typeof title === 'string') {
      const match = title.match(/^(.*?)\s*\(([\d\s,]+)\)\s*$/);
      if (match) {
        cleanTitle = match[1].trim();
        extractedCount = match[2].trim();
      }
    }

    const meta =
      customMeta ||
      (extractedCount ? `${extractedCount} ta` : subtitle || null);

    return (
      <AaPageHeader
        breadcrumbs={breadcrumbs}
        title={cleanTitle}
        meta={meta}
        actions={actions}
        className={className}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {title && <h1 className="admin-page-title text-xl">{title}</h1>}
        {subtitle && <p className="admin-page-subtitle text-sm">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
