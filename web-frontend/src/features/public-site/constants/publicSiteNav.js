import { PUBLIC_SITE_SECTIONS, publicSectionRoute } from './publicSiteSections';

export const PUBLIC_SITE_NAV = [
  { to: publicSectionRoute(PUBLIC_SITE_SECTIONS.top), key: 'publicSite.nav.home', hash: true },
  { to: publicSectionRoute(PUBLIC_SITE_SECTIONS.audience), key: 'publicSite.nav.audience', hash: true },
  { to: publicSectionRoute(PUBLIC_SITE_SECTIONS.features), key: 'publicSite.nav.features', hash: true },
  { to: publicSectionRoute(PUBLIC_SITE_SECTIONS.equipment), key: 'publicSite.nav.equipment', hash: true },
  { to: publicSectionRoute(PUBLIC_SITE_SECTIONS.pricing), key: 'publicSite.nav.pricing', hash: true },
  { to: publicSectionRoute(PUBLIC_SITE_SECTIONS.about), key: 'publicSite.nav.about', hash: true },
  { to: publicSectionRoute(PUBLIC_SITE_SECTIONS.contacts), key: 'publicSite.nav.contacts', hash: true },
  { to: '/install', key: 'publicSite.nav.download' },
];

export const PUBLIC_LEAD_TYPES = ['DEMO', 'CONNECT', 'QUESTION', 'EQUIPMENT'];

export const PUBLIC_LEAD_SOURCES = ['contacts', 'hero', 'pricing', 'equipment'];
