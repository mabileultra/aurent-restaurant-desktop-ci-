package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.entity.FloorOrderWaiterHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FloorOrderWaiterHistoryRepository extends JpaRepository<FloorOrderWaiterHistory, UUID> {

    List<FloorOrderWaiterHistory> findByOrderIdOrderByAssignedAtAsc(UUID orderId);
}
