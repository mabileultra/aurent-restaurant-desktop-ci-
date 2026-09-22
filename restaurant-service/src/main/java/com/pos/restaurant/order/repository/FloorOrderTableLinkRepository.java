package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.entity.FloorOrderTableLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorOrderTableLinkRepository extends JpaRepository<FloorOrderTableLink, UUID> {

    List<FloorOrderTableLink> findByOrderId(UUID orderId);

    Optional<FloorOrderTableLink> findByTableId(Integer tableId);

    @Query("""
        select l from FloorOrderTableLink l
        join fetch l.order o
        join fetch l.table
        where o.companyId = :companyId and o.storeId = :storeId and o.status in :statuses
        """)
    List<FloorOrderTableLink> findActiveByStore(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("statuses") Collection<com.pos.restaurant.order.domain.OrderStatus> statuses
    );

    void deleteByOrderId(UUID orderId);
}
