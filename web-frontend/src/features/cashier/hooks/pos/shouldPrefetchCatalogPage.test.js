import { describe, expect, it } from 'vitest';
import { shouldPrefetchCatalogPage } from './shouldPrefetchCatalogPage';

describe('shouldPrefetchCatalogPage', () => {
  it('prefetches only the second page after the first loaded', () => {
    expect(shouldPrefetchCatalogPage({
      enabled: true,
      pagesLoaded: 1,
      hasNextPage: true,
      isFetchingNextPage: false,
    })).toBe(true);
  });

  it('does not prefetch while the first page is still loading', () => {
    expect(shouldPrefetchCatalogPage({
      enabled: true,
      pagesLoaded: 0,
      hasNextPage: true,
      isFetchingNextPage: false,
    })).toBe(false);
  });

  it('does not walk the whole catalog', () => {
    expect(shouldPrefetchCatalogPage({
      enabled: true,
      pagesLoaded: 2,
      hasNextPage: true,
      isFetchingNextPage: false,
    })).toBe(false);
  });
});
