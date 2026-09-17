package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.sales.dto.MarkSoldCheckResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;

import java.util.List;

public interface PharmacySoldMarkService {

    MarkSoldCheckResponse checkSold(Integer storeId, String code);

    void assertNotSold(Integer companyId, List<String> markCodes);

    void registerSaleMarks(Sale sale, List<SaleItem> items, List<List<String>> marksPerItem);
}
