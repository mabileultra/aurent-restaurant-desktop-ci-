/** Origin, с которого сейчас открыто окно кассы (сайт или локальный сервер). */

let activeUiOrigin = '';

function setActiveUiOrigin(origin) {
  activeUiOrigin = String(origin || '').replace(/\/$/, '');
}

function getActiveUiOrigin() {
  return activeUiOrigin;
}

function cashierUrlForUi(cfg) {
  return getActiveUiOrigin() || String(cfg?.cashierUrl || '').replace(/\/$/, '');
}

module.exports = {
  setActiveUiOrigin,
  getActiveUiOrigin,
  cashierUrlForUi,
};
