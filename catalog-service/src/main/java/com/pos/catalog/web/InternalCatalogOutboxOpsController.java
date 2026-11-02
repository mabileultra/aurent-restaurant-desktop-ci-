package com.pos.catalog.web;

import com.pos.catalog.dto.CatalogOutboxStatsResponse;
import com.pos.catalog.service.CatalogOutboxRetryService;
import com.pos.catalog.service.CatalogOutboxStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/internal/catalog/outbox")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog Outbox Ops")
public class InternalCatalogOutboxOpsController {

    private final CatalogOutboxStatsService statsService;
    private final CatalogOutboxRetryService retryService;

    @GetMapping("/stats")
    @Operation(summary = "Outbox status counts")
    public CatalogOutboxStatsResponse stats() {
        return statsService.stats();
    }

    @PostMapping("/retry-failed")
    @Operation(summary = "Requeue FAILED rows back to PENDING")
    public Map<String, Object> retryFailed(@RequestParam(defaultValue = "50") int limit) {
        int requeued = retryService.requeueFailed(limit);
        return Map.of("requeued", requeued, "limit", limit);
    }
}
