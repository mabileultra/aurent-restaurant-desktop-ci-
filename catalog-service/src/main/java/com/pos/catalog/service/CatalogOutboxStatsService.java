package com.pos.catalog.service;

import com.pos.catalog.dto.CatalogOutboxStatsResponse;
import com.pos.catalog.repository.CatalogOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogOutboxStatsService {

    private final CatalogOutboxRepository outboxRepository;

    public CatalogOutboxStatsResponse stats() {
        return new CatalogOutboxStatsResponse(
            outboxRepository.countByStatus("PENDING"),
            outboxRepository.countByStatus("PUBLISHED"),
            outboxRepository.countByStatus("FAILED")
        );
    }
}
