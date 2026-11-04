export function scrollAnalyticsBlock(node) {
  if (!node) return;
  const anchor = node.closest('.ta-section') || node.parentElement;
  const scroller = node.closest('.admin-main') || node.closest('.overflow-y-auto');
  if (!anchor || !scroller) return;
  if (anchor === scroller) {
    scroller.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }
  const top = anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  scroller.scrollTo({ top: Math.max(0, top - 12), behavior: 'auto' });
}
