package com.pos.catalog.web;

import com.pos.catalog.config.CatalogOutboxProperties;
import com.pos.catalog.service.CatalogOutboxDispatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/internal/catalog/outbox")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog Outbox Dispatch")
public class InternalCatalogOutboxDispatchController {

    private final CatalogOutboxDispatchService dispatchService;
    private final CatalogOutboxProperties properties;

    @PostMapping("/dispatch")
    @Operation(summary = "Manually dispatch a PENDING outbox batch")
    public Map<String, Object> dispatch(@RequestParam(required = false) Integer limit) {
        int batch = limit != null ? limit : properties.getBatchSize();
        int published = dispatchService.dispatchBatch(batch);
        return Map.of(
            "published", published,
            "batchSize", batch,
            "transport", properties.getTransport()
        );
    }
}
