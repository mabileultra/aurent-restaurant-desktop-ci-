package com.pos.ai.client.poscore;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public interface PosCoreClient {

    /**
     * Resolve product ID by query (SKU, name, or UUID).
     * Returns empty map if not found.
     */
    Map<String, Object> resolveProductId(String query);

    /**
     * Get product lifecycle data.
     * Returns map with summary and events, or error map if failed.
     */
    Map<String, Object> getProductLifecycle(UUID productId, LocalDate from, LocalDate to);
}
