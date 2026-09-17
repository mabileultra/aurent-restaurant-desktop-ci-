package com.pos.pharmacy.sales.repository;

import com.pos.pharmacy.sales.entity.SaleItemLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.UUID;

public interface SaleItemLotRepository extends JpaRepository<SaleItemLot, UUID> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update SaleItemLot s set s.lot = null where s.lot.id in :lotIds")
    int detachLots(@Param("lotIds") Collection<UUID> lotIds);
}
