package com.pos.catalog.web;

import com.pos.catalog.dto.CatalogOutboxResponse;
import com.pos.catalog.service.CatalogOutboxQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/internal/catalog/outbox")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog Outbox", description = "Pending PRODUCT_SNAPSHOT rows for consumers")
public class InternalCatalogOutboxController {

    private final CatalogOutboxQueryService outboxQueryService;

    @GetMapping("/pending")
    @Operation(summary = "List PENDING outbox rows")
    public List<CatalogOutboxResponse> pending(@RequestParam(defaultValue = "50") int limit) {
        return outboxQueryService.pending(limit);
    }

    @PostMapping("/{id}/published")
    @Operation(summary = "Mark outbox row PUBLISHED")
    public void markPublished(@PathVariable UUID id) {
        outboxQueryService.markPublished(id);
    }
}
