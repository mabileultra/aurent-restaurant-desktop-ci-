/** Якоря секций лендинга — единый источник для nav и scroll. */
export const PUBLIC_SITE_SECTIONS = {
  top: 'top',
  audience: 'audience',
  features: 'features',
  equipment: 'equipment',
  pricing: 'pricing',
  about: 'about',
  contacts: 'contacts',
};

export const publicSectionHash = (id) => `#${id}`;

export const publicSectionRoute = (id) => `/${publicSectionHash(id)}`;
