package com.pos.restaurant.repository;

import com.pos.restaurant.domain.TableSessionStatus;
import com.pos.restaurant.entity.TableSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TableSessionRepository extends JpaRepository<TableSession, UUID> {

    @EntityGraph(attributePaths = {"table", "table.hall", "openedBy", "waiter", "lines", "lines.product"})
    Optional<TableSession> findWithDetailsById(UUID id);

    Optional<TableSession> findByTableIdAndStatus(Integer tableId, TableSessionStatus status);

    List<TableSession> findByStoreIdAndStatus(Integer storeId, TableSessionStatus status);

    @EntityGraph(attributePaths = {"table", "waiter", "lines"})
    List<TableSession> findWithLinesByStoreIdAndStatus(Integer storeId, TableSessionStatus status);
}
