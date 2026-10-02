package com.pos.restaurant.localfirst.controller;

import com.pos.restaurant.localfirst.dto.IngestLocalEventRequest;
import com.pos.restaurant.localfirst.dto.IngestLocalEventResponse;
import com.pos.restaurant.localfirst.service.LocalEventIngestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rst")
@RequiredArgsConstructor
@Tag(name = "Restaurant local-first sync", description = "Idempotent ingest of desktop outbox events")
public class LocalEventIngestController {

    private final LocalEventIngestService localEventIngestService;

    @PostMapping("/stores/{storeId}/local-events")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'COOK')")
    @Operation(summary = "Принять outbox-событие с десктопа (идемпотентно по deviceId+clientEventId)")
    public IngestLocalEventResponse ingest(
        @PathVariable Integer storeId,
        @Valid @RequestBody IngestLocalEventRequest request
    ) {
        return localEventIngestService.ingest(storeId, request);
    }
}
