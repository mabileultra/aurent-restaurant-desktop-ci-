package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.entity.FloorOrderItemModifier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface FloorOrderItemModifierRepository extends JpaRepository<FloorOrderItemModifier, UUID> {

    List<FloorOrderItemModifier> findByOrderItemIdIn(Collection<UUID> orderItemIds);
}
