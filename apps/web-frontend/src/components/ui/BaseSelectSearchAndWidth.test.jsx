import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BaseSelectMenuPortal from './BaseSelectMenuPortal';
import { filterVisibleOptions } from './baseSelectHelpers';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

globalThis.document = { body: {} };

describe('BaseSelect Search and Width specs', () => {
  it('renders portal menu with minWidth matching menuStyle width', () => {
    const html = renderToStaticMarkup(
      <BaseSelectMenuPortal
        open={true}
        menuRef={{ current: null }}
        listId="test-list"
        isAa={false}
        menuClassName="min-w-[280px]"
        menuStyle={{ top: 100, left: 50, width: 280, triggerWidth: 160, minWidth: 280 }}
        searchable={true}
        searchRef={{ current: null }}
        query=""
        searchPh="Qidiruv..."
        onQueryChange={vi.fn()}
        highlightIndex={-1}
        setHighlightIndex={vi.fn()}
        visibleOptions={[{ value: '1', label: 'ZINNUR URG MCHG (66245)' }]}
        commitSelection={vi.fn()}
        closeMenu={vi.fn()}
        emptyMessage="Topilmadi"
        emptyTextFallback="Topilmadi"
        effectiveValue=""
      />
    );

    expect(html).toContain('width:280px');
    expect(html).toContain('min-width:280px');
    expect(html).toContain('ZINNUR URG MCHG (66245)');
  });

  it('filters long company names correctly', () => {
    const options = [
      { value: '1', label: 'ZINNUR URG MCHG (66245)' },
      { value: '2', label: 'TURAN M STORES (23849)' },
    ];
    const res = filterVisibleOptions(options, 'zinnur');
    expect(res).toHaveLength(1);
    expect(res[0].label).toBe('ZINNUR URG MCHG (66245)');
  });
});
