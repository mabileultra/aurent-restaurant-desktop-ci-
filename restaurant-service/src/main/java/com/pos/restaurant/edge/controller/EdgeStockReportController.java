package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.service.EdgeStockReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

/** Edge stand-in for cloud reporting-service stock report routes. */
@RestController
@RequestMapping("/reports/stock")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeStockReportController {

    private final EdgeStockReportService reports;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(reports.dashboard(from, to, storeId));
    }

    @GetMapping("/balances")
    public ResponseEntity<Map<String, Object>> balances(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) Integer categoryId,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Boolean onlyWithStock,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reports.balances(storeId, search, onlyWithStock, page, size));
    }

    @GetMapping("/balances/export")
    public ResponseEntity<byte[]> exportBalances() {
        return emptyExport("stock_balances_export.csv");
    }

    @GetMapping("/low-stock")
    public ResponseEntity<Map<String, Object>> lowStock(
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reports.lowStock(page, size));
    }

    @GetMapping("/movements")
    public ResponseEntity<Map<String, Object>> movements(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String movementType,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reports.movements(from, to, storeId, search, movementType, page, size));
    }

    @GetMapping("/inventories")
    public ResponseEntity<Map<String, Object>> inventories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reports.docsByType("INVENTORY", from, to, storeId, page, size));
    }

    @GetMapping("/inventories/export")
    public ResponseEntity<byte[]> exportInventories() {
        return emptyExport("stock_inventories_export.csv");
    }

    @GetMapping("/receipts")
    public ResponseEntity<Map<String, Object>> receipts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reports.docsByType("RECEIPT", from, to, storeId, page, size));
    }

    @GetMapping("/receipts/export")
    public ResponseEntity<byte[]> exportReceipts() {
        return emptyExport("stock_receipts_export.csv");
    }

    @GetMapping("/write-offs")
    public ResponseEntity<Map<String, Object>> writeOffs(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reports.docsByType("WRITE_OFF", from, to, storeId, page, size));
    }

    @GetMapping("/transfers")
    public ResponseEntity<Map<String, Object>> transfers(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reports.transfers(from, to, storeId, page, size));
    }

    private static ResponseEntity<byte[]> emptyExport(String filename) {
        byte[] body = "id\n".getBytes();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(body);
    }
}
