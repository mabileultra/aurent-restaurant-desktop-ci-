package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorOrderRepository extends JpaRepository<FloorOrder, UUID>, JpaSpecificationExecutor<FloorOrder> {

    @Query("select o from FloorOrder o left join fetch o.table left join fetch o.shift where o.id = :id and o.companyId = :companyId")
    Optional<FloorOrder> findByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") Integer companyId);

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

    long countByShiftIdAndStatusIn(UUID shiftId, Collection<OrderStatus> statuses);

    /**
     * Lightweight activity watermark for cross-device sync (phone → cashier / monitor).
     * Milliseconds since epoch of the latest order / open-order line / table change.
     */
    @Query(value = """
        select cast(extract(epoch from greatest(
          coalesce(
            (select max(o.updated_at) from floor_orders o
             where o.company_id = :companyId and o.store_id = :storeId),
            timestamptz 'epoch'),
          coalesce(
            (select max(i.updated_at) from floor_order_items i
             inner join floor_orders o on o.id = i.order_id
             where o.company_id = :companyId and o.store_id = :storeId
               and o.status in ('OPEN', 'BILLING')),
            timestamptz 'epoch'),
          coalesce(
            (select max(t.updated_at) from floor_tables t
             inner join floor_halls h on h.id = t.hall_id
             where h.company_id = :companyId and h.store_id = :storeId),
            timestamptz 'epoch')
        )) * 1000 as bigint)
        """, nativeQuery = true)
    Long findFloorRevisionMillis(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId
    );
}
