package com.pos.sales.repository;

import com.pos.sales.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    long countBySale_Id(UUID saleId);

    @Query("""
        select count(si) from SaleItem si
        where si.sale.id = :saleId and si.returnedQuantity > 0
        """)
    long countReturnedBySaleId(@Param("saleId") UUID saleId);
}
