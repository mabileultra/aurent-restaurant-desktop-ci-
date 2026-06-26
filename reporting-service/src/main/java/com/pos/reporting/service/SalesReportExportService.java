package com.pos.reporting.service;

import java.time.LocalDate;

public interface SalesReportExportService {

    byte[] exportByProducts( LocalDate from, LocalDate to, Integer storeId, Integer categoryId, String search );
    byte[] exportByCategories(LocalDate from, LocalDate to, Integer storeId);
    byte[] exportByStores(LocalDate from, LocalDate to);
    byte[] exportPeriodCompare(LocalDate from, LocalDate to, Integer storeId);
    byte[] exportDailySummary(LocalDate date);
    byte[] exportCashierPerformance(LocalDate from, LocalDate to);
}

