import { useLayoutEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function ShelfLabelBarcode({ value, layoutKey = '' }) {
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el || !value?.trim()) return;
    try {
      el.replaceChildren();
      const root = document.documentElement;
      const wMm = parseFloat(root.style.getPropertyValue('--label-paper-w-mm')) || 58;
      const hMm = parseFloat(root.style.getPropertyValue('--label-paper-h-mm')) || 40;
      const scale = parseFloat(root.style.getPropertyValue('--label-font-scale')) || 1;
      const isSmall = wMm <= 43 || hMm <= 30;
      const code = value.replace(/\s/g, '');
      const modules = 11 * code.length + 35;
      const paperPx = (wMm * 96) / 25.4;
      const margin = Math.max(4, Math.round((isSmall ? 4 : 8) * scale));
      const fit = Math.floor(Math.max(40, paperPx - margin * 2) / modules);
      const width = Math.max(1, Math.min(isSmall ? 2 : 3, fit));
      JsBarcode(el, code, {
        format: 'CODE128',
        displayValue: true,
        fontSize: Math.max(10, Math.round((isSmall ? 11 : 16) * scale)),
        fontOptions: 'bold',
        textMargin: 2,
        height: Math.max(36, Math.round((isSmall ? 56 : 84) * scale)),
        margin,
        width,
      });
      el.setAttribute('shape-rendering', 'crispEdges');
    } catch {
      /* ignore */
    }
  }, [value, layoutKey]);

  if (!value?.trim()) return <p className="text-xs text-slate-400">—</p>;
  return <svg ref={svgRef} className="shelflabel-barcode-svg" />;
}
