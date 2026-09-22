package com.pos.reporting.repository;

import java.time.LocalDate;
import java.util.List;

public interface StockDashboardFactsRepository {

    Object[] writeOffTotals(Integer companyId, LocalDate from, LocalDate to, Integer storeId);

    Object[] currentStockTotals(Integer companyId, Integer storeId);

    Object[] restockTotals(Integer companyId, LocalDate from, LocalDate to, Integer storeId);

    long countLowStockSkus(Integer companyId, Integer storeId);

    List<Object[]> dailyWriteOffUnits(Integer companyId, LocalDate from, LocalDate to, Integer storeId);

    List<Object[]> dailyRestockUnits(Integer companyId, LocalDate from, LocalDate to, Integer storeId);
}
