package com.pos.restaurant.report.service.impl;

import com.pos.restaurant.report.dto.DishSalesReportResponse;
import com.pos.restaurant.report.dto.ReceiptExportRequest;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.restaurant.report.dto.ReceiptJournalResponse;
import com.pos.restaurant.report.dto.SalesSummaryResponse;
import com.pos.restaurant.report.dto.ShiftCashReportResponse;
import com.pos.restaurant.report.service.RestaurantReportService;
import com.pos.restaurant.report.support.DishSalesReportHandler;
import com.pos.restaurant.report.support.ReceiptJournalReportHandler;
import com.pos.restaurant.report.support.SalesSummaryReportHandler;
import com.pos.restaurant.report.support.ShiftCashReportHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RestaurantReportServiceImpl implements RestaurantReportService {

    private final ReceiptJournalReportHandler journalHandler;
    private final SalesSummaryReportHandler salesSummaryHandler;
    private final DishSalesReportHandler dishSalesHandler;
    private final ShiftCashReportHandler shiftCashHandler;

    @Override
    public ReceiptJournalResponse receipts(Integer storeId, ReceiptJournalFilter filter, int page, int size) {
        return journalHandler.page(storeId, filter, page, size);
    }

    @Override
    public byte[] exportReceipts(Integer storeId, ReceiptExportRequest request) {
        return journalHandler.export(storeId, request);
    }

    @Override
    public SalesSummaryResponse salesSummary(Integer storeId, ReceiptJournalFilter filter, String timeZone) {
        return salesSummaryHandler.summary(storeId, filter, timeZone);
    }

    @Override
    public DishSalesReportResponse dishSales(Integer storeId, ReceiptJournalFilter filter) {
        return dishSalesHandler.dishes(storeId, filter);
    }

    @Override
    public byte[] exportDishSales(Integer storeId, ReceiptExportRequest request) {
        return dishSalesHandler.export(storeId, request);
    }

    @Override
    public ShiftCashReportResponse shiftCash(Integer storeId, ReceiptJournalFilter filter) {
        return shiftCashHandler.shiftCash(storeId, filter);
    }

    @Override
    public byte[] exportShiftCash(Integer storeId, ReceiptExportRequest request) {
        return shiftCashHandler.export(storeId, request);
    }
}
