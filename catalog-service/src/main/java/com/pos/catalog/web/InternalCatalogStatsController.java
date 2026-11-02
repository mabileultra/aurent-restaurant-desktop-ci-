package com.pos.catalog.web;

import com.pos.catalog.dto.CatalogStatsResponse;
import com.pos.catalog.service.CatalogStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/catalog")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog Stats")
public class InternalCatalogStatsController {

    private final CatalogStatsService statsService;

    @GetMapping("/stats")
    @Operation(summary = "Product counts (optional company filter)")
    public CatalogStatsResponse stats(@RequestParam(required = false) Integer companyId) {
        return statsService.stats(companyId);
    }
}
