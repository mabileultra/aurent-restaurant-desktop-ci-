package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorOrderItemRepository extends JpaRepository<FloorOrderItem, UUID> {

    List<FloorOrderItem> findByOrderIdOrderBySortOrderAscCreatedAtAsc(UUID orderId);

    Optional<FloorOrderItem> findByIdAndOrderId(UUID id, UUID orderId);

    int countByOrderId(UUID orderId);

    Optional<FloorOrderItem> findFirstByOrderIdAndMenuItemIdAndNoteIsNullAndItemStatus(
        UUID orderId,
        UUID menuItemId,
        OrderItemStatus itemStatus
    );

    List<FloorOrderItem> findByOrderIdAndItemStatus(UUID orderId, OrderItemStatus itemStatus);
}
