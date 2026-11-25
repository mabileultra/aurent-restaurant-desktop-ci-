package com.pos.service.support;

import com.pos.dto.tenant.StoreReceiptProfilePayload;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class StoreReceiptProfileSanitizerTest {

    @Test
    void dropsBlankAndInvalidStoreIds() {
        Map<Integer, StoreReceiptProfilePayload> raw = Map.of(
            0, new StoreReceiptProfilePayload("A", null, null, null),
            12, new StoreReceiptProfilePayload("  Shop  ", "  Addr  ", null, "  "),
            15, new StoreReceiptProfilePayload(null, null, null, null)
        );

        Map<Integer, StoreReceiptProfilePayload> cleaned = StoreReceiptProfileSanitizer.sanitize(raw);

        assertThat(cleaned).containsOnlyKeys(12);
        assertThat(cleaned.get(12).receiptCompanyName()).isEqualTo("Shop");
        assertThat(cleaned.get(12).receiptCompanyAddress()).isEqualTo("Addr");
        assertThat(cleaned.get(12).receiptStir()).isNull();
    }

    @Test
    void returnsNullForEmptyInput() {
        assertThat(StoreReceiptProfileSanitizer.sanitize(null)).isNull();
        assertThat(StoreReceiptProfileSanitizer.sanitize(Map.of())).isNull();
    }
}
