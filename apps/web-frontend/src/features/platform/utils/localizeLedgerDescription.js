/**
 * Localizes backend-generated billing ledger descriptions into the active UI language.
 *
 * @param {string} description - Raw backend description string
 * @param {Function} t - i18next translation function
 * @returns {string} Localized description string
 */
export function localizeLedgerDescription(description, t) {
  if (!description || typeof description !== 'string') {
    return description;
  }

  const trimmed = description.trim();

  if (trimmed === 'Ручное пополнение супер-админом') {
    return t('platform.billing.ledgerDesc.manualTopUp', {
      defaultValue: 'Super-admin tomonidan hisob to‘ldirish',
    });
  }

  if (trimmed === 'Корректировка / списание супер-админом') {
    return t('platform.billing.ledgerDesc.manualAdjustment', {
      defaultValue: 'Super-admin tomonidan tuzatish / mablag‘ yechish',
    });
  }

  if (trimmed === 'Ручное списание супер-админом') {
    return t('platform.billing.ledgerDesc.manualDebit', {
      defaultValue: 'Super-admin tomonidan mablag‘ yechish',
    });
  }

  const monthlyMatch = trimmed.match(/^Ежемесячное списание:\s*(.+)$/i);
  if (monthlyMatch) {
    const rawPlan = monthlyMatch[1].trim();
    const plan = rawPlan.toLowerCase() === 'тариф'
      ? t('platform.billing.ledgerDesc.defaultPlan', { defaultValue: 'tarif' })
      : rawPlan;
    return t('platform.billing.ledgerDesc.monthlyCharge', {
      defaultValue: 'Oylik to‘lov: {{plan}}',
      plan,
    });
  }

  const topUpMatch = trimmed.match(/^Пополнение через\s*(.+)$/i);
  if (topUpMatch) {
    const method = topUpMatch[1].trim();
    return t('platform.billing.ledgerDesc.topUpVia', {
      defaultValue: '{{method}} orqali to‘ldirish',
      method,
    });
  }

  return description;
}
