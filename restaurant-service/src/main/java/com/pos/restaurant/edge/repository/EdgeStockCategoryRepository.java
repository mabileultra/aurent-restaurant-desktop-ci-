package com.pos.restaurant.edge.repository;

import com.pos.restaurant.edge.entity.EdgeStockCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EdgeStockCategoryRepository extends JpaRepository<EdgeStockCategory, Integer> {

    List<EdgeStockCategory> findByCompanyIdOrderByNameAsc(Integer companyId);

    List<EdgeStockCategory> findByCompanyIdAndBusinessTypeIdOrderByNameAsc(Integer companyId, Integer businessTypeId);

    Optional<EdgeStockCategory> findByIdAndCompanyId(Integer id, Integer companyId);

    Optional<EdgeStockCategory> findFirstByCompanyIdOrderByIdDesc(Integer companyId);
}
