// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { AboutAppModal } from '@aurent/shared-ui';

describe('AboutAppModal component', () => {
  const originalDesktopCashier = window.desktopCashier;
  const originalAppVersion = globalThis.__APP_VERSION__;
  const originalGitHash = globalThis.__APP_GIT_HASH__;

  afterEach(() => {
    cleanup();
    if (originalDesktopCashier !== undefined) {
      window.desktopCashier = originalDesktopCashier;
    } else {
      delete window.desktopCashier;
    }
    if (originalAppVersion !== undefined) {
      globalThis.__APP_VERSION__ = originalAppVersion;
    } else {
      delete globalThis.__APP_VERSION__;
    }
    if (originalGitHash !== undefined) {
      globalThis.__APP_GIT_HASH__ = originalGitHash;
    } else {
      delete globalThis.__APP_GIT_HASH__;
    }
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <AboutAppModal open={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with UI version (including git hash) and web platform in browser mode', () => {
    delete window.desktopCashier;
    render(
      <AboutAppModal
        open={true}
        onClose={vi.fn()}
        appName="Aurent POS"
      />
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Aurent POS')).toBeTruthy();
    expect(screen.getByText('Dastur versiyasi')).toBeTruthy();
    expect(screen.getByText('Veb versiya')).toBeTruthy();
    expect(screen.getByText(/^1\.0\.0 \([0-9a-f]{7,}\)$/i)).toBeTruthy();
  });

  it('renders browser version without hash when git hash is absent (CI/archive)', () => {
    delete window.desktopCashier;
    globalThis.__APP_VERSION__ = '1.0.0';
    globalThis.__APP_GIT_HASH__ = '';
    render(
      <AboutAppModal
        open={true}
        onClose={vi.fn()}
        appName="Aurent POS"
      />
    );
    expect(screen.getByText('1.0.0')).toBeTruthy();
  });

  it('renders both Desktop version and UI version (with hash) in Electron desktop mode', () => {
    window.desktopCashier = {
      isDesktop: true,
      appVersion: '1.3.4',
    };

    render(
      <AboutAppModal
        open={true}
        onClose={vi.fn()}
        appName="Aurent Cashier"
      />
    );

    expect(screen.getByText('Desktop versiyasi')).toBeTruthy();
    expect(screen.getByText('1.3.4')).toBeTruthy();
    expect(screen.getByText('UI versiyasi')).toBeTruthy();
    expect(screen.getByText(/^1\.0\.0 \([0-9a-f]{7,}\)$/i)).toBeTruthy();
    expect(screen.getByText('Desktop ilova')).toBeTruthy();
  });

  it('hides license row when licenseNumber is omitted or empty', () => {
    render(
      <AboutAppModal
        open={true}
        onClose={vi.fn()}
        licenseNumber=""
      />
    );

    expect(screen.queryByText('Litsenziya raqami')).toBeNull();
  });

  it('shows license row when licenseNumber is provided', () => {
    render(
      <AboutAppModal
        open={true}
        onClose={vi.fn()}
        licenseNumber="LIC-9988-UZ"
      />
    );

    expect(screen.getByText('LIC-9988-UZ')).toBeTruthy();
    expect(screen.getByText('Litsenziya raqami')).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <AboutAppModal
        open={true}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByLabelText('Yopish');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
