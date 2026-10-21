package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeWhLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EdgeWhLineRepository extends JpaRepository<EdgeWhLine, UUID> {

    List<EdgeWhLine> findByDocIdOrderByProductNameAsc(UUID docId);
}
