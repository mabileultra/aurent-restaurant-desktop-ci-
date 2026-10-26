import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BrandMark from './BrandMark';
import { BRAND_LOGO_FULL, BRAND_NAME } from '../../config/brandLogos';

describe('BrandMark', () => {
  it('renders full brand mark by default with auto width and default height', () => {
    const html = renderToStaticMarkup(React.createElement(BrandMark));
    expect(html).toContain(`src="${BRAND_LOGO_FULL}"`);
    expect(html).toContain(`alt="${BRAND_NAME}"`);
    expect(html).toContain('brand-logo');
    expect(html).toContain('brand-logo--full');
    expect(html).toContain('height:40px');
    expect(html).toContain('width:auto');
  });

  it('renders full brand mark with custom height', () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandMark, { variant: 'full', height: 28, className: 'shrink-0' })
    );
    expect(html).toContain('height:28px');
    expect(html).toContain('width:auto');
    expect(html).toContain('shrink-0');
  });

  it('renders icon variant with square bounds and object-fit contain without distortion', () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandMark, { variant: 'icon', size: 32 })
    );
    expect(html).toContain('brand-logo--icon');
    expect(html).toContain('width:32px');
    expect(html).toContain('height:32px');
    expect(html).toContain('object-fit:contain');
  });

  it('uses size prop when height is omitted in full variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandMark, { variant: 'full', size: 32 })
    );
    expect(html).toContain('height:32px');
    expect(html).toContain('width:auto');
  });

  it('merges custom style prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandMark, { height: 28, style: { opacity: 0.9 } })
    );
    expect(html).toContain('opacity:0.9');
    expect(html).toContain('height:28px');
  });

  it('renders custom tenant logo in full variant with auto width and max-width', async () => {
    const tenantStoreModule = await import('../../store/tenantDisplayStore');
    const spy = vi.spyOn(tenantStoreModule, 'useTenantDisplayStore').mockImplementation((selector) =>
      selector({
        committed: {
          systemLogoDataUrl: 'data:image/png;base64,tenantMock',
          systemLogoSizePx: 36,
        },
      })
    );

    const html = renderToStaticMarkup(
      React.createElement(BrandMark, { variant: 'full', height: 28 })
    );
    expect(html).toContain('src="data:image/png;base64,tenantMock"');
    expect(html).toContain('brand-logo--full');
    expect(html).toContain('height:28px');
    expect(html).toContain('width:auto');
    expect(html).toContain('max-width:220px');

    spy.mockRestore();
  });

  it('renders custom tenant logo in icon variant with square bounds', async () => {
    const tenantStoreModule = await import('../../store/tenantDisplayStore');
    const spy = vi.spyOn(tenantStoreModule, 'useTenantDisplayStore').mockImplementation((selector) =>
      selector({
        committed: {
          systemLogoDataUrl: 'data:image/png;base64,tenantIconMock',
          systemLogoSizePx: 36,
        },
      })
    );

    const html = renderToStaticMarkup(
      React.createElement(BrandMark, { variant: 'icon', size: 24 })
    );
    expect(html).toContain('src="data:image/png;base64,tenantIconMock"');
    expect(html).toContain('brand-logo--icon');
    expect(html).toContain('width:36px');
    expect(html).toContain('height:36px');

    spy.mockRestore();
  });
});
