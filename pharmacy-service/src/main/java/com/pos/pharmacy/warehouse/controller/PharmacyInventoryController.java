package com.pos.pharmacy.warehouse.controller;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyInventoryRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyInventoryResponse;
import com.pos.pharmacy.warehouse.service.PharmacyStockInventoryService;
import com.pos.shared.api.PageLimits;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/pharmacy/inventories")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Inventories", description = "Инвентаризация = ADJUSTMENT движений")
public class PharmacyInventoryController {

    private final PharmacyStockInventoryService pharmacyStockInventoryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Провести инвентаризацию (store_stock + lots + audit movements)")
    public ResponseEntity<PharmacyInventoryResponse> create(
        @Valid @RequestBody CreatePharmacyInventoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(pharmacyStockInventoryService.create(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Инвентаризация по ID")
    public ResponseEntity<PharmacyInventoryResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(pharmacyStockInventoryService.getById(id));
    }

    @GetMapping
    @Operation(summary = "Список инвентаризаций")
    public ResponseEntity<PageResponse<PharmacyInventoryResponse>> list(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = PageLimits.DEFAULT_SIZE) Pageable pageable
    ) {
        Pageable bounded = PageRequest.of(
            PageLimits.normalizePage(pageable.getPageNumber()),
            PageLimits.normalizeSize(pageable.getPageSize())
        );
        return ResponseEntity.ok(pharmacyStockInventoryService.list(from, to, storeId, bounded));
    }
}
