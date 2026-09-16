package com.pos.pharmacy.revenue.repository;

import com.pos.pharmacy.revenue.entity.RevenueOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RevenueOutboxRepository extends JpaRepository<RevenueOutbox, UUID> {

    Optional<RevenueOutbox> findByIdempotencyKey(String idempotencyKey);

    @Query("""
        select o from RevenueOutbox o
        where o.status in :statuses
          and (o.nextRetryAt is null or o.nextRetryAt <= :now)
        order by o.createdAt asc
        """)
    List<RevenueOutbox> findReadyForRetry(
        @Param("statuses") Collection<String> statuses,
        @Param("now") Instant now,
        Pageable pageable
    );
}
