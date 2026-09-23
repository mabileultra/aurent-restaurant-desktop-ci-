package com.pos.integrations.pharmacy.repository;

import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;
import com.pos.integrations.pharmacy.entity.AslRequestLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface AslRequestLogRepository extends JpaRepository<AslRequestLog, Long> {

  @Query("""
      SELECT l FROM AslRequestLog l
      WHERE l.companyId = :companyId
        AND (:storeId IS NULL OR l.storeId = :storeId)
        AND (:operation IS NULL OR l.operation = :operation)
        AND (:outcome IS NULL OR l.outcome = :outcome)
        AND (:reached IS NULL OR l.reached = :reached)
        AND l.createdAt >= :from
        AND l.createdAt <= :to
        AND (
          CAST(:searchPattern AS string) = ''
          OR LOWER(COALESCE(l.markCodeShort, '')) LIKE LOWER(CAST(:searchPattern AS string))
          OR LOWER(COALESCE(l.message, '')) LIKE LOWER(CAST(:searchPattern AS string))
          OR LOWER(COALESCE(l.aslStatus, '')) LIKE LOWER(CAST(:searchPattern AS string))
        )
      """)
  Page<AslRequestLog> search(
      @Param("companyId") Integer companyId,
      @Param("storeId") Integer storeId,
      @Param("operation") AslRequestOperation operation,
      @Param("outcome") AslRequestOutcome outcome,
      @Param("reached") Boolean reached,
      @Param("from") Instant from,
      @Param("to") Instant to,
      @Param("searchPattern") String searchPattern,
      Pageable pageable
  );

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM AslRequestLog l WHERE l.createdAt < :cutoff")
  int deleteOlderThan(@Param("cutoff") Instant cutoff);
}
