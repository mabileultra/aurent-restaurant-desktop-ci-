package com.pos.integrations.marking.repository;

import com.pos.integrations.marking.entity.SaleSoldMark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SaleSoldMarkRepository extends JpaRepository<SaleSoldMark, UUID> {

    List<SaleSoldMark> findByCompanyIdAndMarkKeyIn(Integer companyId, Collection<String> markKeys);

    boolean existsByCompanyIdAndMarkKeyIn(Integer companyId, Collection<String> markKeys);

    List<SaleSoldMark> findBySaleId(UUID saleId);

    List<SaleSoldMark> findBySaleIdAndSaleItemIdIn(UUID saleId, Collection<UUID> saleItemIds);
}
