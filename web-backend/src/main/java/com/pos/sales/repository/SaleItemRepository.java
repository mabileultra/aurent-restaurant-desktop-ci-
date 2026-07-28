package com.pos.sales.repository;

import com.pos.sales.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    long countBySale_Id(UUID saleId);
}
