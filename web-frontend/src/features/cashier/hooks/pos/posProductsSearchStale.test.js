import { describe, expect, it } from 'vitest';
import {
  canAddProductFromSearchList,
  isPosProductsSearchStale,
} from './posProductsSearchStale';

describe('isPosProductsSearchStale', () => {
  it('is not stale when search is empty (category browse)', () => {
    expect(
      isPosProductsSearchStale({
        searchActive: false,
        productsPlaceholder: true,
        productsFetching: true,
      }),
    ).toBe(false);
  });

  it('is stale while keepPreviousData placeholder is shown', () => {
    expect(
      isPosProductsSearchStale({
        searchActive: true,
        productsPlaceholder: true,
        productsFetching: true,
        productsLoadingMore: false,
      }),
    ).toBe(true);
  });

  it('is stale while new search is fetching (not page-more)', () => {
    expect(
      isPosProductsSearchStale({
        searchActive: true,
        productsPlaceholder: false,
        productsFetching: true,
        productsLoadingMore: false,
      }),
    ).toBe(true);
  });

  it('is not stale when only loading next page', () => {
    expect(
      isPosProductsSearchStale({
        searchActive: true,
        productsPlaceholder: false,
        productsFetching: true,
        productsLoadingMore: true,
      }),
    ).toBe(false);
  });

  it('is ready after search settled', () => {
    expect(
      isPosProductsSearchStale({
        searchActive: true,
        productsPlaceholder: false,
        productsFetching: false,
        productsLoadingMore: false,
      }),
    ).toBe(false);
  });
});

describe('canAddProductFromSearchList', () => {
  it('blocks add while search list is stale', () => {
    expect(
      canAddProductFromSearchList({
        productsStale: true,
        products: [{ id: 'old-result' }],
      }),
    ).toBe(false);
  });

  it('blocks add when list empty', () => {
    expect(canAddProductFromSearchList({ productsStale: false, products: [] })).toBe(false);
  });

  it('allows add when fresh list has products', () => {
    expect(
      canAddProductFromSearchList({
        productsStale: false,
        products: [{ id: 'p1' }],
      }),
    ).toBe(true);
  });
});
