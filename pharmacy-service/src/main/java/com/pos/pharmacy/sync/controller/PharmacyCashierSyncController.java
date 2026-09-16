package com.pos.pharmacy.sync.controller;

import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.sync.dto.OfflineSalesBatchRequest;
import com.pos.pharmacy.sync.dto.OfflineSalesBatchResponse;
import com.pos.pharmacy.sync.dto.PharmacySyncBootstrapResponse;
import com.pos.pharmacy.sync.service.PharmacyCashierSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pharmacy/sync")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Sync", description = "Офлайн-касса аптеки: bootstrap и синхронизация продаж")
public class PharmacyCashierSyncController {

    private final PharmacyCashierSyncService syncService;

    @GetMapping("/bootstrap")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Bootstrap каталога аптеки")
    public ResponseEntity<PharmacySyncBootstrapResponse> bootstrap(@RequestParam Integer storeId) {
        return ResponseEntity.ok(syncService.bootstrap(storeId));
    }

    @PostMapping("/sales/batch")
    @PreAuthorize("hasAnyRole('CASHIER', 'WAITER', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Синхронизация офлайн-продаж аптеки")
    public ResponseEntity<OfflineSalesBatchResponse> syncSalesBatch(
        @Valid @RequestBody OfflineSalesBatchRequest request
    ) {
        return ResponseEntity.ok(syncService.syncSalesBatch(request, PharmacyTenantContext.getUserId()));
    }
}
