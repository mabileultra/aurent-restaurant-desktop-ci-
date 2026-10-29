const FEATURES = 'popup=yes,noopener,noreferrer,width=1280,height=800';

/** Open guest display on a second monitor / new window. */
export function openCustomerDisplayWindow() {
  const url = `${window.location.origin}/rst/customer-display`;
  const win = window.open(url, 'rst-customer-display', FEATURES);
  if (win) {
    try {
      win.focus();
    } catch {
      /* ignore */
    }
  }
  return win;
}
