package com.pos.catalog.controller;

import com.pos.catalog.dto.product.CatalogServiceBackfillResult;
import com.pos.catalog.service.CatalogServiceBackfillService;
import com.pos.config.openapi.StandardApiResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products/catalog-service")
@RequiredArgsConstructor
@Tag(name = "Catalog Service Backfill", description = "Wave 4.4 bulk upsert into catalog-service")
@StandardApiResponses
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class CatalogServiceBackfillController {

    private final CatalogServiceBackfillService backfillService;

    @PostMapping("/backfill")
    @Operation(summary = "Backfill one page of products into catalog-service")
    public CatalogServiceBackfillResult backfillPage(
        @RequestParam(required = false) Integer companyId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "100") int size
    ) {
        return backfillService.backfillPage(companyId, page, size);
    }

    @PostMapping("/backfill/all")
    @Operation(summary = "Backfill multiple pages (capped) into catalog-service")
    public CatalogServiceBackfillResult backfillAll(
        @RequestParam(required = false) Integer companyId,
        @RequestParam(defaultValue = "100") int size,
        @RequestParam(defaultValue = "50") int maxPages
    ) {
        return backfillService.backfillAll(companyId, size, maxPages);
    }
}
