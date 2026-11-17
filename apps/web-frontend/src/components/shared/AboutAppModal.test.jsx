// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { AboutAppModal } from '@aurent/shared-ui';

describe('AboutAppModal component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <AboutAppModal open={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with version and platform when open is true', () => {
    render(
      <AboutAppModal
        open={true}
        onClose={vi.fn()}
        appName="Aurent POS"
      />
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Aurent POS')).toBeTruthy();
    expect(screen.getByText('Platforma')).toBeTruthy();
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
