import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PlatformLeadsPage from './PlatformLeadsPage';
import * as leadsHook from '../hooks/usePlatformLeadsPage';

globalThis.React = React;

describe('PlatformLeadsPage', () => {
  it('renders master-detail leads page layout', () => {
    vi.spyOn(leadsHook, 'usePlatformLeadsPage').mockReturnValue({
      t: (k, { defaultValue } = {}) => defaultValue || k,
      search: '',
      setSearch: vi.fn(),
      status: '',
      setStatus: vi.fn(),
      leadType: '',
      setLeadType: vi.fn(),
      rows: [
        {
          id: 'lead-1',
          name: 'Nodira Yusupova',
          status: 'IN_PROGRESS',
          leadType: 'CONNECT',
          source: 'pricing',
          message: 'Oziq-ovqat do\'koni',
          createdAt: '2026-10-27T16:15:00.000Z',
        },
      ],
      isPending: false,
      counts: { ALL: 1, NEW: 0, IN_PROGRESS: 1, DONE: 0, REJECTED: 0 },
      unansweredCount: 0,
      selectedLead: {
        id: 'lead-1',
        name: 'Nodira Yusupova',
        phone: '+998 94 555 66 77',
        status: 'IN_PROGRESS',
        leadType: 'CONNECT',
        source: 'pricing',
        message: 'Oziq-ovqat do\'koni',
        createdAt: '2026-10-27T16:15:00.000Z',
      },
      selectedLeadId: 'lead-1',
      setSelectedLeadId: vi.fn(),
      viewMode: 'split',
      setViewMode: vi.fn(),
      convertTargetLead: null,
      handleStatusChange: vi.fn(),
      handleAddComment: vi.fn(),
      handleDeleteLead: vi.fn(),
      handleStartConvert: vi.fn(),
      handleSelectLeadMobile: vi.fn(),
      handleConvertSubmit: vi.fn(),
      isSaving: false,
      isDeleting: false,
    });

    const html = renderToStaticMarkup(React.createElement(PlatformLeadsPage));
    expect(html).toContain('Nodira Yusupova');
    expect(html).toContain('Kompaniyaga aylantirish');
    expect(html).toContain('+998 94 555 66 77');
  });

  it('renders convert company mode when viewMode is convert_company', () => {
    vi.spyOn(leadsHook, 'usePlatformLeadsPage').mockReturnValue({
      t: (k, { defaultValue } = {}) => defaultValue || k,
      viewMode: 'convert_company',
      convertTargetLead: {
        id: 'lead-1',
        name: 'Nodira Yusupova',
        phone: '+998 94 555 66 77',
        message: 'Oziq-ovqat do\'koni',
        status: 'IN_PROGRESS',
        createdAt: '2026-10-27T16:15:00.000Z',
      },
      setViewMode: vi.fn(),
      handleConvertSubmit: vi.fn(),
      isSaving: false,
    });

    const html = renderToStaticMarkup(React.createElement(PlatformLeadsPage));
    expect(html).toContain('Arizadan kompaniya yaratish');
    expect(html).toContain('Nodira Yusupova');
  });

  it('renders mobile detail view when viewMode is mobile_detail', () => {
    vi.spyOn(leadsHook, 'usePlatformLeadsPage').mockReturnValue({
      t: (k, { defaultValue } = {}) => defaultValue || k,
      viewMode: 'mobile_detail',
      selectedLead: {
        id: 'lead-2',
        name: 'Sherzod Toshmatov',
        phone: '+998 93 222 33 44',
        status: 'NEW',
        createdAt: '2026-11-01T13:05:00.000Z',
      },
      setViewMode: vi.fn(),
      handleStatusChange: vi.fn(),
      handleAddComment: vi.fn(),
      handleStartConvert: vi.fn(),
      isSaving: false,
    });

    const html = renderToStaticMarkup(React.createElement(PlatformLeadsPage));
    expect(html).toContain('Sherzod Toshmatov');
    expect(html).toContain('+998 93 222 33 44 ga qo&#x27;ng&#x27;iroq');
  });
});
