package com.pos.platform.repository;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.entity.CompanyBilling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

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
    Optional<CompanyBilling> findDetailedByCompanyId(Integer companyId);

    @Query("""
        select b from CompanyBilling b
        left join fetch b.plan
        left join fetch b.company
        """)
    List<CompanyBilling> findAllDetailed();

    /**
     * Creates a billing row with an explicit PK. Avoids Hibernate
     * {@code null identifier} on first {@code save()} of a new association entity.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        INSERT INTO company_billing (
            company_id,
            balance,
            status,
            addon_monthly_amount,
            auto_charge_enabled,
            billing_enabled,
            created_at,
            updated_at
        ) VALUES (
            :companyId,
            0,
            'ACTIVE',
            0,
            TRUE,
            TRUE,
            NOW(),
            NOW()
        )
        ON CONFLICT (company_id) DO NOTHING
        """, nativeQuery = true)
    int insertBlankIfAbsent(@Param("companyId") Integer companyId);
}
