package com.pos.restaurant.repository;

import com.pos.restaurant.entity.TableSessionLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TableSessionLineRepository extends JpaRepository<TableSessionLine, UUID> {

    List<TableSessionLine> findBySessionIdOrderBySortOrderAscCreatedAtAsc(UUID sessionId);

    Optional<TableSessionLine> findByIdAndSessionId(UUID lineId, UUID sessionId);
}
