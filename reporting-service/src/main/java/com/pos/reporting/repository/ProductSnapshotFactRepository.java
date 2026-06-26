package com.pos.reporting.repository;

import com.pos.reporting.entity.ProductSnapshotFact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductSnapshotFactRepository extends JpaRepository<ProductSnapshotFact, UUID> {

    long countByCompanyIdAndActiveTrue(Integer companyId);
}
