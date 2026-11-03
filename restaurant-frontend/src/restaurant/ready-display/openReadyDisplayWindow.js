const FEATURES = 'popup=yes,width=1600,height=900';

/** Open kitchen TV board on a second monitor / new window. */
export function openReadyDisplayWindow() {
  const url = `${window.location.origin}/rst/ready-display`;
  const win = window.open(url, 'rst-ready-display', FEATURES);
  if (win) {
    try {
      win.focus();
    } catch {
      /* ignore */
    }
  }
  return win;
}
