package com.pos.sales.repository;

import com.pos.sales.entity.CashRegisterConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface CashRegisterConfigRepository extends JpaRepository<CashRegisterConfig, Long>, JpaSpecificationExecutor<CashRegisterConfig> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<CashRegisterConfig> findByLockedDefaultTrue();

    @Override
    @EntityGraph(attributePaths = {"stores", "registers", "categories"})
    Page<CashRegisterConfig> findAll(Specification<CashRegisterConfig> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"stores", "registers", "categories"})
    @Override
    Optional<CashRegisterConfig> findById(Long id);
}
