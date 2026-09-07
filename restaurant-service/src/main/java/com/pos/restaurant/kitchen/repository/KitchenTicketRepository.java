package com.pos.restaurant.kitchen.repository;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KitchenTicketRepository extends JpaRepository<KitchenTicket, UUID> {

    @Query("""
        select distinct t from KitchenTicket t
        join fetch t.order o
        left join fetch o.table tbl
        left join fetch tbl.hall
        left join fetch t.station
        where t.id = :id and t.companyId = :companyId
        """)
    Optional<KitchenTicket> findByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") Integer companyId);

    /** Active KDS board: working tickets only (SERVED/CANCELLED leave the board). */
    @Query("""
        select distinct t from KitchenTicket t
        join fetch t.order o
        left join fetch o.table tbl
        left join fetch tbl.hall
        left join fetch t.station
        where t.companyId = :companyId
          and t.storeId = :storeId
          and t.status not in :done
          and t.sentAt >= :since
        order by t.sentAt asc
        """)
    List<KitchenTicket> findActiveBoard(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("done") Collection<KitchenTicketStatus> done,
        @Param("since") Instant since
    );

    List<KitchenTicket> findByOrderId(UUID orderId);
}
