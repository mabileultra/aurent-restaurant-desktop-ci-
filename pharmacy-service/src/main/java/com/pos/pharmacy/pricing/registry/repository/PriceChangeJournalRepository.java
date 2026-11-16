package com.pos.pharmacy.pricing.registry.repository;

import com.pos.pharmacy.pricing.registry.entity.PriceChangeJournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PriceChangeJournalRepository extends JpaRepository<PriceChangeJournalEntry, UUID> {

    Page<PriceChangeJournalEntry> findByCompanyIdAndStatus(
        Integer companyId,
        String status,
        Pageable pageable
    );

    Page<PriceChangeJournalEntry> findByCompanyId(Integer companyId, Pageable pageable);

    List<PriceChangeJournalEntry> findByCompanyIdAndSnapshotIdAndStatus(
        Integer companyId,
        UUID snapshotId,
        String status
    );

    List<PriceChangeJournalEntry> findByCompanyIdAndStatus(Integer companyId, String status);

    Optional<PriceChangeJournalEntry> findFirstByCompanyIdAndProductIdAndStatus(
        Integer companyId,
        UUID productId,
        String status
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from PriceChangeJournalEntry e where e.status in :statuses")
    int deleteByStatusIn(@Param("statuses") Collection<String> statuses);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        delete from PriceChangeJournalEntry e
        where e.companyId = :companyId
          and e.productId = :productId
          and e.status = :status
        """)
    int deleteByCompanyIdAndProductIdAndStatus(
        @Param("companyId") Integer companyId,
        @Param("productId") UUID productId,
        @Param("status") String status
    );
}
