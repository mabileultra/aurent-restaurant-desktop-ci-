package com.pos.reporting.repository;

import java.time.LocalDate;
import java.util.List;

public interface StockDashboardFactsRepository {

    Object[] writeOffTotals(Integer companyId, LocalDate from, LocalDate to, Integer storeId);

    Object[] currentStockTotals(Integer companyId);

    long countLowStockSkus(Integer companyId);

    List<Object[]> dailyWriteOffUnits(Integer companyId, LocalDate from, LocalDate to, Integer storeId);
}
