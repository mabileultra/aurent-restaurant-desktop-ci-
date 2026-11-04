const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function showWindowsTouchKeyboard() {
  const tabTip = path.join(
    process.env.ProgramFiles || 'C:\\Program Files',
    'Common Files',
    'microsoft shared',
    'ink',
    'TabTip.exe',
  );
  if (fs.existsSync(tabTip)) {
    exec(`"${tabTip}"`);
    return;
  }
  exec('osk.exe');
}

function showMacKeyboardViewer() {
  exec('open -a "Keyboard Viewer"', () => {
    exec('open -a "CharacterViewer"', () => {});
  });
}

function showLinuxOnboard() {
  exec('onboard', () => {
    exec('florence', () => {});
  });
}

function showOnScreenKeyboard() {
  if (process.platform === 'win32') {
    showWindowsTouchKeyboard();
    return true;
  }
  if (process.platform === 'darwin') {
    showMacKeyboardViewer();
    return true;
  }
  showLinuxOnboard();
  return true;
}

module.exports = { showOnScreenKeyboard };
