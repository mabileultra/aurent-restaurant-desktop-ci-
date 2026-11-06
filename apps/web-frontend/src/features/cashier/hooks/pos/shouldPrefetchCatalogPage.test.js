import { describe, expect, it } from 'vitest';
import { shouldPrefetchCatalogPage } from './shouldPrefetchCatalogPage';

describe('shouldPrefetchCatalogPage', () => {
  it('prefetches the next pages after the first loaded when budget allows', () => {
    expect(shouldPrefetchCatalogPage({
      enabled: true,
      pagesLoaded: 1,
      hasNextPage: true,
      isFetchingNextPage: false,
      maxPrefetchPages: 3,
    })).toBe(true);
    expect(shouldPrefetchCatalogPage({
      enabled: true,
      pagesLoaded: 2,
      hasNextPage: true,
      isFetchingNextPage: false,
      maxPrefetchPages: 3,
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

  it('stops after the prefetch budget', () => {
    expect(shouldPrefetchCatalogPage({
      enabled: true,
      pagesLoaded: 1,
      hasNextPage: true,
      isFetchingNextPage: false,
    })).toBe(false);
  });
});
