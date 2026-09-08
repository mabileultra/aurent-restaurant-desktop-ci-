package com.pos.platform.repository;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.entity.CompanyBilling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface CompanyBillingRepository extends JpaRepository<CompanyBilling, Integer> {

    long countByStatus(BillingAccountStatus status);

    @Query("""
        select b from CompanyBilling b
        left join fetch b.plan
        left join fetch b.company
        where b.billingEnabled = true
          and b.autoChargeEnabled = true
          and b.nextChargeAt is not null
          and b.nextChargeAt <= :now
          and b.status <> com.pos.platform.domain.BillingAccountStatus.BLOCKED
        """)
    List<CompanyBilling> findDueForCharge(Instant now);

    @Query("""
        select b from CompanyBilling b
        left join fetch b.plan
        left join fetch b.company
        where b.companyId = :companyId
        """)
    java.util.Optional<CompanyBilling> findDetailedByCompanyId(Integer companyId);

    @Query("""
        select b from CompanyBilling b
        left join fetch b.plan
        left join fetch b.company
        """)
    List<CompanyBilling> findAllDetailed();
}
