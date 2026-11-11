import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Button from '../Button';
import Badge from '../Badge';
import Skeleton from '../Skeleton';
import FilterChip from '../FilterChip';
import Segmented from '../Segmented';

describe('AA Components: Button, Badge, Skeleton, FilterChip, Segmented', () => {
  it('renders Button with variants, sizes, loading, and polymorphic as', () => {
    const htmlPrimary = renderToStaticMarkup(
      React.createElement(Button, { variant: 'primary', size: 'lg' }, 'Saqlash')
    );
    expect(htmlPrimary).toContain('aa-btn');
    expect(htmlPrimary).toContain('aa-btn--primary');
    expect(htmlPrimary).toContain('aa-btn--lg');
    expect(htmlPrimary).toContain('Saqlash');

    const htmlLoading = renderToStaticMarkup(
      React.createElement(Button, { loading: true }, 'Yuklanmoqda')
    );
    expect(htmlLoading).toContain('aa-spinner');
    expect(htmlLoading).toContain('aria-busy="true"');
    expect(htmlLoading).toContain('disabled=""');

    const htmlIconOnly = renderToStaticMarkup(
      React.createElement(Button, {
        iconOnly: true,
        'aria-label': 'Yopish',
        icon: React.createElement('span', null, 'X'),
      })
    );
    expect(htmlIconOnly).toContain('aa-btn--icon');
    expect(htmlIconOnly).toContain('aria-label="Yopish"');

    const htmlLink = renderToStaticMarkup(
      React.createElement(Button, { as: 'a', href: '/platform' }, 'Havola')
    );
    expect(htmlLink).toContain('<a');
    expect(htmlLink).toContain('href="/platform"');
  });

  it('renders Badge with tones and dot', () => {
    const htmlNeutral = renderToStaticMarkup(
      React.createElement(Badge, null, 'Neytral')
    );
    expect(htmlNeutral).toContain('aa-badge');
    expect(htmlNeutral).not.toContain('aa-badge--neutral');

    const htmlSuccessDot = renderToStaticMarkup(
      React.createElement(Badge, { tone: 'success', dot: true }, 'Faol')
    );
    expect(htmlSuccessDot).toContain('aa-badge--success');
    expect(htmlSuccessDot).toContain('aa-badge__dot');
    expect(htmlSuccessDot).toContain('Faol');

    const htmlDanger = renderToStaticMarkup(
      React.createElement(Badge, { tone: 'danger' }, 'To‘xtatilgan')
    );
    expect(htmlDanger).toContain('aa-badge--danger');
  });

  it('renders Skeleton with variants and styles', () => {
    const htmlMetric = renderToStaticMarkup(
      React.createElement(Skeleton, { variant: 'metric', width: '80%' })
    );
    expect(htmlMetric).toContain('aa-skel');
    expect(htmlMetric).toContain('aa-skel--metric');
    expect(htmlMetric).toContain('width:80%');
    expect(htmlMetric).toContain('aria-hidden="true"');
  });

  it('renders FilterChip with aria-pressed, counts, and analytics accent', () => {
    const htmlChip = renderToStaticMarkup(
      React.createElement(FilterChip, {
        pressed: true,
        count: 42,
        accent: 'analytics',
      }, 'Ulangan')
    );
    expect(htmlChip).toContain('aa-chip');
    expect(htmlChip).toContain('aa-chip--analytics');
    expect(htmlChip).toContain('aria-pressed="true"');
    expect(htmlChip).toContain('aa-chip__count');
    expect(htmlChip).toContain('42');
  });

  it('renders Segmented control with options and aria-pressed', () => {
    const options = [
      { value: 'all', label: 'Hammasi', count: 12 },
      { value: 'active', label: 'Faol', count: 8 },
    ];
    const htmlSeg = renderToStaticMarkup(
      React.createElement(Segmented, {
        options,
        value: 'active',
        accent: 'analytics',
      })
    );
    expect(htmlSeg).toContain('aa-seg');
    expect(htmlSeg).toContain('aa-seg--analytics');
    expect(htmlSeg).toContain('role="group"');
    expect(htmlSeg).toContain('aria-pressed="true"');
    expect(htmlSeg).toContain('(12)');
    expect(htmlSeg).toContain('(8)');
  });
});
