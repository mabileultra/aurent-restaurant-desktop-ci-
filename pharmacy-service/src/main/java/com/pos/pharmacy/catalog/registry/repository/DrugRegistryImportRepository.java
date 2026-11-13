package com.pos.pharmacy.catalog.registry.repository;

import com.pos.pharmacy.catalog.registry.entity.DrugRegistryImport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DrugRegistryImportRepository extends JpaRepository<DrugRegistryImport, UUID> {

    boolean existsByChecksumAndStatus(String checksum, String status);

    Optional<DrugRegistryImport> findFirstByStatusOrderByCreatedAtDesc(String status);
}
