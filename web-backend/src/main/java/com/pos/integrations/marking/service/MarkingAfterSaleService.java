package com.pos.integrations.marking.service;

import com.pos.sales.dto.sale.SaleItemRequest;

import java.util.List;

/**
 * Вывод КМ после фискального чека (опрос ASL). Не аптечный сценарий:
 * grocery и pharmacy зовут один контракт. Retail WITHDRAWN для чужих касс — Labels в ОФД.
 */
public interface MarkingAfterSaleService {

    void enqueueAfterSale(Integer storeId, List<String> codes, boolean fiscalConfirmed);

    static List<String> codesOf(List<SaleItemRequest> items) {
        return marksPerItem(items).stream()
            .flatMap(List::stream)
            .distinct()
            .toList();
    }

    static List<List<String>> marksPerItem(List<SaleItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        return items.stream()
            .map(item -> {
                if (item == null || item.productMarks() == null) {
                    return List.<String>of();
                }
                return item.productMarks().stream()
                    .filter(code -> code != null && !code.isBlank())
                    .map(String::trim)
                    .toList();
            })
            .toList();
    }
}
