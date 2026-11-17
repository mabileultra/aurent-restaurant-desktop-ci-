import { describe, expect, it } from 'vitest';
import {
  fieldToForm,
  mergeFormFieldsState,
  optionsToText,
  parseOptionsText,
} from './businessTypeUtils';

describe('businessTypeUtils', () => {
  it('parses and formats options text', () => {
    const text = 'val1|Label 1\nval2|Label 2';
    const parsed = parseOptionsText(text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ value: 'val1', label: 'Label 1', sortOrder: 10 });
    expect(optionsToText(parsed)).toBe(text);
  });

  it('transforms fieldToForm with empty fallback', () => {
    const field = {
      fieldKey: 'color',
      label: 'Rangi',
      fieldType: 'TEXT',
      required: true,
      enabled: true,
      sortOrder: 10,
      options: [],
    };
    const form = fieldToForm(field);
    expect(form.fieldKey).toBe('color');
    expect(form.required).toBe(true);
    expect(form.placeholder).toBe('');
  });

  it('merges form fields state with defaults enabled', () => {
    const rows = [{ ruleKey: 'name', enabled: false }];
    const merged = mergeFormFieldsState(rows);
    expect(Array.isArray(merged)).toBe(true);
    const nameRow = merged.find((r) => r.ruleKey === 'name');
    if (nameRow) {
      expect(nameRow.enabled).toBe(false);
      expect(nameRow.ruleValue).toBe('false');
    }
  });
});
