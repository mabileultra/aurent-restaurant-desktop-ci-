/** Офлайн только после непрерывных сбоев. Короткий обрыв и ложный offline браузера не считаются. */
export const OFFLINE_CONFIRM_MS = 15_000;
/** После подтверждённого офлайна онлайн — со второго успешного probe. */
export const ONLINE_RECOVERY_STREAK = 2;

let stableApiOnline = null;
let suspectSinceMs = 0;
let onlineRecoveryStreak = 0;

export function resetConnectivityStabilizer() {
  stableApiOnline = null;
  suspectSinceMs = 0;
  onlineRecoveryStreak = 0;
}

/**
 * @param {boolean} rawOnline результат probe или факт ответа API
 * @returns {boolean} стабильное состояние для кассы
 */
export function stabilizeApiOnline(rawOnline) {
  if (rawOnline) {
    suspectSinceMs = 0;
    if (stableApiOnline === false) {
      onlineRecoveryStreak += 1;
      if (onlineRecoveryStreak >= ONLINE_RECOVERY_STREAK) {
        stableApiOnline = true;
        onlineRecoveryStreak = 0;
      }
      return Boolean(stableApiOnline);
    }
    stableApiOnline = true;
    onlineRecoveryStreak = 0;
    return true;
  }

  onlineRecoveryStreak = 0;
  if (stableApiOnline === false) return false;

  if (!suspectSinceMs) suspectSinceMs = Date.now();
  if (Date.now() - suspectSinceMs >= OFFLINE_CONFIRM_MS) {
    stableApiOnline = false;
    return false;
  }
  return true;
}
