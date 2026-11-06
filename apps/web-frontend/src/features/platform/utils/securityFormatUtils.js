/**
 * Xavfsizlik bo'limi uchun yordamchi formatlash va baholash funksiyalari.
 */

/**
 * Parol kuchliligini baholaydi (0 dan 4 gacha).
 * @param {string} password
 * @returns {{ score: number, label: string, color: string, textColor: string }}
 */
export function evaluatePasswordStrength(password = '') {
  const p = String(password || '');
  if (!p) {
    return { score: 0, label: '', color: '#E2E8F0', textColor: '#64748B' };
  }

  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;

  const scales = [
    { label: '', color: '#E2E8F0', textColor: '#64748B' },
    { label: 'Juda zaif', color: '#D92D20', textColor: '#B42318' },
    { label: 'Zaif', color: '#E8B04B', textColor: '#8A4B00' },
    { label: 'O‘rtacha', color: '#0A7A52', textColor: '#046C47' },
    { label: 'Kuchli', color: '#006847', textColor: '#046C47' },
  ];

  const matched = scales[Math.min(score, 4)] ?? scales[0];
  return { score, ...matched };
}

/**
 * Foydalanuvchi ism-familiyasidan 2 harfli bosh initsialni oladi.
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
export function resolveUserInitials(firstName = '', lastName = '') {
  const f = (firstName || '').trim().charAt(0).toUpperCase();
  const l = (lastName || '').trim().charAt(0).toUpperCase();
  if (f && l) return `${f}${l}`;
  if (f) return f;
  return 'U';
}

/**
 * Audit hodisasi holatiga qarab badge stillarini qaytaradi.
 * @param {'ok' | 'fail' | 'blocked' | 'unknown'} status
 * @returns {{ label: string, bg: string, color: string }}
 */
export function resolveAttemptBadge(status) {
  switch (status) {
    case 'ok':
      return { label: 'Muvaffaqiyatli', bg: '#E6F2EC', color: '#046C47' };
    case 'fail':
      return { label: 'Noto‘g‘ri parol', bg: '#FEF3F2', color: '#B42318' };
    case 'blocked':
      return { label: 'Bloklandi', bg: '#B42318', color: '#FFFFFF' };
    case 'unknown':
    default:
      return { label: 'Login topilmadi', bg: '#FEF3F2', color: '#B42318' };
  }
}
