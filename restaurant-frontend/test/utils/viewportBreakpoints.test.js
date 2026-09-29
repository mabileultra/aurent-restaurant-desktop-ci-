import { describe, expect, it } from 'vitest';
import { resolveViewportProfile } from '../../src/utils/viewportBreakpoints';

describe('resolveViewportProfile', () => {
  it('marks compact phones/tablets', () => {
    expect(resolveViewportProfile(390, 844).compact).toBe(true);
    expect(resolveViewportProfile(799, 600).compact).toBe(true);
    expect(resolveViewportProfile(800, 600).compact).toBe(false);
  });

  it('marks desktop from 1024', () => {
    expect(resolveViewportProfile(1024, 900).desktop).toBe(true);
    expect(resolveViewportProfile(1023, 900).desktop).toBe(false);
  });

  it('marks canonical POS 1024×768 band', () => {
    expect(resolveViewportProfile(1024, 768).canonical).toBe(true);
    expect(resolveViewportProfile(1280, 820).canonical).toBe(true);
    expect(resolveViewportProfile(1280, 821).canonical).toBe(false);
    expect(resolveViewportProfile(1440, 768).canonical).toBe(false);
  });

  it('marks short landscape POS terminals (~1000×500)', () => {
    expect(resolveViewportProfile(1000, 500).posTerminal).toBe(true);
    expect(resolveViewportProfile(1024, 540).posTerminal).toBe(true);
    expect(resolveViewportProfile(900, 620).posTerminal).toBe(true);
    expect(resolveViewportProfile(899, 500).posTerminal).toBe(false);
    expect(resolveViewportProfile(1000, 621).posTerminal).toBe(false);
    expect(resolveViewportProfile(390, 844).posTerminal).toBe(false);
  });
});
