package com.pos.sales.service;

import com.pos.sales.dto.sale.SaleItemRequest;

import java.util.List;

/** После фискального чека: опрос/подтверждение вывода КМ в ASL (SmartPOS/E-POS читают ASL, не ОФД). */
public interface PosSaleAslWithdrawService {

    void enqueueAfterSale(Integer storeId, List<String> codes, boolean fiscalConfirmed);

    static List<String> codesOf(List<SaleItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        return items.stream()
            .filter(item -> item != null && item.productMarks() != null)
            .flatMap(item -> item.productMarks().stream())
            .filter(code -> code != null && !code.isBlank())
            .map(String::trim)
            .distinct()
            .toList();
    }
}
