package com.pos.catalog.service.imports;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Параметры разбора строк при предпросмотре и подтверждении импорта.
 */
public record ProductImportParseOptions(
    String defaultStorageLocation,
    Map<String, String> columnMapping
) {

    public static ProductImportParseOptions defaults() {
        return new ProductImportParseOptions(null, Map.of());
    }

    public static ProductImportParseOptions fromConfirm(ProductImportConfirmRequest req) {
        if (req == null) {
            return defaults();
        }
        String loc = StringUtils.hasText(req.defaultStorageLocation())
            ? req.defaultStorageLocation().trim()
            : null;
        return new ProductImportParseOptions(loc, copyMapping(req.columnMapping()));
    }

    public static ProductImportParseOptions forPreview(
        String defaultStorageLocation,
        Map<String, String> columnMapping
    ) {
        String loc = StringUtils.hasText(defaultStorageLocation) ? defaultStorageLocation.trim() : null;
        return new ProductImportParseOptions(loc, copyMapping(columnMapping));
    }

    /** @deprecated use {@link #forPreview(String, Map)} */
    public static ProductImportParseOptions forPreview(String defaultStorageLocation) {
        return forPreview(defaultStorageLocation, null);
    }

    public Map<String, String> columnMappingOrEmpty() {
        return columnMapping == null || columnMapping.isEmpty()
            ? Map.of()
            : columnMapping;
    }

    private static Map<String, String> copyMapping(Map<String, String> raw) {
        if (raw == null || raw.isEmpty()) {
            return Map.of();
        }
        Map<String, String> out = new LinkedHashMap<>();
        raw.forEach((k, v) -> {
            if (StringUtils.hasText(k) && StringUtils.hasText(v)) {
                out.put(k.trim(), v.trim());
            }
        });
        return Collections.unmodifiableMap(out);
    }
}
