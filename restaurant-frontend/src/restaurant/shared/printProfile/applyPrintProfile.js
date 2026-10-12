import { EMPH_LINE_PREFIX, BOLD_LINE_PREFIX } from '../../pos/utils/ticketLayout';
import { factoryPrintProfile, fieldStyle, fontCss } from './printProfileDefaults';

const HEADER_KEYS = new Set(['logo', 'storeName', 'address', 'phone', 'footer']);

/** Guest bill and the fiscal check print a filled header even if that tab's box stayed off. */
export function slipFieldStyle(profile, slipType, key) {
  const style = fieldStyle(profile, slipType, key);
  if (slipType === 'GUEST_BILL' && HEADER_KEYS.has(key) && headerValue(profile, key)) {
    return { ...style, on: true };
  }
  return style;
}

export function headerValue(profile, key) {
  const p = profile || {};
  if (key === 'logo') return String(p.logoDataUrl || '').trim();
  return String(p[key] || '').trim();
}

/**
 * Branding lines (store / address / phone) before meta.
 * Kitchen, cancel and shift still need the checkbox. The bill prints them when filled.
 */
export function brandingLines(profile, slipType) {
  const p = profile || factoryPrintProfile();
  const lines = [];
  const nameStyle = slipFieldStyle(p, slipType, 'storeName');
  const addrStyle = slipFieldStyle(p, slipType, 'address');
  const phoneStyle = slipFieldStyle(p, slipType, 'phone');
  if (nameStyle.on && String(p.storeName || '').trim()) {
    lines.push(styleLine(String(p.storeName).trim(), nameStyle));
  }
  if (addrStyle.on && String(p.address || '').trim()) {
    lines.push(styleLine(String(p.address).trim(), addrStyle));
  }
  if (phoneStyle.on && String(p.phone || '').trim()) {
    lines.push(styleLine(String(p.phone).trim(), phoneStyle));
  }
  return lines;
}

/** Bottom line. Empty text adds nothing. The bill prints a filled footer without the extra checkbox. */
export function footerLines(profile, slipType) {
  const p = profile || factoryPrintProfile();
  const style = slipFieldStyle(p, slipType, 'footer');
  if (!style.on) return [];
  const text = String(p.footer || '').trim();
  if (!text) return [];
  return [styleLine(text, style)];
}

/** Branding above the body, footer under it. Default profile leaves lines as-is. */
export function wrapSlipLines(lines, profile, slipType) {
  const body = Array.isArray(lines) ? lines : [];
  return [...brandingLines(profile, slipType), ...body, ...footerLines(profile, slipType)];
}

export function plainSlipLine(line) {
  const raw = String(line ?? '');
  if (raw.startsWith(EMPH_LINE_PREFIX) || raw.startsWith(BOLD_LINE_PREFIX)) return raw.slice(3);
  return raw;
}

export function styleLine(text, style) {
  const body = String(text ?? '');
  if (!body) return body;
  if (style?.size === 'lg' && style?.bold) return `${EMPH_LINE_PREFIX}${body}`;
  if (style?.size === 'lg') return `${EMPH_LINE_PREFIX}${body}`;
  if (style?.bold) return `${BOLD_LINE_PREFIX}${body}`;
  return body;
}

/** Prefix dish qty-name row according to items field style. */
export function styleDishLine(line, profile, slipType) {
  const style = fieldStyle(profile, slipType, 'items');
  if (!style.on) return null;
  const raw = String(line ?? '');
  if (!raw || raw.startsWith('   ') || raw === '---' || raw.startsWith('≫')) return raw;
  // Already marked by caller — keep.
  if (raw.startsWith(EMPH_LINE_PREFIX) || raw.startsWith(BOLD_LINE_PREFIX)) {
    if (style.size === 'lg' && style.bold) {
      return raw.startsWith(EMPH_LINE_PREFIX) ? raw : `${EMPH_LINE_PREFIX}${stripPrefix(raw)}`;
    }
    if (style.bold) {
      return raw.startsWith(BOLD_LINE_PREFIX) || raw.startsWith(EMPH_LINE_PREFIX)
        ? raw
        : `${BOLD_LINE_PREFIX}${stripPrefix(raw)}`;
    }
    return stripPrefix(raw);
  }
  if (style.size === 'lg') return `${EMPH_LINE_PREFIX}${raw}`;
  if (style.bold) return `${BOLD_LINE_PREFIX}${raw}`;
  return raw;
}

function stripPrefix(line) {
  if (line.startsWith(EMPH_LINE_PREFIX) || line.startsWith(BOLD_LINE_PREFIX)) return line.slice(3);
  return line;
}

export function resolveTicketTitle(title, profile, slipType) {
  const style = fieldStyle(profile, slipType, 'headerTitle');
  if (!style.on) return '';
  return title || '';
}

export function ticketPrintOptions(profile, slipType) {
  const p = profile || factoryPrintProfile();
  const logoStyle = slipFieldStyle(p, slipType, 'logo');
  const headerStyle = fieldStyle(p, slipType, 'headerTitle');
  return {
    fontFamily: fontCss(p.defaultFont),
    logoDataUrl: logoStyle.on ? (p.logoDataUrl || '') : '',
    logoMaxHeightMm: Number(p.logoMaxHeightMm) || 12,
    titleEmph: headerStyle.on && (headerStyle.bold || headerStyle.size === 'lg'),
  };
}

export function filterMetaLines(metaLines, profile, slipType) {
  const lines = Array.isArray(metaLines) ? metaLines : [];
  const out = [];
  lines.forEach((line, index) => {
    const text = String(line || '');
    if (!text) return;
    let key = 'time';
    if (index === 0) key = 'hallTable';
    else if (/официант|waiter/i.test(text)) key = 'waiter';
    const style = fieldStyle(profile, slipType, key);
    if (!style.on) return;
    out.push(styleLine(text, style));
  });
  return out;
}
