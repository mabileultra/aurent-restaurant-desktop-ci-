package com.pos.pharmacy.pricing.registry.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PriceRegistryExcelFetcherTest {

    @Test
    void readsOfficialFileNameFromContentDisposition() {
        String name = PriceRegistryExcelFetcher.fileName(
            "attachment; filename=\"2026-11-13-referent-prices.xlsx\"",
            "https://api.mpa.uz/drug-catalog-api/v2/referent-price/excel"
        );
        assertEquals("2026-11-13-referent-prices.xlsx", name);
    }

    @Test
    void fallsBackToUrlTailWhenDispositionHasNoName() {
        String name = PriceRegistryExcelFetcher.fileName(
            "",
            "https://api.mpa.uz/drug-catalog-api/v2/referent-price/excel"
        );
        assertEquals("excel", name);
    }
}
