package com.pos.platform.repository;

import com.pos.platform.entity.BillingPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillingPlanRepository extends JpaRepository<BillingPlan, UUID> {

    List<BillingPlan> findAllByActiveTrueOrderBySortOrderAsc();

    Optional<BillingPlan> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
}
