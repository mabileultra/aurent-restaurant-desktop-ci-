package com.pos.pharmacy.catalog.controller;

import com.pos.pharmacy.catalog.dto.BulkTaxRateRequest;
import com.pos.pharmacy.catalog.dto.CreateProductRequest;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.catalog.dto.UpdateProductRequest;
import com.pos.pharmacy.catalog.service.PharmacyProductService;
import com.pos.pharmacy.common.ApiResponse;
import com.pos.pharmacy.common.PageResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/pharmacy/products")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Products", description = "Каталог аптеки")
public class PharmacyProductController {

    private final PharmacyProductService pharmacyProductService;

    @GetMapping
    @Operation(summary = "Список аптечных товаров")
    public ResponseEntity<PageResponse<ProductResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "false") boolean activeOnly,
        @RequestParam(required = false) String scope,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 50) Pageable pageable
    ) {
        return ResponseEntity.ok(pharmacyProductService.list(search, activeOnly, scope, storeId, pageable));
    }

    @GetMapping("/barcode/{barcode}")
    @Operation(summary = "Аптечный товар по штрихкоду")
    public ResponseEntity<ProductResponse> getByBarcode(
        @PathVariable String barcode,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(pharmacyProductService.getByBarcode(barcode, storeId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Аптечный товар по ID")
    public ResponseEntity<ProductResponse> get(
        @PathVariable UUID id,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(pharmacyProductService.get(id, storeId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать аптечный товар")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pharmacyProductService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить аптечный товар")
    public ResponseEntity<ProductResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateProductRequest request
    ) {
        return ResponseEntity.ok(pharmacyProductService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Деактивировать аптечный товар", description = "Мягкое удаление. Штрихкод и артикул освобождаются")
    public ResponseEntity<ApiResponse> deactivate(@PathVariable UUID id) {
        pharmacyProductService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Product deactivated"));
    }

    @PatchMapping("/bulk/tax-rate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Массовое изменение НДС")
    public ResponseEntity<ApiResponse> bulkTaxRate(@Valid @RequestBody BulkTaxRateRequest request) {
        int n = pharmacyProductService.bulkUpdateTaxRate(request);
        return ResponseEntity.ok(ApiResponse.success("Updated tax for " + n + " products"));
    }
}
