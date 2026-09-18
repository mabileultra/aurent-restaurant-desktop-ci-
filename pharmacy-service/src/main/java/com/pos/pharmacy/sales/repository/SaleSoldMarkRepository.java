package com.pos.pharmacy.sales.repository;

import com.pos.pharmacy.sales.entity.SaleSoldMark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SaleSoldMarkRepository extends JpaRepository<SaleSoldMark, UUID> {

    boolean existsByCompanyIdAndMarkKeyIn(Integer companyId, Collection<String> markKeys);

    List<SaleSoldMark> findByCompanyIdAndMarkKeyIn(Integer companyId, Collection<String> markKeys);

    List<SaleSoldMark> findBySaleId(UUID saleId);

    List<SaleSoldMark> findBySaleIdAndSaleItemIdIn(UUID saleId, Collection<UUID> saleItemIds);
}
