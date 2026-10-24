package com.pos.integrations.marking.service;

import com.pos.integrations.marking.dto.MarkSoldCheckResponse;
import com.pos.sales.dto.sale.SaleItemRequest;
import com.pos.sales.entity.Sale;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface MarkingSoldJournalService {

    MarkSoldCheckResponse checkSold(Integer companyId, String code);

    void assertNotSold(Integer companyId, List<String> markCodes);

    void registerSaleMarks(Sale sale, List<List<String>> marksPerItem);

    default void registerFromRequest(Sale sale, List<SaleItemRequest> items) {
        registerSaleMarks(sale, MarkingAfterSaleService.marksPerItem(items));
    }

    List<String> unregisterAllForSale(UUID saleId);

    List<String> unregisterForReturn(UUID saleId, Map<UUID, Integer> limitBySaleItemId);
}
