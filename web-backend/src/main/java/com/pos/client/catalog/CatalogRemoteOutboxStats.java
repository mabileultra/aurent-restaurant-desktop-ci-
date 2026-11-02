package com.pos.client.catalog;

public record CatalogRemoteOutboxStats(
    long pending,
    long published,
    long failed
) {
}
