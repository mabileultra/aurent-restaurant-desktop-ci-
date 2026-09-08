package com.pos.platform.repository;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.entity.BillingLedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BillingLedgerRepository extends JpaRepository<BillingLedgerEntry, UUID> {

    Page<BillingLedgerEntry> findByCompanyIdOrderByCreatedAtDesc(Integer companyId, Pageable pageable);

    Page<BillingLedgerEntry> findByCompanyIdAndEntryTypeOrderByCreatedAtDesc(
        Integer companyId,
        BillingLedgerType entryType,
        Pageable pageable
    );
}
