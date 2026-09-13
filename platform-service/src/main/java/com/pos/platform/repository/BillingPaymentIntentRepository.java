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

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillingPaymentIntentRepository extends JpaRepository<BillingPaymentIntent, UUID> {

    Optional<BillingPaymentIntent> findByProviderAndProviderTransId(BillingPaymentProvider provider, String providerTransId);

    Optional<BillingPaymentIntent> findByIdAndCompanyId(UUID id, Integer companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from BillingPaymentIntent i where i.id = :id")
    Optional<BillingPaymentIntent> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
        select i from BillingPaymentIntent i
        where i.provider = :provider
          and i.createdAt >= :from
          and i.createdAt <= :to
        order by i.createdAt asc
        """)
    List<BillingPaymentIntent> findPaymeStatement(
        @Param("provider") BillingPaymentProvider provider,
        @Param("from") Instant from,
        @Param("to") Instant to
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
