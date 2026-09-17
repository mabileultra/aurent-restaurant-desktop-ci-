package com.pos.pharmacy.sales.repository;

import com.pos.pharmacy.sales.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

    long countByReceiptNumberStartingWith(String prefix);

    /** Не тянуть lotAllocations здесь: второй bag вместе с items роняет открытие чека. */
    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Sale> findByReceiptNumberAndCompanyId(String receiptNumber, Integer companyId);

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Sale> findByIdAndCompanyId(UUID id, Integer companyId);

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.companyId = :companyId
          AND s.cashierId = :cashierId
          AND (:storeId IS NULL OR s.storeId = :storeId)
          AND (:shiftId IS NULL OR s.cashierShiftId = :shiftId)
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> findMySales(
        @Param("companyId") Integer companyId,
        @Param("cashierId") UUID cashierId,
        @Param("storeId") Integer storeId,
        @Param("shiftId") UUID shiftId,
        Pageable pageable
    );

    Optional<Sale> findByClientSaleId(UUID clientSaleId);

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.status IN :statuses
        ORDER BY s.createdAt ASC
        """)
    Page<Sale> findByStatusIn(@Param("statuses") Collection<com.pos.pharmacy.sales.domain.SaleEnums.SaleStatus> statuses, Pageable pageable);
}
