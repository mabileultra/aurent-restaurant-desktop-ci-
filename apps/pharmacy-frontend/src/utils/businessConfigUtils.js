export function parsePriceRules(priceRules = []) {
  const byKey = Object.fromEntries(priceRules.map((rule) => [rule.ruleKey, rule]));
  return {
    requireCost: byKey['price.requireCost']?.enabled ?? false,
    hideCost: byKey['price.hideCost']?.enabled ?? false,
    hideInitialStock: byKey['price.hideInitialStock']?.enabled ?? false,
    minMarginPercent: Number(byKey['price.minMarginPercent']?.ruleValue ?? 0),
    maxDiscountPercent: Number(byKey['price.maxDiscountPercent']?.ruleValue ?? 100),
  };
}

function evaluateOperator(operator, triggerValue, actual) {
  const val = actual == null ? '' : String(actual).trim();
  const expected = triggerValue == null ? '' : String(triggerValue).trim();
  switch (operator) {
    case 'EQUALS':
      return val === expected;
    case 'NOT_EQUALS':
      return val !== expected;
    case 'NOT_EMPTY':
      return val !== '';
    case 'EMPTY':
      return val === '';
    default:
      return false;
  }
}

export function resolveFieldDisplayState(field, displayRules = [], attributeValues = {}) {
  const relevant = displayRules.filter((rule) => rule.targetFieldKey === field.fieldKey);
  let visible = field.enabled !== false;
  let required = field.required;

  for (const rule of relevant) {
    const actual = attributeValues[rule.triggerFieldKey];
    const match = evaluateOperator(rule.operator, rule.triggerValue, actual);
    if (rule.effect === 'SHOW') visible = match;
    if (rule.effect === 'HIDE' && match) visible = false;
    if (rule.effect === 'REQUIRE' && match) required = true;
  }

  return { visible, required };
}

export function extractAttributeValues(formValues = {}) {
  const attrs = {};
  for (const [key, value] of Object.entries(formValues)) {
    if (key.startsWith('attr_')) attrs[key.slice(5)] = value;
  }
  return attrs;
}
