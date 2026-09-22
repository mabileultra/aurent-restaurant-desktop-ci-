package com.pos.reporting.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface StockFactAnalyticsRepository {

    Page<Object[]> balancesPage(
        Integer companyId,
        Integer storeId,
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    );

    Page<Object[]> turnoverPage(
        Integer companyId,
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        Pageable pageable
    );

    Page<Object[]> deadStockPage(
        Integer companyId,
        LocalDate asOfDate,
        LocalDate cutoffDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Pageable pageable
    );

    Page<Object[]> lowStockPage(Integer companyId, Pageable pageable);
}
