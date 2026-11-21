package com.pos.catalog.dto.product;

import java.util.List;
import java.util.Map;

/**
 * Заголовки загруженного Excel + подсказка маппинга на поля POS.
 */
public record ProductImportHeadersResponse(
    List<String> headers,
    Map<String, String> suggestedMapping,
    List<ProductImportFieldMeta> fields
) {
    public record ProductImportFieldMeta(String key, String label, boolean required) {
    }
}
