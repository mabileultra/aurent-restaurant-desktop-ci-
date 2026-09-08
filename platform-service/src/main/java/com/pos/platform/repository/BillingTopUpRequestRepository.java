package com.pos.platform.repository;

import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.entity.BillingTopUpRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BillingTopUpRequestRepository extends JpaRepository<BillingTopUpRequest, UUID> {

    Page<BillingTopUpRequest> findByStatusOrderByCreatedAtDesc(BillingTopUpStatus status, Pageable pageable);

    Page<BillingTopUpRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<BillingTopUpRequest> findByCompanyIdOrderByCreatedAtDesc(Integer companyId, Pageable pageable);

    long countByStatus(BillingTopUpStatus status);
}
