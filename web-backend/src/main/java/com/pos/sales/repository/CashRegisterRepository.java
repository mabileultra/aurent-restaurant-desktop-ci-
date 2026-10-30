package com.pos.sales.repository;

import com.pos.sales.entity.CashRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CashRegisterRepository extends JpaRepository<CashRegister, Long>, JpaSpecificationExecutor<CashRegister> {

    @Override
    @EntityGraph(attributePaths = {"store"})
    Page<CashRegister> findAll(Specification<CashRegister> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"store"})
    List<CashRegister> findByStore_IdIn(Collection<Integer> storeIds);

    @EntityGraph(attributePaths = {"store"})
    List<CashRegister> findByStatusIgnoreCaseAndStore_CompanyIsNotNullOrderByStore_NameAscRegisterNumberAsc(String status);

    @EntityGraph(attributePaths = {"store", "store.company"})
    @Query("""
        SELECT c FROM CashRegister c
        JOIN c.store s
        WHERE LOWER(c.status) = LOWER(:status)
          AND s.company.id = :companyId
        ORDER BY s.name ASC, c.registerNumber ASC
        """)
    List<CashRegister> findActiveByCompanyId(
        @Param("status") String status,
        @Param("companyId") Integer companyId
    );

    @Query("""
        SELECT DISTINCT c.equipmentSerial FROM CashRegister c
        JOIN c.store s
        WHERE c.equipmentSerial IS NOT NULL AND TRIM(c.equipmentSerial) <> ''
          AND s.active = TRUE AND s.company IS NOT NULL
          AND s.company.id = :companyId
        ORDER BY c.equipmentSerial
        """)
    List<String> findDistinctEquipmentSerials(@Param("companyId") Integer companyId);

    @Query("SELECT c FROM CashRegister c JOIN FETCH c.store WHERE c.id = :id")
    Optional<CashRegister> findDetailById(@Param("id") Long id);

    Optional<CashRegister> findFirstByStore_IdOrderByRegisterNumberAsc(Integer storeId);

    @EntityGraph(attributePaths = {"store"})
    Optional<CashRegister> findFirstByStore_IdAndStatusIgnoreCaseOrderByRegisterNumberAsc(
        Integer storeId,
        String status
    );

    @EntityGraph(attributePaths = {"store"})
    Optional<CashRegister> findByDeviceId(String deviceId);

    Optional<CashRegister> findByStore_IdAndEquipmentSerialIgnoreCase(Integer storeId, String equipmentSerial);

    @EntityGraph(attributePaths = {"store"})
    Optional<CashRegister> findByStore_IdAndEquipmentSerialIgnoreCaseAndStatusIgnoreCase(
        Integer storeId,
        String equipmentSerial,
        String status
    );

    @Query("""
        SELECT c FROM CashRegister c
        JOIN FETCH c.store
        WHERE c.store.id = :storeId
          AND LOWER(c.status) = LOWER(:status)
          AND (c.deviceId IS NULL OR TRIM(c.deviceId) = '')
        ORDER BY c.updatedAt DESC NULLS LAST, c.registerNumber ASC
        """)
    List<CashRegister> findUnboundByStoreAndStatus(
        @Param("storeId") Integer storeId,
        @Param("status") String status
    );

    long countByStore_IdAndStatusIgnoreCase(Integer storeId, String status);

    @Query("""
        SELECT COALESCE(MAX(c.registerNumber), 0) FROM CashRegister c
        WHERE c.store.id = :storeId
        """)
    int findMaxRegisterNumberByStoreId(@Param("storeId") Integer storeId);

    boolean existsByStore_IdAndRegisterNumberAndIdNot(Integer storeId, Integer registerNumber, Long id);

    boolean existsByStore_IdAndRegisterNumber(Integer storeId, Integer registerNumber);

    boolean existsByDeviceIdAndIdNot(String deviceId, Long id);

    boolean existsByDeviceId(String deviceId);

    long countByStatusIgnoreCase(String status);

    long countByLastSeenAtAfter(java.time.Instant since);
}
