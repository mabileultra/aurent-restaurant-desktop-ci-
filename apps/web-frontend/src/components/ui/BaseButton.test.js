import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BaseButton from './BaseButton';
import { ConnectionStatus, useNetworkStore } from '../../store/networkStore';

globalThis.React = React;

describe('BaseButton', () => {
  it('renders standard button with children', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseButton, { variant: 'primary' }, 'Saqlash')
    );
    expect(html).toContain('Saqlash');
    expect(html).toContain('base-btn--primary');
  });

  it('renders spinner and disables button when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(BaseButton, { variant: 'primary', loading: true }, 'Saqlash')
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('role="status"');
    expect(html).toContain('aur-sp');
    expect(html).toContain('aur-sp--white');
  });

  it('disables button and adds tooltip when requiresOnline is true and offline', () => {
    useNetworkStore.setState({ status: ConnectionStatus.OFFLINE });

    const html = renderToStaticMarkup(
      React.createElement(BaseButton, { requiresOnline: true, title: 'Yangi xodim' }, 'Qo‘shish')
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('title="Yangi xodim (Internet yo’q)"');

    useNetworkStore.setState({ status: ConnectionStatus.ONLINE });
  });

  it('enables button when requiresOnline is true and network is online', () => {
    useNetworkStore.setState({ status: ConnectionStatus.ONLINE });

    const html = renderToStaticMarkup(
      React.createElement(BaseButton, { requiresOnline: true, title: 'Yangi xodim' }, 'Qo‘shish')
    );
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('title="Yangi xodim"');
  });
});
