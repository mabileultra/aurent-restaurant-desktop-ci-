package com.pos.sales.repository;

import com.pos.sales.entity.CashRegisterConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
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

    /**
     * Candidates for POS category scope: linked to register and/or store.
     * Final match (register vs store-only) is applied in {@code CashRegisterCategoryScopeResolver}.
     */
    @EntityGraph(attributePaths = {"stores", "registers", "categories"})
    @Query("""
        SELECT DISTINCT c FROM CashRegisterConfig c
        WHERE c.lockedDefault = false
          AND (
            (:cashRegisterId IS NOT NULL AND EXISTS (
              SELECT 1 FROM c.registers r WHERE r.id = :cashRegisterId
            ))
            OR (:storeId IS NOT NULL AND EXISTS (
              SELECT 1 FROM c.stores s WHERE s.id = :storeId
            ))
          )
        """)
    List<CashRegisterConfig> findCandidatesForPosScope(
        @Param("storeId") Integer storeId,
        @Param("cashRegisterId") Long cashRegisterId
    );
}
