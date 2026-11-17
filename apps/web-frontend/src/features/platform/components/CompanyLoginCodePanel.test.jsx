// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, afterEach } from 'vitest';
import CompanyLoginCodePanel from './CompanyLoginCodePanel';

describe('CompanyLoginCodePanel', () => {
  afterEach(cleanup);
  const t = (key) => key;

  it('renders auto login code hint when creating new company', () => {
    render(<CompanyLoginCodePanel isEditing={false} t={t} />);
    expect(screen.getByText('platform.field_loginCodeAutoHint')).toBeTruthy();
  });

  it('renders login code display when editing company', () => {
    render(<CompanyLoginCodePanel isEditing={true} loginCode="12345" t={t} />);
    expect(screen.getByText('12345')).toBeTruthy();
    expect(screen.getByText('platform.field_loginCodeReadonly')).toBeTruthy();
  });
});
