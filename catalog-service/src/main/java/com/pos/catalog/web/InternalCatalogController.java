package com.pos.catalog.web;

import com.pos.catalog.dto.ProductRefResponse;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.service.ProductQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Service-to-service catalog reads (web-backend / edge). Auth: X-Internal-Api-Key.
 */
@RestController
@RequestMapping("/internal/catalog")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog", description = "Cross-service ProductRef API")
public class InternalCatalogController {

    private final ProductQueryService queryService;

    @GetMapping("/products/{id}")
    @Operation(summary = "ProductRef by id")
    public ProductRefResponse getById(@PathVariable UUID id) {
        return queryService.findRefById(id)
            .orElseThrow(() -> CatalogExceptions.notFound("Товар не найден"));
    }

    @GetMapping("/products/{id}/active")
    @Operation(summary = "Active ProductRef by id + company")
    public ProductRefResponse requireActive(
        @PathVariable UUID id,
        @RequestParam Integer companyId
    ) {
        return queryService.requireActiveRef(id, companyId);
    }

    @GetMapping("/products/by-barcode")
    @Operation(summary = "Find active product by barcode")
    public ProductRefResponse byBarcode(
        @RequestParam Integer companyId,
        @RequestParam String barcode
    ) {
        return queryService.findByBarcode(companyId, barcode)
            .orElseThrow(() -> CatalogExceptions.notFound("Товар по штрихкоду не найден"));
    }

    @GetMapping("/products/search")
    @Operation(summary = "Search active products")
    public List<ProductRefResponse> search(
        @RequestParam Integer companyId,
        @RequestParam(required = false, defaultValue = "") String q,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return queryService.searchActive(companyId, q, limit);
    }
}
