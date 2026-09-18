package com.pos.reporting.service.impl;

import com.pos.reporting.export.ReportExcelWriter;
import com.pos.reporting.export.StockExportTemplate;
import com.pos.reporting.export.mapper.StockExportRowMapper;
import com.pos.reporting.service.DeadStockReportService;
import com.pos.reporting.service.StockBalanceReportService;
import com.pos.reporting.service.StockInventoryReportService;
import com.pos.reporting.service.StockMovementReportService;
import com.pos.reporting.service.StockReportExportService;
import com.pos.reporting.service.StockTransferReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StockReportExportServiceImpl implements StockReportExportService {

    private final StockBalanceReportService stockBalanceReportService;
    private final DeadStockReportService deadStockReportService;
    private final StockMovementReportService stockMovementReportService;
    private final StockInventoryReportService stockInventoryReportService;
    private final StockTransferReportService stockTransferReportService;
    private final StockExportRowMapper stockExportRowMapper;
    private final ReportExcelWriter reportExcelWriter;

    @Override
    public byte[] exportBalances(
        Integer categoryId,
        String search,
        boolean onlyWithStock
    ) {
        var rows = stockBalanceReportService.listAll(categoryId, search, onlyWithStock);
        return reportExcelWriter.write(
            StockExportTemplate.STOCK_BALANCES,
            stockExportRowMapper.balanceRows(rows)
        );
    }

    @Override
    public byte[] exportDeadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search
    ) {
        var rows = deadStockReportService.listAll(asOfDate, daysNoSale, categoryId, search);
        return reportExcelWriter.write(
            StockExportTemplate.DEAD_STOCK,
            stockExportRowMapper.deadStockRows(rows)
        );
    }

    @Override
    public byte[] exportAdjustments(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        String search
    ) {
        var rows = stockMovementReportService.listAll(from, to, "ADJUSTMENT", storeId, search);
        return reportExcelWriter.write(
            StockExportTemplate.STOCK_ADJUSTMENTS,
            stockExportRowMapper.movementRows(rows)
        );
    }

    @Override
    public byte[] exportInventories(LocalDate from, LocalDate to, Integer storeId) {
        var rows = stockInventoryReportService.listAll(from, to, storeId);
        return reportExcelWriter.write(
            StockExportTemplate.STOCK_INVENTORIES,
            stockExportRowMapper.inventoryRows(rows)
        );
    }

    @Override
    public byte[] exportTransfers(LocalDate from, LocalDate to, Integer fromStoreId, Integer toStoreId) {
        var rows = stockTransferReportService.listAll(from, to, fromStoreId, toStoreId);
        return reportExcelWriter.write(
            StockExportTemplate.STOCK_TRANSFERS,
            stockExportRowMapper.transferRows(rows)
        );
    }
}
