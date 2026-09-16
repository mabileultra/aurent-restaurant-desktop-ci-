package com.pos.pharmacy.sales.support;

import java.time.Instant;
import java.util.UUID;

/** Optional offline sync metadata applied during checkout. */
public record OfflineSaleContext(
    UUID clientSaleId,
    String offlineDeviceId,
    Instant createdAt
) {}
