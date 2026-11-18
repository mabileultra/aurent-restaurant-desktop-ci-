// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { AboutAppModal } from '@aurent/shared-ui';

describe('AboutAppModal component', () => {
  const originalDesktopCashier = window.desktopCashier;
  const originalAppVersion = globalThis.__APP_VERSION__;
  const originalCommitDate = globalThis.__APP_COMMIT_DATE__;
  const originalGitHash = globalThis.__APP_GIT_HASH__;
  const originalLicenseNumber = globalThis.__APP_LICENSE_NUMBER__;

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
    if (originalCommitDate !== undefined) {
      globalThis.__APP_COMMIT_DATE__ = originalCommitDate;
    } else {
      delete globalThis.__APP_COMMIT_DATE__;
    }
    if (originalGitHash !== undefined) {
      globalThis.__APP_GIT_HASH__ = originalGitHash;
    } else {
      delete globalThis.__APP_GIT_HASH__;
    }
    if (originalLicenseNumber !== undefined) {
      globalThis.__APP_LICENSE_NUMBER__ = originalLicenseNumber;
    } else {
      delete globalThis.__APP_LICENSE_NUMBER__;
    }
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <AboutAppModal open={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with UI version (including commit date + short git hash) and web platform in browser mode', () => {
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
    expect(screen.getByText(/^1\.0\.0 \(\d{4}-\d{2}-\d{2}, [0-9a-f]{7}\)$/i)).toBeTruthy();
  });

  it('renders browser version without date/hash when git info is absent (CI/archive)', () => {
    delete window.desktopCashier;
    globalThis.__APP_VERSION__ = '1.0.0';
    globalThis.__APP_COMMIT_DATE__ = '';
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

  it('renders both Desktop version and UI version (with date + hash) in Electron desktop mode', () => {
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
    expect(screen.getByText(/^1\.0\.0 \(\d{4}-\d{2}-\d{2}, [0-9a-f]{7}\)$/i)).toBeTruthy();
    expect(screen.getByText('Desktop ilova')).toBeTruthy();
  });

  it('shows "—" for license row when licenseNumber is empty or absent', () => {
    globalThis.__APP_LICENSE_NUMBER__ = '';
    render(
      <AboutAppModal
        open={true}
        onClose={vi.fn()}
        licenseNumber=""
      />
    );

    expect(screen.getByText('Litsenziya raqami')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows license row with "1.3" when licenseNumber is provided or resolved from env', () => {
    globalThis.__APP_LICENSE_NUMBER__ = '1.3';
    render(
      <AboutAppModal
        open={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Litsenziya raqami')).toBeTruthy();
    expect(screen.getByText('1.3')).toBeTruthy();
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
