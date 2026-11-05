package com.pos.pharmacy.pricing.registry.repository;

import com.pos.pharmacy.pricing.registry.entity.PriceRegistrySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PriceRegistrySnapshotRepository extends JpaRepository<PriceRegistrySnapshot, UUID> {

    Optional<PriceRegistrySnapshot> findFirstByStatusOrderByCreatedAtDesc(String status);
}
