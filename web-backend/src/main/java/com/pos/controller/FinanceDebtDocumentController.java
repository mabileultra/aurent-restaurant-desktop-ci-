package com.pos.controller;

import com.pos.dto.sale.SaleResponse;
import com.pos.inventory.dto.warehouse.StockReceiptResponse;
import com.pos.service.SaleService;
import com.pos.inventory.service.stock.StockReceiptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/finance/debts/documents")
@RequiredArgsConstructor
@Tag(name = "Finance debt documents", description = "Детали документов POS для записей долгов")
public class FinanceDebtDocumentController {

    private final StockReceiptService stockReceiptService;
    private final SaleService saleService;

    @GetMapping("/receipts/{receiptId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Приход по ID", description = "Строки прихода для детализации долга поставщику")
    public ResponseEntity<StockReceiptResponse> receipt(@PathVariable UUID receiptId) {
        return ResponseEntity.ok(stockReceiptService.getById(receiptId));
    }

    @GetMapping("/sales/{saleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Продажа по ID", description = "Строки чека для детализации долга клиента или аванса")
    public ResponseEntity<SaleResponse> sale(@PathVariable UUID saleId) {
        return ResponseEntity.ok(saleService.getSale(saleId));
    }
}
