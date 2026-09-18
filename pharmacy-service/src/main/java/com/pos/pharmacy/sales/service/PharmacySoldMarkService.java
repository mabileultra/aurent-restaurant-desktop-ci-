package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.sales.dto.MarkSoldCheckResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface PharmacySoldMarkService {

    MarkSoldCheckResponse checkSold(Integer storeId, String code);

    void assertNotSold(Integer companyId, List<String> markCodes);

    void registerSaleMarks(Sale sale, List<SaleItem> items, List<List<String>> marksPerItem);

    /**
     * Снять с учёта до {@code limit} уникальных КМ по каждой позиции.
     * @return сырые markCode, которые сняли
     */
    List<String> unregisterForReturn(UUID saleId, Map<UUID, Integer> limitBySaleItemId);

    /** Снять все КМ чека (void). */
    List<String> unregisterAllForSale(UUID saleId);
}
