package com.pos.service.support;

import com.pos.dto.tenant.StoreReceiptProfilePayload;
import com.pos.util.TextUtil;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** Sanitizes per-store receipt header overrides for tenant display settings. */
public final class StoreReceiptProfileSanitizer {

    private StoreReceiptProfileSanitizer() {}

    public static Map<Integer, StoreReceiptProfilePayload> sanitize(
        Map<Integer, StoreReceiptProfilePayload> raw
    ) {
        if (raw == null || raw.isEmpty()) {
            return null;
        }
        Map<Integer, StoreReceiptProfilePayload> out = new LinkedHashMap<>();
        for (Map.Entry<Integer, StoreReceiptProfilePayload> entry : raw.entrySet()) {
            Integer storeId = entry.getKey();
            StoreReceiptProfilePayload profile = entry.getValue();
            if (storeId == null || storeId <= 0 || profile == null) {
                continue;
            }
            StoreReceiptProfilePayload cleaned = new StoreReceiptProfilePayload(
                TextUtil.trimOrNull(profile.receiptCompanyName()),
                TextUtil.trimOrNull(profile.receiptCompanyAddress()),
                TextUtil.trimOrNull(profile.receiptCompanyPhone()),
                TextUtil.trimOrNull(profile.receiptStir())
            );
            if (isBlank(cleaned)) {
                continue;
            }
            out.put(storeId, cleaned);
        }
        return out.isEmpty() ? null : Collections.unmodifiableMap(out);
    }

    private static boolean isBlank(StoreReceiptProfilePayload p) {
        return p.receiptCompanyName() == null
            && p.receiptCompanyAddress() == null
            && p.receiptCompanyPhone() == null
            && p.receiptStir() == null;
    }
}
