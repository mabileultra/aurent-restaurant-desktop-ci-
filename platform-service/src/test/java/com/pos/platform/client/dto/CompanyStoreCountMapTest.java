package com.pos.platform.client.dto;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CompanyStoreCountMapTest {

    @Test
    void emptyItemsBecomeEmptyMap() {
        assertTrue(CompanyStoreCountMap.fromItems(null).isEmpty());
        assertTrue(CompanyStoreCountMap.fromItems(List.of()).isEmpty());
    }

    @Test
    void mapsCompanyIdToCount() {
        Map<Integer, Integer> counts = CompanyStoreCountMap.fromItems(List.of(
            new CompanyStoreCountItem(4, 2),
            new CompanyStoreCountItem(9, 0)
        ));
        assertEquals(2, counts.get(4));
        assertEquals(0, counts.get(9));
    }
}
