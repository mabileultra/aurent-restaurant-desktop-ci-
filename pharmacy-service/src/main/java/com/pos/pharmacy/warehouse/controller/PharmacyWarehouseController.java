package com.pos.pharmacy.warehouse.controller;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.warehouse.dto.*;
import com.pos.pharmacy.warehouse.service.PharmacyStockReceiptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pharmacy/receipts")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Receipts", description = "Приходы аптеки")
public class PharmacyWarehouseController {

    private final PharmacyStockReceiptService pharmacyStockReceiptService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать черновик прихода")
    public ResponseEntity<PharmacyStockReceiptResponse> create(@Valid @RequestBody CreatePharmacyStockReceiptRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pharmacyStockReceiptService.createDraft(request));
    }

    @GetMapping
    @Operation(summary = "Список приходов")
    public ResponseEntity<PageResponse<PharmacyStockReceiptResponse>> list(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(pharmacyStockReceiptService.list(storeId, status, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Приход по ID")
    public ResponseEntity<PharmacyStockReceiptResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(pharmacyStockReceiptService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PharmacyStockReceiptResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdatePharmacyStockReceiptRequest request
    ) {
        return ResponseEntity.ok(pharmacyStockReceiptService.updateDraft(id, request));
    }

    @PutMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PharmacyStockReceiptResponse> replaceLines(
        @PathVariable UUID id,
        @Valid @RequestBody List<PharmacyStockReceiptLineRequest> lines
    ) {
        return ResponseEntity.ok(pharmacyStockReceiptService.replaceLines(id, lines));
    }

    @PostMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PharmacyStockReceiptResponse> addLine(
        @PathVariable UUID id,
        @Valid @RequestBody PharmacyStockReceiptLineRequest line
    ) {
        return ResponseEntity.ok(pharmacyStockReceiptService.addLine(id, line));
    }

    @PutMapping("/{id}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> updateLine(
        @PathVariable UUID id,
        @PathVariable UUID lineId,
        @Valid @RequestBody PharmacyStockReceiptLineRequest line
    ) {
        pharmacyStockReceiptService.updateLine(id, lineId, line);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/lines/mass")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Массово изменить поле строк черновика")
    public ResponseEntity<PharmacyReceiptRevalueResult> massUpdateLines(
        @PathVariable UUID id,
        @Valid @RequestBody PharmacyReceiptMassUpdateRequest request
    ) {
        return ResponseEntity.ok(pharmacyStockReceiptService.massUpdateLines(id, request));
    }

    @PostMapping("/{id}/lines/revalue")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PharmacyReceiptRevalueResult> revalueLines(
        @PathVariable UUID id,
        @Valid @RequestBody PharmacyReceiptRevalueRequest request
    ) {
        return ResponseEntity.ok(pharmacyStockReceiptService.revalueLines(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Удалить черновик прихода")
    public ResponseEntity<Void> deleteDraft(@PathVariable UUID id) {
        pharmacyStockReceiptService.deleteDraft(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PharmacyStockReceiptResponse> removeLine(
        @PathVariable UUID id,
        @PathVariable UUID lineId
    ) {
        return ResponseEntity.ok(pharmacyStockReceiptService.removeLine(id, lineId));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PharmacyStockReceiptResponse> activate(@PathVariable UUID id) {
        return ResponseEntity.ok(pharmacyStockReceiptService.activate(id));
    }
}
