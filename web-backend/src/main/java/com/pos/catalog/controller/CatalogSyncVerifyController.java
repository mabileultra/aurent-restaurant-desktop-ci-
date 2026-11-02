package com.pos.catalog.controller;

import com.pos.catalog.dto.product.CatalogSyncVerifyResult;
import com.pos.catalog.service.CatalogSyncVerifyService;
import com.pos.config.openapi.StandardApiResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products/catalog-service")
@RequiredArgsConstructor
@Tag(name = "Catalog Service Verify", description = "Wave 4.5 local vs catalog-service counts")
@StandardApiResponses
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class CatalogSyncVerifyController {

    private final CatalogSyncVerifyService verifyService;

    @GetMapping("/verify")
    @Operation(summary = "Compare local product counts with catalog-service")
    public CatalogSyncVerifyResult verify(
        @RequestParam(required = false) Integer companyId,
        @RequestParam(defaultValue = "20") int sampleSize
    ) {
        return verifyService.verify(companyId, sampleSize);
    }
}
