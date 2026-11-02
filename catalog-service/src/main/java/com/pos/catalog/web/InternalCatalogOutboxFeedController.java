package com.pos.catalog.web;

import com.pos.catalog.dto.CatalogOutboxResponse;
import com.pos.catalog.entity.CatalogOutbox;
import com.pos.catalog.event.CatalogEventTypes;
import com.pos.catalog.repository.CatalogOutboxRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/**
 * Read-feed for desktop / multi-consumers — does not mutate outbox status (Kafka dispatch owns that).
 */
@RestController
@RequestMapping("/internal/catalog/outbox")
@RequiredArgsConstructor
@Tag(name = "Internal Catalog Outbox Feed")
public class InternalCatalogOutboxFeedController {

    private final CatalogOutboxRepository outboxRepository;

    @GetMapping("/feed")
    @Operation(summary = "PRODUCT_SNAPSHOT rows created after since (any status)")
    public List<CatalogOutboxResponse> feed(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since,
        @RequestParam(defaultValue = "100") int limit
    ) {
        Instant safeSince = since != null ? since : Instant.EPOCH;
        int size = Math.min(Math.max(limit, 1), 200);
        return outboxRepository
            .findByEventTypeAndCreatedAtAfterOrderByCreatedAtAsc(
                CatalogEventTypes.PRODUCT_SNAPSHOT,
                safeSince,
                PageRequest.of(0, size)
            )
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private CatalogOutboxResponse toResponse(CatalogOutbox row) {
        return new CatalogOutboxResponse(
            row.getId(),
            row.getEventType(),
            row.getAggregateId(),
            row.getCompanyId(),
            row.getPayload(),
            row.getStatus(),
            row.getAttempts(),
            row.getCreatedAt()
        );
    }
}
