package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorOrderItemRepository extends JpaRepository<FloorOrderItem, UUID> {

    @Query("""
        select i from FloorOrderItem i
        left join fetch i.menuItem
        where i.order.id = :orderId
        order by i.sortOrder asc, i.createdAt asc
        """)
    List<FloorOrderItem> findByOrderIdOrderBySortOrderAscCreatedAtAsc(@Param("orderId") UUID orderId);

    @Query("""
        select i from FloorOrderItem i
        join fetch i.order
        where i.order.id in :orderIds
        order by i.sortOrder asc, i.createdAt asc
        """)
    List<FloorOrderItem> findByOrderIdInOrdered(@Param("orderIds") Collection<UUID> orderIds);

    /**
     * Tile aggregate. {@code lines_count} includes CANCELLED rows.
     * {@code subtotal} is the sum of per-line ROUND(quantity * unit_price, 2) without CANCELLED.
     */
    @Query(value = """
        SELECT i.order_id,
               COUNT(*) AS lines_count,
               COALESCE(SUM(CASE
                   WHEN i.item_status <> 'CANCELLED'
                   THEN ROUND(i.quantity * i.unit_price, 2)
                   ELSE 0
               END), 0) AS subtotal
        FROM floor_order_items i
        WHERE i.order_id IN (:orderIds)
        GROUP BY i.order_id
        """, nativeQuery = true)
    List<Object[]> summarizeTiles(@Param("orderIds") Collection<UUID> orderIds);

    Optional<FloorOrderItem> findByIdAndOrderId(UUID id, UUID orderId);

    int countByOrderId(UUID orderId);

    Optional<FloorOrderItem> findFirstByOrderIdAndMenuItemIdAndNoteIsNullAndItemStatus(
        UUID orderId,
        UUID menuItemId,
        OrderItemStatus itemStatus
    );

    Optional<FloorOrderItem> findFirstByOrderIdAndMenuItemIdAndNoteIsNullAndItemStatusNotInOrderBySortOrderAscCreatedAtAsc(
        UUID orderId,
        UUID menuItemId,
        Collection<OrderItemStatus> itemStatuses
    );

    /** Weight-sold dishes: merge same menu item even when note holds «200 г» / «300 г». */
    Optional<FloorOrderItem> findFirstByOrderIdAndMenuItemIdAndItemStatusOrderBySortOrderAscCreatedAtAsc(
        UUID orderId,
        UUID menuItemId,
        OrderItemStatus itemStatus
    );

    Optional<FloorOrderItem> findFirstByOrderIdAndMenuItemIdAndItemStatusNotInOrderBySortOrderAscCreatedAtAsc(
        UUID orderId,
        UUID menuItemId,
        Collection<OrderItemStatus> itemStatuses
    );

    List<FloorOrderItem> findByOrderIdAndItemStatus(UUID orderId, OrderItemStatus itemStatus);

    @Query("""
        select i from FloorOrderItem i
        join fetch i.order o
        left join fetch o.table t
        left join fetch t.hall
        where o.companyId = :companyId
          and o.storeId = :storeId
          and i.itemStatus = com.pos.restaurant.order.domain.OrderItemStatus.CANCELLED
        order by i.updatedAt desc
        """)
    List<FloorOrderItem> findRecentCancelledByCompanyIdAndStoreId(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );
}
