import { describe, expect, it } from 'vitest';
import { shouldShowHallLanSwitch } from '../../../src/restaurant/hall-lan/shouldShowHallLanSwitch';
import { isAlreadyOnLanHub } from '../../../src/restaurant/hall-lan/isAlreadyOnLanHub';
import { buildLanSwitchHref } from '../../../src/restaurant/hall-lan/buildLanSwitchHref';

describe('isAlreadyOnLanHub', () => {
  it('treats private IPs and localhost as LAN', () => {
    expect(isAlreadyOnLanHub('192.168.1.10')).toBe(true);
    expect(isAlreadyOnLanHub('10.0.0.5')).toBe(true);
    expect(isAlreadyOnLanHub('172.16.0.2')).toBe(true);
    expect(isAlreadyOnLanHub('localhost')).toBe(true);
  });

  it('treats public cloud host as not LAN', () => {
    expect(isAlreadyOnLanHub('r-aurent.uz')).toBe(false);
    expect(isAlreadyOnLanHub('app.example.com')).toBe(false);
  });
});

describe('shouldShowHallLanSwitch', () => {
  it('hides on desktop and on LAN host', () => {
    expect(shouldShowHallLanSwitch({
      isDesktop: true,
      hostname: 'r-aurent.uz',
      presence: { known: true, switchToLan: true },
    })).toBe(false);
    expect(shouldShowHallLanSwitch({
      isDesktop: false,
      hostname: '192.168.0.20',
      presence: { known: true, switchToLan: true },
    })).toBe(false);
  });

  it('shows only when cloud phone and hall signals switchToLan', () => {
    expect(shouldShowHallLanSwitch({
      isDesktop: false,
      hostname: 'r-aurent.uz',
      presence: { known: true, switchToLan: true },
    })).toBe(true);
    expect(shouldShowHallLanSwitch({
      isDesktop: false,
      hostname: 'r-aurent.uz',
      presence: { known: true, switchToLan: false },
    })).toBe(false);
    expect(shouldShowHallLanSwitch({
      isDesktop: false,
      hostname: 'r-aurent.uz',
      presence: { known: false, switchToLan: false },
    })).toBe(false);
  });
});

describe('buildLanSwitchHref', () => {
  it('keeps path on lan hub origin', () => {
    expect(buildLanSwitchHref('http://192.168.1.5:4173', {
      pathname: '/rst/kitchen',
      search: '',
      hash: '',
    })).toBe('http://192.168.1.5:4173/rst/kitchen');
  });
});
