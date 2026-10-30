package com.pos.sales.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.entity.User;
import com.pos.sales.dto.sync.OfflineSalesBatchRequest;
import com.pos.sales.dto.sync.OfflineSalesBatchResponse;
import com.pos.sales.service.sync.CashierSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Alias for {@code POST /sync/sales/batch} — path expected by desktop clients.
 */
@RestController
@RequestMapping("/cashier/sales")
@RequiredArgsConstructor
@Tag(name = "Cashier Sales Sync", description = "Офлайн batch-синхронизация продаж")
@StandardApiResponses
public class CashierSalesBatchSyncController {

    private final CashierSyncService cashierSyncService;

    @PostMapping("/batch-sync")
    @Operation(summary = "Batch sync офлайн-продаж", description = "Тот же контракт, что POST /sync/sales/batch")
    @ApiResponse(responseCode = "200", description = "Результаты по каждой продаже")
    public ResponseEntity<OfflineSalesBatchResponse> batchSync(
        @Valid @RequestBody OfflineSalesBatchRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(cashierSyncService.syncSalesBatch(request, currentUser.getId()));
    }
}
