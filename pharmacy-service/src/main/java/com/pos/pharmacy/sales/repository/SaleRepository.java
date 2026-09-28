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
          AND s.storeId = :storeId
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> findMySalesByStore(
        @Param("companyId") Integer companyId,
        @Param("cashierId") UUID cashierId,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.companyId = :companyId
          AND s.cashierId = :cashierId
          AND s.storeId = :storeId
          AND s.cashierShiftId = :shiftId
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> findMySalesByStoreAndShift(
        @Param("companyId") Integer companyId,
        @Param("cashierId") UUID cashierId,
        @Param("storeId") Integer storeId,
        @Param("shiftId") UUID shiftId,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.companyId = :companyId
          AND s.cashierId = :cashierId
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> findMySalesAll(
        @Param("companyId") Integer companyId,
        @Param("cashierId") UUID cashierId,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.companyId = :companyId
          AND s.cashierId = :cashierId
          AND s.cashierShiftId = :shiftId
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> findMySalesByShift(
        @Param("companyId") Integer companyId,
        @Param("cashierId") UUID cashierId,
        @Param("shiftId") UUID shiftId,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.companyId = :companyId
          AND (:storeId IS NULL OR s.storeId = :storeId)
          AND s.createdAt >= :fromInstant
          AND s.createdAt < :toInstant
          AND (:paymentMethod IS NULL OR s.paymentMethod = :paymentMethod)
          AND (:status IS NULL OR s.status = :status)
          AND (
            :search IS NULL
            OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
            OR LOWER(COALESCE(s.cashierName, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
          )
          AND (
            :receiptNumber IS NULL
            OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', CAST(:receiptNumber AS string), '%'))
          )
          AND (
            :cashierName IS NULL
            OR LOWER(COALESCE(s.cashierName, '')) LIKE LOWER(CONCAT('%', CAST(:cashierName AS string), '%'))
          )
          AND (
            :saleId IS NULL
            OR CAST(s.id AS string) = CAST(:saleId AS string)
          )
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> searchCompanySales(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("fromInstant") java.time.Instant fromInstant,
        @Param("toInstant") java.time.Instant toInstant,
        @Param("paymentMethod") com.pos.pharmacy.sales.domain.SaleEnums.PaymentMethod paymentMethod,
        @Param("status") com.pos.pharmacy.sales.domain.SaleEnums.SaleStatus status,
        @Param("search") String search,
        @Param("receiptNumber") String receiptNumber,
        @Param("cashierName") String cashierName,
        @Param("saleId") UUID saleId,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("""
        SELECT s FROM Sale s
        WHERE s.companyId = :companyId
          AND s.status IN :statuses
          AND (:storeId IS NULL OR s.storeId = :storeId)
          AND s.createdAt >= :fromInstant
          AND s.createdAt < :toInstant
          AND (
            :search IS NULL
            OR LOWER(s.receiptNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
            OR LOWER(COALESCE(s.fiscalSign, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
            OR LOWER(COALESCE(s.cashierName, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
          )
          AND (
            :cashierName IS NULL
            OR LOWER(COALESCE(s.cashierName, '')) LIKE LOWER(CONCAT('%', CAST(:cashierName AS string), '%'))
          )
        ORDER BY s.createdAt DESC
        """)
    Page<Sale> searchCompanyReturns(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("fromInstant") java.time.Instant fromInstant,
        @Param("toInstant") java.time.Instant toInstant,
        @Param("search") String search,
        @Param("cashierName") String cashierName,
        @Param("statuses") Collection<com.pos.pharmacy.sales.domain.SaleEnums.SaleStatus> statuses,
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
