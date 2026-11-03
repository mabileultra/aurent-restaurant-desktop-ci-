package com.pos.catalog.controller;

import com.pos.catalog.dto.product.CatalogCutoverStatusResponse;
import com.pos.catalog.service.CatalogCutoverStatusService;
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
@Tag(name = "Catalog Cutover Status", description = "Wave 5.8 cutover readiness snapshot")
@StandardApiResponses
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class CatalogCutoverStatusController {

    private final CatalogCutoverStatusService statusService;

    @GetMapping("/status")
    @Operation(summary = "Catalog cutover flags + remote/outbox snapshot")
    public CatalogCutoverStatusResponse status(@RequestParam(required = false) Integer companyId) {
        return statusService.status(companyId);
    }
}
