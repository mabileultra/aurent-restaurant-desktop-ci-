package com.pos.platform.repository;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.entity.BillingPaymentIntent;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillingPaymentIntentRepository extends JpaRepository<BillingPaymentIntent, UUID> {

    Optional<BillingPaymentIntent> findByProviderAndProviderTransId(BillingPaymentProvider provider, String providerTransId);

    Optional<BillingPaymentIntent> findByIdAndCompanyId(UUID id, Integer companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from BillingPaymentIntent i where i.id = :id")
    Optional<BillingPaymentIntent> findByIdForUpdate(@Param("id") UUID id);

    /**
     * Payme GetStatement: filter by CreateTransaction time (provider_prepare_id ms),
     * not by order created_at. Inclusive from..to, ascending.
     */
    @Query(value = """
        SELECT * FROM billing_payment_intents i
        WHERE i.provider = :provider
          AND i.provider_trans_id IS NOT NULL
          AND BTRIM(i.provider_trans_id) <> ''
          AND (
            CASE
              WHEN i.provider_prepare_id ~ '^[0-9]+$'
                THEN CAST(i.provider_prepare_id AS BIGINT)
              ELSE (EXTRACT(EPOCH FROM i.created_at) * 1000)::BIGINT
            END
          ) BETWEEN :fromMs AND :toMs
        ORDER BY (
          CASE
            WHEN i.provider_prepare_id ~ '^[0-9]+$'
              THEN CAST(i.provider_prepare_id AS BIGINT)
            ELSE (EXTRACT(EPOCH FROM i.created_at) * 1000)::BIGINT
          END
        ) ASC
        """, nativeQuery = true)
    List<BillingPaymentIntent> findPaymeStatement(
        @Param("provider") String provider,
        @Param("fromMs") long fromMs,
        @Param("toMs") long toMs
    );

    Page<BillingPaymentIntent> findByCompanyIdOrderByCreatedAtDesc(Integer companyId, Pageable pageable);

    Page<BillingPaymentIntent> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<BillingPaymentIntent> findByStatusOrderByCreatedAtDesc(BillingPaymentStatus status, Pageable pageable);

    Page<BillingPaymentIntent> findByCompanyIdAndStatusOrderByCreatedAtDesc(
        Integer companyId,
        BillingPaymentStatus status,
        Pageable pageable
    );
}
