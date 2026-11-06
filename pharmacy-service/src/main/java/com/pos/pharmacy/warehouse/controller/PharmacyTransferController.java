package com.pos.pharmacy.warehouse.controller;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyTransferFromReceiptRequest;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyTransferRequest;
import com.pos.pharmacy.warehouse.dto.PharmacyTransferResponse;
import com.pos.pharmacy.warehouse.service.PharmacyStockTransferService;
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
@RequestMapping("/pharmacy/transfers")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Transfers", description = "Перемещения между филиалами")
public class PharmacyTransferController {

    private final PharmacyStockTransferService pharmacyStockTransferService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Переместить выбранные товары между филиалами")
    public ResponseEntity<PharmacyTransferResponse> create(
        @Valid @RequestBody CreatePharmacyTransferRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(pharmacyStockTransferService.create(request));
    }

    @PostMapping("/from-receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Переместить остаток прихода на другой филиал")
    public ResponseEntity<PharmacyTransferResponse> createFromReceipt(
        @Valid @RequestBody CreatePharmacyTransferFromReceiptRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(pharmacyStockTransferService.createFromReceipt(request));
    }

    @GetMapping
    @Operation(summary = "Журнал перемещений")
    public ResponseEntity<PageResponse<PharmacyTransferResponse>> list(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer fromStoreId,
        @RequestParam(required = false) Integer toStoreId,
        @PageableDefault(size = PageLimits.DEFAULT_SIZE) Pageable pageable
    ) {
        Pageable bounded = PageRequest.of(
            PageLimits.normalizePage(pageable.getPageNumber()),
            PageLimits.normalizeSize(pageable.getPageSize()),
            pageable.getSort()
        );
        return ResponseEntity.ok(
            pharmacyStockTransferService.list(from, to, fromStoreId, toStoreId, bounded)
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Перемещение по ID")
    public ResponseEntity<PharmacyTransferResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(pharmacyStockTransferService.getById(id));
    }
}
