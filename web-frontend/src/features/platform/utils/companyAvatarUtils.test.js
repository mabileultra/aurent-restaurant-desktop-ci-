import { describe, expect, it } from 'vitest';
import {
  getBusinessTypeBadgeClass,
  getCompanyInitials,
  getCompanyPalette,
} from './companyAvatarUtils';

describe('companyAvatarUtils', () => {
  describe('getCompanyInitials', () => {
    it('handles empty or non-string inputs with fallback', () => {
      expect(getCompanyInitials(null)).toBe('CO');
      expect(getCompanyInitials('')).toBe('CO');
      expect(getCompanyInitials(undefined)).toBe('CO');
    });

    it('extracts two letters from multi-word names while ignoring trailing legal form', () => {
      expect(getCompanyInitials('"ANNODENT SS" MCHJ')).toBe('AS');
      expect(getCompanyInitials('404 Toys')).toBe('4T');
      expect(getCompanyInitials('Bazar Market OOO')).toBe('BM');
      expect(getCompanyInitials('Alinur Garden')).toBe('AG');
    });

    it('extracts first two letters when only a single word exists', () => {
      expect(getCompanyInitials('Aurent')).toBe('AU');
      expect(getCompanyInitials('Dent')).toBe('DE');
    });

    it('handles legal forms when it is the only word', () => {
      expect(getCompanyInitials('MCHJ')).toBe('MC');
    });
  });

  describe('getCompanyPalette', () => {
    it('returns a deterministic CSS string for a given name and id', () => {
      const palette1 = getCompanyPalette('ANNODENT SS', 62);
      const palette2 = getCompanyPalette('ANNODENT SS', 62);
      expect(palette1).toBe(palette2);
      expect(typeof palette1).toBe('string');
      expect(palette1).toContain('border-');
    });
  });

  describe('getBusinessTypeBadgeClass', () => {
    it('returns appropriate theme classes for various business types', () => {
      expect(getBusinessTypeBadgeClass('RESTAURANT')).toContain('amber');
      expect(getBusinessTypeBadgeClass('PHARMACY')).toContain('sky');
      expect(getBusinessTypeBadgeClass('GROCERY')).toContain('emerald');
      expect(getBusinessTypeBadgeClass('UNIVERSAL')).toContain('teal');
      expect(getBusinessTypeBadgeClass('UNKNOWN')).toContain('slate');
    });
  });
});
