package com.pos.reporting.service.impl;

import com.pos.reporting.service.StoreSalesReportService;

import com.pos.reporting.service.ProductSalesReportService;

import com.pos.reporting.service.PeriodCompareService;

import com.pos.reporting.service.DailySummaryService;

import com.pos.reporting.service.CategorySalesReportService;

import com.pos.reporting.service.CashierPerformanceService;

import com.pos.reporting.service.SalesReportExportService;

import com.pos.reporting.export.ReportExcelWriter;
import com.pos.reporting.export.SalesExportTemplate;
import com.pos.reporting.export.mapper.SalesExportRowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalesReportExportServiceImpl implements SalesReportExportService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final ProductSalesReportService productSalesReportService;
    private final CategorySalesReportService categorySalesReportService;
    private final StoreSalesReportService storeSalesReportService;
    private final PeriodCompareService periodCompareService;
    private final DailySummaryService dailySummaryService;
    private final CashierPerformanceService cashierPerformanceService;
    private final SalesExportRowMapper salesExportRowMapper;
    private final ReportExcelWriter reportExcelWriter;

    @Override
    public byte[] exportByProducts(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search
    ) {
        var rows = productSalesReportService.byProducts(from, to, storeId, categoryId, search, Pageable.unpaged()).content();
        return reportExcelWriter.write(
            SalesExportTemplate.SALES_BY_PRODUCTS,
            salesExportRowMapper.productRows(rows)
        );
    }

    @Override
    public byte[] exportByCategories(LocalDate from, LocalDate to, Integer storeId) {
        var rows = categorySalesReportService.byCategories(from, to, storeId, Pageable.unpaged()).content();
        return reportExcelWriter.write(
            SalesExportTemplate.SALES_BY_CATEGORIES,
            salesExportRowMapper.categoryRows(rows)
        );
    }

    @Override
    public byte[] exportByStores(LocalDate from, LocalDate to) {
        var rows = storeSalesReportService.byStores(from, to, Pageable.unpaged()).content();
        return reportExcelWriter.write(
            SalesExportTemplate.SALES_BY_STORES,
            salesExportRowMapper.storeRows(rows)
        );
    }

    @Override
    public byte[] exportPeriodCompare(LocalDate from, LocalDate to, Integer storeId) {
        var compare = periodCompareService.compare(from, to, storeId);
        return reportExcelWriter.write(
            SalesExportTemplate.PERIOD_COMPARE,
            salesExportRowMapper.periodCompareRows(compare)
        );
    }

    @Override
    public byte[] exportDailySummary(LocalDate date) {
        LocalDate reportDate = date != null ? date : LocalDate.now(ZONE);
        var summary = dailySummaryService.dailySummary(reportDate);
        return reportExcelWriter.write(
            SalesExportTemplate.DAILY_SUMMARY,
            salesExportRowMapper.dailySummaryRow(reportDate, summary)
        );
    }

    @Override
    public byte[] exportCashierPerformance(LocalDate from, LocalDate to) {
        var rows = cashierPerformanceService.performance(from, to);
        return reportExcelWriter.write(
            SalesExportTemplate.CASHIER_PERFORMANCE,
            salesExportRowMapper.cashierRows(rows)
        );
    }
}
