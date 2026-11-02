package com.pos.catalog.controller;

import com.pos.catalog.dto.product.CatalogCategoryBackfillResult;
import com.pos.catalog.service.CatalogCategoryBackfillService;
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
@Tag(name = "Catalog Category Backfill", description = "Wave 5.2 category upsert into catalog-service")
@StandardApiResponses
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class CatalogCategoryBackfillController {

    private final CatalogCategoryBackfillService backfillService;

    @PostMapping("/backfill-categories")
    @Operation(summary = "Backfill categories into catalog-service (run before product backfill)")
    public CatalogCategoryBackfillResult backfill(
        @RequestParam(required = false) Integer companyId
    ) {
        return backfillService.backfill(companyId);
    }
}
