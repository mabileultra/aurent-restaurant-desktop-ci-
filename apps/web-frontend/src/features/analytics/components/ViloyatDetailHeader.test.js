import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ViloyatDetailHeader from './ViloyatDetailHeader';

const mockTypes = [
  { id: 'A', label: 'Hammasi', n: 63, c: 16 },
  { id: 'F', label: 'Oziq-ovqat', n: 18, c: 5 },
  { id: 'R', label: 'Restoranlar', n: 32, c: 8 },
  { id: 'P', label: 'Dorixonalar', n: 4, c: 1 },
  { id: 'O', label: 'Boshqalar', n: 9, c: 2 },
];

function renderHeader(props = {}) {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ViloyatDetailHeader, {
        padCode: '18',
        regionName: 'Samarqand viloyati',
        meta: '63 ta korxona',
        types: mockTypes,
        turnover: { all: 4710000000, m30: 4040000000 },
        currentTypeConfig: { n: 63, c: 16 },
        connPercent: 25.4,
        ...props,
      })
    )
  );
}

describe('ViloyatDetailHeader', () => {
  it('renders default state for all activities (type A)', () => {
    const html = renderHeader({ activeType: 'A' });

    expect(html).toContain('Samarqand viloyati');
    expect(html).toContain('Viloyat · kod 18');
    expect(html).toContain('Barcha faoliyat turlari · 16 ta tuman va shahar');
    expect(html).toContain('grocery.jpg');
    expect(html).toContain('restaurant.jpg');
    expect(html).toContain('pharmacy.jpg');
    expect(html).toContain('Hammasi');
    expect(html).toContain('Oziq-ovqat');
    expect(html).toContain('Aylanma · 30 kun');
    expect(html).toContain('4,04 mlrd so‘m');
  });

  it('renders grocery category (type F) with supermarket background and badge', () => {
    const html = renderHeader({
      activeType: 'F',
      currentTypeConfig: { n: 18, c: 5 },
      connPercent: 27.8,
    });

    expect(html).toContain('Oziq-ovqat korxonalari');
    expect(html).toContain('Oziq-ovqat, supermarket va savdo do‘konlari');
    expect(html).toContain('grocery.jpg');
    expect(html).toContain('data-hero="grocery"');
  });

  it('renders restaurant category (type R) with hall background', () => {
    const html = renderHeader({
      activeType: 'R',
      currentTypeConfig: { n: 32, c: 8 },
    });

    expect(html).toContain('Restoranlar va kafelar');
    expect(html).toContain('Restoranlar, kafelar va umumiy ovqatlanish maskanlari');
    expect(html).toContain('restaurant.jpg');
  });

  it('renders pharmacy category (type P) with storefront background', () => {
    const html = renderHeader({
      activeType: 'P',
      currentTypeConfig: { n: 4, c: 1 },
    });

    expect(html).toContain('Dorixonalar');
    expect(html).toContain('Dorixonalar va farmatsevtika muassasalari');
    expect(html).toContain('pharmacy.jpg');
  });

  it('renders others category (type O) with isometric background', () => {
    const html = renderHeader({
      activeType: 'O',
      currentTypeConfig: { n: 9, c: 2 },
    });

    expect(html).toContain('Boshqa korxonalar');
    expect(html).toContain('Universal, qurilish va boshqa turdagi korxonalar');
    expect(html).toContain('iso-cubes');
  });

  it('renders district scoped title and breadcrumbs when viewing a district', () => {
    const html = renderHeader({
      isDistrictView: true,
      districtCode: '05',
      districtName: 'Ishtixon tumani',
    });

    expect(html).toContain('Ishtixon tumani');
    expect(html).toContain('Tuman · kod 05');
    expect(html).toContain('Samarqand viloyati');
    expect(html).not.toContain('Viloyat ko‘rinishi');
  });
});
