package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StoreStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoreStockRepository extends JpaRepository<StoreStock, StoreStock.StoreStockId> {

    Optional<StoreStock> findByProductIdAndStoreId(UUID productId, Integer storeId);

    List<StoreStock> findByStoreIdAndProductIdIn(Integer storeId, Collection<UUID> productIds);
}
