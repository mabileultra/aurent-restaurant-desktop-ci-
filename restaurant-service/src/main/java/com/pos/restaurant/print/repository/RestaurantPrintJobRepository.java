package com.pos.restaurant.print.repository;

import com.pos.restaurant.print.domain.PrintJobStatus;
import com.pos.restaurant.print.entity.RestaurantPrintJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RestaurantPrintJobRepository extends JpaRepository<RestaurantPrintJob, UUID> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE restaurant_print_jobs
        SET status = 'PENDING',
            claimed_at = NULL
        WHERE company_id = :companyId
          AND store_id = :storeId
          AND status = 'CLAIMED'
          AND claimed_at IS NOT NULL
          AND claimed_at < :staleBefore
        """, nativeQuery = true)
    int reclaimStaleClaims(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("staleBefore") Instant staleBefore
    );

    /**
     * Atomically claim a batch of pending jobs (SKIP LOCKED — one desktop wins each row).
     * @return claimed job ids
     */
    @Query(value = """
        UPDATE restaurant_print_jobs
        SET status = 'CLAIMED',
            claimed_at = :now
        WHERE id IN (
            SELECT id FROM (
                SELECT id
                FROM restaurant_print_jobs
                WHERE company_id = :companyId
                  AND store_id = :storeId
                  AND status = 'PENDING'
                  AND created_at > :since
                ORDER BY created_at ASC
                LIMIT :batch
                FOR UPDATE SKIP LOCKED
            ) locked
        )
        RETURNING id
        """, nativeQuery = true)
    List<UUID> claimPendingIds(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("since") Instant since,
        @Param("now") Instant now,
        @Param("batch") int batch
    );

    /**
     * Claim only jobs this desktop can print (by kind + category printer name).
     */
    @Query(value = """
        UPDATE restaurant_print_jobs
        SET status = 'CLAIMED',
            claimed_at = :now
        WHERE id IN (
            SELECT id FROM (
                SELECT id
                FROM restaurant_print_jobs
                WHERE company_id = :companyId
                  AND store_id = :storeId
                  AND status = 'PENDING'
                  AND created_at > :since
                  AND (
                    (:guestBill = TRUE AND kind = 'GUEST_BILL')
                    OR (:kitchenSend = TRUE AND kind = 'KITCHEN_SEND')
                    OR (
                      :hasPrinters = TRUE
                      AND kind IN ('CATEGORY_SLIP', 'CATEGORY_BATCH')
                      AND lower(coalesce(payload::json->>'printerName', '')) IN (:printers)
                    )
                  )
                ORDER BY created_at ASC
                LIMIT :batch
                FOR UPDATE SKIP LOCKED
            ) locked
        )
        RETURNING id
        """, nativeQuery = true)
    List<UUID> claimPendingFilteredIds(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("since") Instant since,
        @Param("now") Instant now,
        @Param("batch") int batch,
        @Param("guestBill") boolean guestBill,
        @Param("kitchenSend") boolean kitchenSend,
        @Param("hasPrinters") boolean hasPrinters,
        @Param("printers") Collection<String> printers
    );

    @Query("""
        select j from RestaurantPrintJob j
        where j.id in :ids
        order by j.createdAt asc
        """)
    List<RestaurantPrintJob> findAllByIdOrdered(@Param("ids") Collection<UUID> ids);

    @Modifying(clearAutomatically = true)
    @Query("""
        update RestaurantPrintJob j
        set j.status = :done,
            j.completedAt = :now
        where j.id in :ids
          and j.companyId = :companyId
          and j.storeId = :storeId
          and j.status in :fromStatuses
        """)
    int markDoneFromStatuses(
        @Param("ids") List<UUID> ids,
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("fromStatuses") Collection<PrintJobStatus> fromStatuses,
        @Param("done") PrintJobStatus done,
        @Param("now") Instant now
    );

    /** Wrong desktop / failed print — put back so another station can take it immediately. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE restaurant_print_jobs
        SET status = 'PENDING',
            claimed_at = NULL
        WHERE company_id = :companyId
          AND store_id = :storeId
          AND status = 'CLAIMED'
          AND id IN (:ids)
        """, nativeQuery = true)
    int releaseClaims(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("ids") Collection<UUID> ids
    );
}
