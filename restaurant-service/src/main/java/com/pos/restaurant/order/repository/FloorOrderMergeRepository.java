package com.pos.restaurant.order.repository;

import com.pos.restaurant.order.entity.FloorOrderMerge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FloorOrderMergeRepository extends JpaRepository<FloorOrderMerge, UUID> {
}
