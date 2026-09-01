/** Контакты в шапке (статика; позже — из support API). */
export const PUBLIC_SITE_PHONE = '+998 90 454 44 43';
export const PUBLIC_SITE_PHONE_HREF = 'tel:+998904544443';
export const PUBLIC_SITE_EMAIL = 'info@aurent.uz';
export const PUBLIC_SITE_EMAIL_HREF = 'mailto:info@aurent.uz';

/** Запасное фото, если основное не загрузилось (проверено — 200). */
export const PUBLIC_IMAGE_FALLBACK_ID = 'photo-1441986300917-64674bd600d8';

const u = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export function unsplashMedia(photoId, alt, widths = [640, 960, 1200]) {
  const w = widths[widths.length - 1] ?? 1200;
  return {
    image: u(photoId, w),
    srcSet: widths.map((width) => `${u(photoId, width)} ${width}w`).join(', '),
    alt,
    photoId,
  };
}

/** Hero: магазин + аптека — не только ресторан. */
export const PUBLIC_HERO_MEDIA = {
  ...unsplashMedia('photo-1441986300917-64674bd600d8', 'Retail POS in store', [640, 960, 1200]),
  tablet: u('photo-1441986300917-64674bd600d8', 1200),
  phone: u('photo-1576091160399-112ba8d25d1d', 800),
};

export const PUBLIC_TERMINAL_MEDIA = unsplashMedia(
  'photo-1556742049-0cfed4f6a45d',
  'POS terminal at checkout',
  [640, 800, 1000],
);

export const PUBLIC_FEATURE_MEDIA = {
  customer: unsplashMedia('photo-1441986300917-64674bd600d8', 'Retail checkout', [640, 800]),
  kitchen: unsplashMedia('photo-1517248135467-4c7edcad34c4', 'Restaurant service', [640, 800]),
  assembly: unsplashMedia('photo-1576091160399-112ba8d25d1d', 'Pharmacy counter', [640, 800]),
};

export const PUBLIC_CONTROL_PANEL_MEDIA = unsplashMedia(
  'photo-1551288049-bebda4e38f71',
  'Analytics dashboard',
  [640, 1000, 1200],
);

export const PUBLIC_ABOUT_MEDIA = unsplashMedia(
  'photo-1558618666-fcd25c85cd64',
  'Retail team at work',
  [640, 800, 1000],
);

export const PUBLIC_CONTACTS_MEDIA = unsplashMedia(
  'photo-1556742049-0cfed4f6a45d',
  'Manager with POS tablet',
  [640, 800, 1000],
);

export const PUBLIC_AUDIENCE_ITEMS = [
  { id: 'restaurant', ...unsplashMedia('photo-1517248135467-4c7edcad34c4', 'Restaurant', [480, 640]) },
  { id: 'cafe', ...unsplashMedia('photo-1472851294608-062f824d29cc', 'Cafe', [480, 640]) },
  { id: 'retail', ...unsplashMedia('photo-1441986300917-64674bd600d8', 'Retail store', [480, 640]) },
  { id: 'pharmacy', ...unsplashMedia('photo-1576091160399-112ba8d25d1d', 'Pharmacy', [480, 640]) },
  { id: 'fastfood', ...unsplashMedia('photo-1568901346375-23c9450c58cd', 'Fast food', [480, 640]) },
  { id: 'market', ...unsplashMedia('photo-1578662996442-48f60103fc96', 'Supermarket', [480, 640]) },
];

export const PUBLIC_INCLUDED_FEATURES = [
  { id: 'support', icon: 'headphones' },
  { id: 'cloud', icon: 'cloud' },
  { id: 'backup', icon: 'database' },
  { id: 'updates', icon: 'refresh' },
];

export const PUBLIC_PRICING_PLANS = ['start', 'business', 'enterprise'];

export function publicImageFallback(w = 800) {
  return u(PUBLIC_IMAGE_FALLBACK_ID, w);
}
