package com.pos.catalog.dto.product;

public record CatalogCutoverStatusResponse(
    boolean enabled,
    String readMode,
    String writeMode,
    boolean strictRemoteWrite,
    boolean remoteReachable,
    Long remoteTotal,
    Long remoteActive,
    Long outboxPending,
    Long outboxPublished,
    Long outboxFailed,
    boolean soakRecommended,
    String note
) {
}
