/**
 * Measure live POS grid/list metrics from the same CSS classes the cashier uses
 * (density / container queries), instead of hard-coded breakpoints.
 */
export function measurePosCatalogLayout({ hostEl, viewMode }) {
  const fallback =
    viewMode === 'list'
      ? { columns: 1, rowHeight: 48 }
      : { columns: 1, rowHeight: 64 };

  if (!hostEl || typeof document === 'undefined') return fallback;

  const isList = viewMode === 'list';
  const probe = document.createElement('div');
  probe.className = `${isList ? 'pos-product-list' : 'pos-product-grid'} pos-catalog-virtual__probe`;
  probe.setAttribute('aria-hidden', 'true');

  const sample = isList
    ? '<div class="pos-product-row__main"><span class="pos-product-row__name">Measure</span></div><span class="pos-product-row__price">0</span>'
    : '<span class="pos-product-card__code">SKU</span><span class="pos-product-card__name">Measure row name</span><span class="pos-product-card__price">0</span>';

  for (let i = 0; i < 24; i += 1) {
    const item = document.createElement('button');
    item.type = 'button';
    item.tabIndex = -1;
    item.className = isList ? 'pos-product-row' : 'pos-product-card';
    item.innerHTML = sample;
    probe.appendChild(item);
  }

  hostEl.appendChild(probe);
  try {
    const kids = Array.from(probe.children);
    if (!kids.length) return fallback;

    let columns = 1;
    const top0 = kids[0].offsetTop;
    for (let i = 1; i < kids.length; i += 1) {
      if (kids[i].offsetTop !== top0) break;
      columns += 1;
    }

    const styles = getComputedStyle(probe);
    const gap = Number.parseFloat(styles.rowGap || styles.gap) || (isList ? 3 : 4);
    const firstH = kids[0].getBoundingClientRect().height || fallback.rowHeight;
    // Small pad: long names can still be 1 line taller than the probe sample.
    const rowHeight = Math.max(1, Math.ceil(firstH + gap + 2));

    return { columns: isList ? 1 : Math.max(1, columns), rowHeight };
  } finally {
    probe.remove();
  }
}
