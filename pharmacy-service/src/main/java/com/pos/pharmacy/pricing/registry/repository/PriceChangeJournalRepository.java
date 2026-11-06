package com.pos.pharmacy.pricing.registry.repository;

import com.pos.pharmacy.pricing.registry.entity.PriceChangeJournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
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
}
