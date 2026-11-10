package com.pos.pharmacy.taxanalytics.controller;

import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsDayMoneyDto;
import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsReceiptDetailDto;
import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsReceiptRowDto;
import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsVerticalSnapshotDto;
import com.pos.pharmacy.taxanalytics.service.TaxAnalyticsVerticalReceiptService;
import com.pos.pharmacy.taxanalytics.service.TaxAnalyticsVerticalService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Hidden
@RestController
@RequestMapping("/internal/pharmacy/tax-analytics")
@RequiredArgsConstructor
public class InternalTaxAnalyticsController {

    private final TaxAnalyticsVerticalService service;
    private final TaxAnalyticsVerticalReceiptService receipts;

    @GetMapping("/snapshot")
    public TaxAnalyticsVerticalSnapshotDto snapshot(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekFrom,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekTo,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate prevWeekFrom,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate prevWeekTo
    ) {
        return service.snapshot(from, to, weekFrom, weekTo, prevWeekFrom, prevWeekTo);
    }

    @GetMapping("/companies/{companyId}/daily")
    public List<TaxAnalyticsDayMoneyDto> daily(
        @PathVariable int companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return service.daily(companyId, from, to);
    }

    @GetMapping("/companies/{companyId}/receipt-counts")
    public Map<String, Object> receiptCounts(
        @PathVariable int companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return receipts.receiptCounts(companyId, from, to);
    }

    @GetMapping("/companies/{companyId}/receipts/count")
    public long receiptCount(
        @PathVariable int companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "ALL") String kind
    ) {
        return receipts.count(companyId, from, to, kind);
    }

    @GetMapping("/companies/{companyId}/receipts")
    public List<TaxAnalyticsReceiptRowDto> receiptList(
        @PathVariable int companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "ALL") String kind,
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(defaultValue = "0") int offset
    ) {
        return receipts.list(companyId, from, to, kind, Math.min(100, Math.max(1, limit)), Math.max(0, offset));
    }

    @GetMapping("/companies/{companyId}/receipts/{saleId}")
    public TaxAnalyticsReceiptDetailDto receiptDetail(
        @PathVariable int companyId,
        @PathVariable String saleId
    ) {
        TaxAnalyticsReceiptDetailDto detail = receipts.detail(companyId, saleId);
        if (detail == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Receipt not found");
        }
        return detail;
    }

    @GetMapping("/companies/{companyId}/products")
    public List<Map<String, Object>> topProducts(
        @PathVariable int companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "50") int limit
    ) {
        return receipts.topProducts(companyId, from, to, limit);
    }
}
