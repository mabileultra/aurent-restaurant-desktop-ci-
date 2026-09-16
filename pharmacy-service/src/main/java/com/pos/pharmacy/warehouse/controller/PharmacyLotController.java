package com.pos.pharmacy.warehouse.controller;

import com.pos.pharmacy.catalog.service.ProductCatalogService;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.warehouse.dto.PharmacyFefoHintResponse;
import com.pos.pharmacy.warehouse.dto.PharmacyLotResponse;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.support.PharmacyLotFefoSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/pharmacy/lots")
@RequiredArgsConstructor
@Tag(name = "Pharmacy Lots", description = "Партии аптечного склада (FEFO)")
public class PharmacyLotController {

    private final PharmacyLotFefoSupport pharmacyLotFefoSupport;
    private final ProductCatalogService productCatalogService;
    private final TenantSupport tenant;

    @GetMapping
    @Operation(summary = "Доступные партии товара (FEFO)")
    public ResponseEntity<List<PharmacyLotResponse>> listLots(
        @RequestParam Integer storeId,
        @RequestParam UUID productId
    ) {
        tenant.requireCompanyId();
        productCatalogService.requireActive(productId);
        List<PharmacyLotResponse> lots = pharmacyLotFefoSupport.listAvailable(productId, storeId).stream()
            .map(this::toResponse)
            .toList();
        return ResponseEntity.ok(lots);
    }

    @GetMapping("/fefo-hints")
    @Operation(summary = "Подсказки FEFO для списка товаров")
    public ResponseEntity<List<PharmacyFefoHintResponse>> fefoHints(
        @RequestParam Integer storeId,
        @RequestParam String productIds
    ) {
        tenant.requireCompanyId();
        List<UUID> ids = Arrays.stream(productIds.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(UUID::fromString)
            .collect(Collectors.toList());
        List<PharmacyFefoHintResponse> hints = pharmacyLotFefoSupport.fefoHints(storeId, ids).stream()
            .map(h -> new PharmacyFefoHintResponse(
                h.productId(),
                h.batchNumber(),
                h.expiryDate(),
                h.lotQuantity()
            ))
            .toList();
        return ResponseEntity.ok(hints);
    }

    private PharmacyLotResponse toResponse(StockLot lot) {
        return new PharmacyLotResponse(
            lot.getId(),
            lot.getProduct().getId(),
            lot.getStoreId(),
            lot.getBatchNumber(),
            lot.getExpiryDate(),
            lot.getQuantity(),
            lot.getPurchasePrice(),
            lot.getUnitSellingPrice()
        );
    }
}
