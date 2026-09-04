package com.pos.restaurant.kitchen.repository;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KitchenTicketRepository extends JpaRepository<KitchenTicket, UUID> {

    @Query("""
        select distinct t from KitchenTicket t
        join fetch t.order o
        left join fetch o.table
        left join fetch t.station
        where t.id = :id and t.companyId = :companyId
        """)
    Optional<KitchenTicket> findByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") Integer companyId);

    @Query("""
        select distinct t from KitchenTicket t
        join fetch t.order o
        left join fetch o.table
        left join fetch t.station
        where t.companyId = :companyId
          and t.storeId = :storeId
          and t.status <> :cancelled
          and t.sentAt >= :since
        order by t.sentAt asc
        """)
    List<KitchenTicket> findActiveBoard(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("cancelled") KitchenTicketStatus cancelled,
        @Param("since") Instant since
    );
    List<KitchenTicket> findByOrderId(UUID orderId);
}
