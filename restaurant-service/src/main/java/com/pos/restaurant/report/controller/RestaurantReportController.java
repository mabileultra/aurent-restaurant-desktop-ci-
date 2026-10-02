package com.pos.restaurant.report.controller;

import com.pos.restaurant.report.dto.DishSalesReportResponse;
import com.pos.restaurant.report.dto.ReceiptExportRequest;
import com.pos.restaurant.report.dto.SalesSummaryResponse;
import com.pos.restaurant.report.dto.ShiftCashReportResponse;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.restaurant.report.dto.ReceiptJournalResponse;
import com.pos.restaurant.report.service.RestaurantReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rst/stores/{storeId}/reports")
@RequiredArgsConstructor
@Tag(name = "Restaurant reports", description = "Журнал чеков и выгрузки")
public class RestaurantReportController {

    private static final MediaType XLSX =
        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final RestaurantReportService reportService;

    @GetMapping("/receipts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Журнал чеков: фильтры, страницы, итоги по фильтру")
    public ReceiptJournalResponse receipts(
        @PathVariable Integer storeId,
        @ModelAttribute ReceiptJournalFilter filter,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return reportService.receipts(storeId, filter, page, size);
    }

    @PostMapping("/receipts/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Журнал чеков в Excel (xlsx)")
    public ResponseEntity<byte[]> exportReceipts(
        @PathVariable Integer storeId,
        @Valid @RequestBody ReceiptExportRequest request
    ) {
        return xlsx(reportService.exportReceipts(storeId, request), "receipts.xlsx");
    }

    @GetMapping("/sales-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Итоги продаж: оплаты, карты, каналы, залы, часы и дни")
    public SalesSummaryResponse salesSummary(
        @PathVariable Integer storeId,
        @ModelAttribute ReceiptJournalFilter filter,
        @RequestParam(required = false) String timeZone
    ) {
        return reportService.salesSummary(storeId, filter, timeZone);
    }

    @GetMapping("/dishes")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Продажи по блюдам за период")
    public DishSalesReportResponse dishSales(
        @PathVariable Integer storeId,
        @ModelAttribute ReceiptJournalFilter filter
    ) {
        return reportService.dishSales(storeId, filter);
    }

    @PostMapping("/dishes/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Продажи по блюдам в Excel (xlsx)")
    public ResponseEntity<byte[]> exportDishSales(
        @PathVariable Integer storeId,
        @Valid @RequestBody ReceiptExportRequest request
    ) {
        return xlsx(reportService.exportDishSales(storeId, request), "dishes.xlsx");
    }

    @GetMapping("/shifts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Касса и смены: расчёт, факт и разница")
    public ShiftCashReportResponse shiftCash(
        @PathVariable Integer storeId,
        @ModelAttribute ReceiptJournalFilter filter
    ) {
        return reportService.shiftCash(storeId, filter);
    }

    @PostMapping("/shifts/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Касса и смены в Excel (xlsx)")
    public ResponseEntity<byte[]> exportShiftCash(
        @PathVariable Integer storeId,
        @Valid @RequestBody ReceiptExportRequest request
    ) {
        return xlsx(reportService.exportShiftCash(storeId, request), "shifts.xlsx");
    }

    private static ResponseEntity<byte[]> xlsx(byte[] body, String filename) {
        return ResponseEntity.ok()
            .contentType(XLSX)
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(filename).build().toString()
            )
            .body(body);
    }
}
