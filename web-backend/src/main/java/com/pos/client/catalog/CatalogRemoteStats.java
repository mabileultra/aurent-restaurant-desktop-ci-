package com.pos.client.catalog;

public record CatalogRemoteStats(
    Integer companyId,
    long total,
    long active,
    long inactive
) {
}
