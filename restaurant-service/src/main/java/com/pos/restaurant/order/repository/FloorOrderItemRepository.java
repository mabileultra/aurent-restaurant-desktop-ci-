package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrderItem;
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

    List<FloorOrderItem> findByOrderIdAndItemStatus(UUID orderId, OrderItemStatus itemStatus);
}
