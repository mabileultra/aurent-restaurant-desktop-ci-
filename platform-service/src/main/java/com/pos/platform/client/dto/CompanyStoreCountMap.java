package com.pos.platform.client.dto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class CompanyStoreCountMap {

    private CompanyStoreCountMap() {
    }

    public static Map<Integer, Integer> fromItems(List<CompanyStoreCountItem> items) {
        if (items == null || items.isEmpty()) {
            return Map.of();
        }
        Map<Integer, Integer> counts = new HashMap<>();
        for (CompanyStoreCountItem item : items) {
            if (item == null) {
                continue;
            }
            counts.put(item.companyId(), item.storeCount());
        }
        return counts;
    }
}
