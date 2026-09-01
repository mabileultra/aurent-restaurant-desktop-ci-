/** Контакты в шапке (статика; позже — из support API). */
export const PUBLIC_SITE_PHONE = '+998 71 200 00 00';
export const PUBLIC_SITE_PHONE_HREF = 'tel:+998712000000';
export const PUBLIC_SITE_EMAIL = 'info@aurent.uz';

const u = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PUBLIC_HERO_MEDIA = {
  device: u('photo-1556742049-0cfed4f6a45d', 900),
  alt: 'POS terminal',
};

export const PUBLIC_TERMINAL_MEDIA = {
  image: u('photo-1556745757-edd496ffb356', 800),
  alt: 'Tablet POS',
};

export const PUBLIC_FEATURE_MEDIA = {
  customer: {
    image: u('photo-1509042239860-f550ce710b93', 800),
    alt: 'Customer display',
  },
  kitchen: {
    image: u('photo-1556910103-1c02745aae4d', 800),
    alt: 'Kitchen display',
  },
  assembly: {
    image: u('photo-1565299624946-b28f40a0ae38', 800),
    alt: 'Order assembly',
  },
};

export const PUBLIC_CONTROL_PANEL_MEDIA = {
  image: u('photo-1551288049-bebda4e38f71', 1000),
  alt: 'Analytics dashboard',
};

export const PUBLIC_ABOUT_MEDIA = {
  image: u('photo-1555396273-367ea4eb4db5', 800),
  alt: 'Restaurant team',
};

export const PUBLIC_CONTACTS_MEDIA = {
  image: u('photo-1554118811-1e0d58220f6d', 800),
  alt: 'Cafe staff with tablet',
};

export const PUBLIC_AUDIENCE_ITEMS = [
  { id: 'restaurant', image: u('photo-1517248135467-4c7edcad34c4', 640) },
  { id: 'cafe', image: u('photo-1554118811-1e0d58220f6d', 640) },
  { id: 'retail', image: u('photo-1441986300917-64674bd600d8', 640) },
  { id: 'pharmacy', image: u('photo-1576091160399-112ba8d25d1d', 640) },
  { id: 'fastfood', image: u('photo-1568901346375-23c9450c58cd', 640) },
  { id: 'market', image: u('photo-1604719313586-42c3d393a679', 640) },
];

export const PUBLIC_EQUIPMENT_ITEMS = [
  { id: 'scale', image: u('photo-1581092160562-40aa08e78837', 640) },
  { id: 'pos', image: u('photo-1556745757-edd496ffb356', 640) },
  { id: 'scanner', image: u('photo-1566576912321-d58ddd7a6088', 640) },
  { id: 'printer', image: u('photo-1612815154859-82b0659d4a5c', 640) },
  { id: 'drawer', image: u('photo-1601597111158-2fceff292db2', 640) },
  { id: 'router', image: u('photo-1558494949-ef010cbdcc31', 640) },
];

export const PUBLIC_INCLUDED_FEATURES = [
  { id: 'support', icon: 'headphones' },
  { id: 'cloud', icon: 'cloud' },
  { id: 'backup', icon: 'database' },
  { id: 'updates', icon: 'refresh' },
];

export const PUBLIC_PRICING_PLANS = ['start', 'business', 'enterprise'];
