package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorOrderRepository extends JpaRepository<FloorOrder, UUID>, JpaSpecificationExecutor<FloorOrder> {

    @Query("select o from FloorOrder o left join fetch o.table left join fetch o.shift where o.id = :id and o.companyId = :companyId")
    Optional<FloorOrder> findByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") Integer companyId);

    /** Row lock for pay — no JOIN FETCH so Postgres locks only floor_orders. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from FloorOrder o where o.id = :id and o.companyId = :companyId")
    Optional<FloorOrder> findByIdAndCompanyIdForUpdate(@Param("id") UUID id, @Param("companyId") Integer companyId);

    boolean existsByTableIdAndStatusIn(Integer tableId, Collection<OrderStatus> statuses);

    @Query("""
        select case when count(o) > 0 then true else false end
        from FloorOrder o
        join o.table t
        where t.hall.id = :hallId and o.status in :statuses
        """)
    boolean existsByHallIdAndStatusIn(
        @Param("hallId") Integer hallId,
        @Param("statuses") Collection<OrderStatus> statuses
    );

    @Query("""
        select o from FloorOrder o left join fetch o.table
        where o.companyId = :companyId and o.storeId = :storeId and o.status in :statuses
          and o.table is not null
        """)
    List<FloorOrder> findTableOrdersByCompanyIdAndStoreIdAndStatusIn(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("statuses") Collection<OrderStatus> statuses
    );

    /** All live orders including takeaway/delivery without a table (edge bootstrap). */
    @Query("""
        select o from FloorOrder o left join fetch o.table left join fetch o.shift
        where o.companyId = :companyId and o.storeId = :storeId and o.status in :statuses
        """)
    List<FloorOrder> findLiveByCompanyIdAndStoreIdAndStatusIn(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("statuses") Collection<OrderStatus> statuses
    );

    @Query("""
        select o from FloorOrder o left join fetch o.table
        where o.companyId = :companyId and o.storeId = :storeId
          and o.channel = :channel and o.status in :statuses
        order by o.openedAt desc
        """)
    List<FloorOrder> findByCompanyIdAndStoreIdAndChannelAndStatusIn(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("channel") OrderChannel channel,
        @Param("statuses") Collection<OrderStatus> statuses
    );

    @Query("""
        select o from FloorOrder o
        where o.companyId = :companyId and o.storeId = :storeId
          and o.status in :statuses
        order by o.closedAt desc, o.openedAt desc
        """)
    List<FloorOrder> findRecentByCompanyIdAndStoreIdAndStatusIn(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("statuses") Collection<OrderStatus> statuses,
        Pageable pageable
    );

    @Query("""
        select o from FloorOrder o left join fetch o.table
        where o.companyId = :companyId and o.storeId = :storeId
          and o.status = com.pos.restaurant.order.domain.OrderStatus.CANCELLED
        order by o.closedAt desc, o.openedAt desc
        """)
    List<FloorOrder> findRecentCancelledByCompanyIdAndStoreId(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        select o from FloorOrder o
        where o.companyId = :companyId and o.storeId = :storeId
          and (
            o.status = com.pos.restaurant.order.domain.OrderStatus.REFUNDED
            or exists (
              select 1 from FloorOrderItem i
              where i.order = o and i.returnedQuantity > 0
            )
          )
        order by o.closedAt desc, o.openedAt desc
        """)
    List<FloorOrder> findRecentRefundedByCompanyIdAndStoreId(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("select coalesce(max(o.orderNo), 0) from FloorOrder o where o.storeId = :storeId")
    int findMaxOrderNo(@Param("storeId") Integer storeId);

    @Query("select coalesce(max(o.pickupNo), 0) from FloorOrder o where o.shift.id = :shiftId")
    int findMaxPickupNoByShiftId(@Param("shiftId") UUID shiftId);

    long countByShiftIdAndStatusIn(UUID shiftId, Collection<OrderStatus> statuses);
}
