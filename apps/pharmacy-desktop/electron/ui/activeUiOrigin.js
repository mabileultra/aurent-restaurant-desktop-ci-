/** Origin, с которого сейчас открыто окно кассы (сайт или локальный сервер). */

let activeUiOrigin = '';

function setActiveUiOrigin(origin) {
  activeUiOrigin = String(origin || '').replace(/\/$/, '');
}

function getActiveUiOrigin() {
  return activeUiOrigin;
}

function cashierUrlForUi(cfg) {
  if (getActiveUiOrigin()) return getActiveUiOrigin();
  const world = String(cfg?.appWorld || '').toLowerCase();
  if (world === 'restaurant' || world === 'rst') {
    return String(cfg?.restaurantUrl || cfg?.cashierUrl || '').replace(/\/$/, '');
  }
  return String(cfg?.cashierUrl || '').replace(/\/$/, '');
}

module.exports = {
  setActiveUiOrigin,
  getActiveUiOrigin,
  cashierUrlForUi,
};
