package com.pos.catalog.service;

import com.pos.catalog.dto.CatalogOutboxResponse;
import com.pos.catalog.entity.CatalogOutbox;
import com.pos.catalog.repository.CatalogOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogOutboxQueryService {

    private final CatalogOutboxRepository outboxRepository;

    @Transactional(readOnly = true)
    public List<CatalogOutboxResponse> pending(int limit) {
        int size = Math.min(Math.max(limit, 1), 200);
        return outboxRepository.findByStatusOrderByCreatedAtAsc("PENDING", PageRequest.of(0, size)).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public void markPublished(UUID id) {
        outboxRepository.findById(id).ifPresent(row -> {
            row.setStatus("PUBLISHED");
            row.setPublishedAt(Instant.now());
            outboxRepository.save(row);
        });
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
