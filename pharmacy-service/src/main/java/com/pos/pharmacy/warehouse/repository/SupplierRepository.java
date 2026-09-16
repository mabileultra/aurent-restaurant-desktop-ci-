package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    Optional<Supplier> findByIdAndCompanyId(UUID id, Integer companyId);
}
