const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function storePath() {
  return path.join(app.getPath('userData'), 'company-login-code.txt');
}

function normalize(code) {
  const digits = String(code || '').trim().replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 10000 || n > 99999) return '';
  return String(n).padStart(5, '0');
}

function getCompanyLoginCode() {
  try {
    if (!fs.existsSync(storePath())) return '';
    return normalize(fs.readFileSync(storePath(), 'utf8'));
  } catch {
    return '';
  }
}

function setCompanyLoginCode(code) {
  const normalized = normalize(code);
  try {
    if (!normalized) {
      if (fs.existsSync(storePath())) fs.unlinkSync(storePath());
      return '';
    }
    fs.writeFileSync(storePath(), `${normalized}\n`, 'utf8');
    return normalized;
  } catch {
    return normalized;
  }
}

module.exports = { getCompanyLoginCode, setCompanyLoginCode };
