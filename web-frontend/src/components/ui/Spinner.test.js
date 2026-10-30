import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Spinner, { AurentBrandEmblem, AurentSpinner, useSpinnerDelay } from './Spinner';

globalThis.React = React;

describe('Spinner — Logo Chizilishi (Variant C)', () => {
  it('renders logo drawing animation on md, lg, xl and 2xl sizes', () => {
    const htmlMd = renderToStaticMarkup(React.createElement(Spinner, { size: 'md' }));
    expect(htmlMd).toContain('role="status"');
    expect(htmlMd).toContain('aria-live="polite"');
    expect(htmlMd).toContain('aur-sp');
    expect(htmlMd).toContain('aur-sp--emerald');
    expect(htmlMd).toContain('aur-sp--md');
    expect(htmlMd).toContain('aur-sp__draw');
    expect(htmlMd).toContain('aur-sp__tile');
    expect(htmlMd).toContain('aur-sp__letter');
    expect(htmlMd).toContain('aur-sp__reg');
    expect(htmlMd).toContain('Yuklanmoqda…');
  });

  it('renders with custom text label caption', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { size: 'lg', text: 'To‘lov amalga oshirilmoqda…' })
    );
    expect(html).toContain('To‘lov amalga oshirilmoqda…');
    expect(html).toContain('aur-sp__text');
  });

  it('renders glow effect on large sizes (xl and 2xl)', () => {
    const htmlXl = renderToStaticMarkup(React.createElement(Spinner, { size: 'xl' }));
    expect(htmlXl).toContain('aur-sp__glow');

    const html2xl = renderToStaticMarkup(React.createElement(Spinner, { size: '2xl' }));
    expect(html2xl).toContain('aur-sp__glow');

    const htmlMd = renderToStaticMarkup(React.createElement(Spinner, { size: 'md' }));
    expect(htmlMd).not.toContain('aur-sp__glow');
  });

  it('renders compact ring for small sizes (xs, sm) where drawing is unreadable', () => {
    const htmlXs = renderToStaticMarkup(React.createElement(Spinner, { size: 'xs' }));
    expect(htmlXs).toContain('aur-sp__ring');
    expect(htmlXs).toContain('aur-sp__arc');
    expect(htmlXs).not.toContain('aur-sp__draw');

    const htmlSm = renderToStaticMarkup(React.createElement(Spinner, { size: 'sm' }));
    expect(htmlSm).toContain('aur-sp__ring');
    expect(htmlSm).toContain('aur-sp__arc');
    expect(htmlSm).not.toContain('aur-sp__draw');
  });

  it('supports hiding the logo drawing with showLogo={false} to force the ring', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { size: 'lg', showLogo: false })
    );
    expect(html).toContain('aur-sp__ring');
    expect(html).not.toContain('aur-sp__draw');
  });

  it('supports horizontal direction="row" for inline buttons and table rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { size: 'sm', direction: 'row', text: 'Saqlanmoqda…' })
    );
    expect(html).toContain('aur-sp--row');
    expect(html).toContain('Saqlanmoqda…');
  });

  it('supports variant="current" using compact ring to inherit button color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { size: 'md', variant: 'current' })
    );
    expect(html).toContain('aur-sp--current');
    expect(html).toContain('aur-sp__ring');
  });

  it('deduplicates screen reader announcements: sr-only label when no caption, text caption when caption provided', () => {
    const withTextHtml = renderToStaticMarkup(
      React.createElement(Spinner, { text: 'Kutilmoqda…' })
    );
    expect(withTextHtml).toContain('aur-sp__text');
    expect(withTextHtml).not.toContain('aur-sp__sr');

    const withoutTextHtml = renderToStaticMarkup(
      React.createElement(Spinner, { label: 'Yuklanmoqda…' })
    );
    expect(withoutTextHtml).toContain('aur-sp__sr');
    expect(withoutTextHtml).toContain('Yuklanmoqda…');
  });

  it('renders overlay mode with pill container and backdrop blur', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { overlay: true, text: 'Yangilanmoqda…' })
    );
    expect(html).toContain('aur-sp-overlay');
    expect(html).toContain('aur-sp-overlay__slot');
    expect(html).toContain('aur-sp-overlay__pill');
    expect(html).toContain('Yangilanmoqda…');
  });

  it('renders fullScreen fixed viewport overlay', () => {
    const html = renderToStaticMarkup(
      React.createElement(Spinner, { fullScreen: true, size: '2xl', text: 'Aurent POS ishga tushmoqda…' })
    );
    expect(html).toContain('aur-sp-screen');
    expect(html).toContain('Aurent POS ishga tushmoqda…');
  });

  it('renders standalone AurentBrandEmblem component with inverted mode support', () => {
    const normalHtml = renderToStaticMarkup(React.createElement(AurentBrandEmblem));
    expect(normalHtml).toContain('<svg');
    expect(normalHtml).toContain('fill="#10B981"');

    const invertedHtml = renderToStaticMarkup(
      React.createElement(AurentBrandEmblem, { inverted: true })
    );
    expect(invertedHtml).toContain('fill="#FFFFFF"');
    expect(invertedHtml).toContain('fill="#047857"');
  });

  it('exports aliases and hook cleanly', () => {
    expect(AurentSpinner).toBe(Spinner);
    expect(typeof useSpinnerDelay).toBe('function');
  });
});
