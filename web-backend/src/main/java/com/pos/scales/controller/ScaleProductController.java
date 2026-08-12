package com.pos.scales.controller;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.config.openapi.StandardApiResponses;
import com.pos.scales.dto.AssignPluRequest;
import com.pos.scales.dto.DecodeWeightBarcodeResponse;
import com.pos.scales.dto.EncodeWeightBarcodeRequest;
import com.pos.scales.dto.EncodeWeightBarcodeResponse;
import com.pos.scales.dto.ScaleProductDto;
import com.pos.scales.service.ScaleProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/scales")
@RequiredArgsConstructor
@Tag(name = "Scales", description = "Весовые товары, PLU и весовые штрихкоды")
@StandardApiResponses
public class ScaleProductController {

    private final ScaleProductService scaleProductService;

    @GetMapping("/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Список весовых товаров")
    @ApiResponse(responseCode = "200", description = "Весовые товары компании")
    public ResponseEntity<List<ScaleProductDto>> listWeightProducts() {
        return ResponseEntity.ok(scaleProductService.listWeightProducts());
    }

    @GetMapping("/products/plu/{plu}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Товар по PLU")
    @ApiResponse(responseCode = "200", description = "Товар найден")
    public ResponseEntity<ProductResponse> getByPlu(
        @PathVariable String plu,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(scaleProductService.getByPlu(plu, storeId));
    }

    @PutMapping("/products/plu")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Назначить или снять PLU")
    @ApiResponse(responseCode = "200", description = "PLU обновлён")
    public ResponseEntity<ProductResponse> assignPlu(@Valid @RequestBody AssignPluRequest request) {
        return ResponseEntity.ok(scaleProductService.assignPlu(request));
    }

    @PostMapping("/barcode/encode")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Собрать весовой EAN-13")
    @ApiResponse(responseCode = "200", description = "Штрихкод собран")
    public ResponseEntity<EncodeWeightBarcodeResponse> encode(
        @Valid @RequestBody EncodeWeightBarcodeRequest request
    ) {
        return ResponseEntity.ok(scaleProductService.encode(request));
    }

    @GetMapping("/barcode/decode/{barcode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CASHIER')")
    @Operation(summary = "Разобрать весовой EAN-13")
    @ApiResponse(responseCode = "200", description = "Штрихкод разобран")
    public ResponseEntity<DecodeWeightBarcodeResponse> decode(
        @PathVariable String barcode,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(scaleProductService.decode(barcode, storeId));
    }
}
