let mainWindowRef = null;

function setMainWindow(win) {
  mainWindowRef = win;
}

function getMainWindow() {
  return mainWindowRef;
}

module.exports = { setMainWindow, getMainWindow };
