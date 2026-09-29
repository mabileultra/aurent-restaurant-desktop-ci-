package com.pos.restaurant.print.repository;

import com.pos.restaurant.print.domain.PrintJobStatus;
import com.pos.restaurant.print.entity.RestaurantPrintJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RestaurantPrintJobRepository extends JpaRepository<RestaurantPrintJob, UUID> {

    @Query("""
        select j from RestaurantPrintJob j
        where j.companyId = :companyId
          and j.storeId = :storeId
          and j.status = :status
          and j.createdAt > :since
        order by j.createdAt asc
        """)
    List<RestaurantPrintJob> findPendingForStore(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("status") PrintJobStatus status,
        @Param("since") Instant since
    );

    @Modifying(clearAutomatically = true)
    @Query("""
        update RestaurantPrintJob j
        set j.status = :done,
            j.completedAt = :now
        where j.id in :ids
          and j.companyId = :companyId
          and j.storeId = :storeId
          and j.status = :pending
        """)
    int markDone(
        @Param("ids") List<UUID> ids,
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("pending") PrintJobStatus pending,
        @Param("done") PrintJobStatus done,
        @Param("now") Instant now
    );
}
