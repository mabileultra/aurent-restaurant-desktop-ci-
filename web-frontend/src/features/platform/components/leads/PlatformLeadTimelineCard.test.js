import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadTimelineCard from './PlatformLeadTimelineCard';

describe('PlatformLeadTimelineCard', () => {
  it('renders timeline with initial website event and manager comment', () => {
    const lead = {
      createdAt: '2026-10-27T16:15:00.000Z',
      source: 'Tariflar',
      managerNote: JSON.stringify([
        {
          id: '1',
          type: 'comment',
          text: 'Demo o\'tdi. Tarifni tanladi.',
          author: 'Administrator',
          at: '2026-10-28T15:50:00.000Z',
        },
      ]),
    };

    const html = renderToStaticMarkup(
      React.createElement(PlatformLeadTimelineCard, {
        lead,
        onAddComment: vi.fn(),
      })
    );
    expect(html).toContain('Tarifni tanladi');
    expect(html).toContain('Ariza saytdan keldi');
  });
});
