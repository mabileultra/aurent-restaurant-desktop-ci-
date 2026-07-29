package com.pos.catalog.repository;

import com.pos.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    @Query("SELECT p FROM Product p JOIN FETCH p.company WHERE p.id IN :ids")
    List<Product> findAllByIdWithCompany(@Param("ids") Collection<UUID> ids);

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        JOIN FETCH p.company
        WHERE (:companyId IS NULL OR p.company.id = :companyId)
        ORDER BY p.updatedAt ASC NULLS LAST, p.id ASC
        """)
    Page<Product> findForReportingSnapshot(@Param("companyId") Integer companyId, Pageable pageable);
}
