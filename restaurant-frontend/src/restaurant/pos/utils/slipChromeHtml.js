import {
  brandingLines,
  footerLines,
  plainSlipLine,
  ticketPrintOptions,
} from '../../shared/printProfile/applyPrintProfile';

/** Logo, branding and footer HTML for the browser print fallback. */
export function slipChromeHtml(profile, slipType, escapeHtml) {
  const opts = ticketPrintOptions(profile, slipType);
  const logo = opts.logoDataUrl
    ? `<div style="text-align:center;margin:0 0 8px"><img src="${String(opts.logoDataUrl).replace(/"/g, '')}" alt="" style="max-height:${opts.logoMaxHeightMm}mm;max-width:100%;object-fit:contain"/></div>`
    : '';
  const head = brandingLines(profile, slipType)
    .map((line) => `<p class="rst-ord-print__store">${escapeHtml(plainSlipLine(line))}</p>`)
    .join('');
  const foot = footerLines(profile, slipType)
    .map((line) => `<p class="rst-ord-print__footer">${escapeHtml(plainSlipLine(line))}</p>`)
    .join('');
  return { logo, head, foot, hasFooter: Boolean(foot) };
}
