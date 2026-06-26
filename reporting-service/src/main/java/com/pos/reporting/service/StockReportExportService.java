package com.pos.reporting.service;

import java.time.LocalDate;

public interface StockReportExportService {

    byte[] exportBalances( Integer categoryId, String search, boolean onlyWithStock, String authorization );
    byte[] exportDeadStock( LocalDate asOfDate, int daysNoSale, Integer categoryId, String search, String authorization );
    byte[] exportAdjustments(LocalDate from, LocalDate to, Integer storeId, String search);
    byte[] exportInventories(LocalDate from, LocalDate to, Integer storeId);
    byte[] exportTransfers(LocalDate from, LocalDate to, Integer fromStoreId, Integer toStoreId);
}

