package com.pos.catalog.repository;

import com.pos.catalog.entity.CatalogOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface CatalogOutboxRepository extends JpaRepository<CatalogOutbox, UUID> {

    List<CatalogOutbox> findByStatusOrderByCreatedAtAsc(String status, Pageable pageable);

    List<CatalogOutbox> findByEventTypeAndCreatedAtAfterOrderByCreatedAtAsc(
        String eventType,
        Instant createdAt,
        Pageable pageable
    );

    long countByStatus(String status);
}
