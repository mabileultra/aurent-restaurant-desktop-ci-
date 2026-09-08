package com.pos.platform.service.impl;

import com.pos.platform.dto.billing.BillingPlanResponse;
import com.pos.platform.dto.billing.UpsertBillingPlanRequest;
import com.pos.platform.entity.BillingPlan;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.BillingPlanRepository;
import com.pos.platform.service.BillingPlanService;
import com.pos.platform.service.support.BillingMapper;
import com.pos.platform.service.support.BillingMoney;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingPlanServiceImpl implements BillingPlanService {

    private final BillingPlanRepository planRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BillingPlanResponse> listPlans(boolean activeOnly) {
        List<BillingPlan> plans = activeOnly
            ? planRepository.findAllByActiveTrueOrderBySortOrderAsc()
            : planRepository.findAll().stream()
                .sorted(Comparator.comparingInt(BillingPlan::getSortOrder))
                .toList();
        return plans.stream().map(BillingMapper::toPlan).toList();
    }

    @Override
    @Transactional
    public BillingPlanResponse createPlan(UpsertBillingPlanRequest request) {
        String code = BillingMoney.normalizePlanCode(request.code());
        if (planRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Тариф с таким кодом уже есть");
        }
        return BillingMapper.toPlan(planRepository.save(applyFields(new BillingPlan(), request, code)));
    }

    @Override
    @Transactional
    public BillingPlanResponse updatePlan(UUID planId, UpsertBillingPlanRequest request) {
        BillingPlan plan = requirePlan(planId);
        String code = BillingMoney.normalizePlanCode(request.code());
        if (planRepository.existsByCodeIgnoreCaseAndIdNot(code, planId)) {
            throw new BadRequestException("Тариф с таким кодом уже есть");
        }
        return BillingMapper.toPlan(planRepository.save(applyFields(plan, request, code)));
    }

    @Override
    @Transactional(readOnly = true)
    public BillingPlan requirePlan(UUID planId) {
        return planRepository.findById(planId)
            .orElseThrow(() -> new ResourceNotFoundException("Тариф не найден"));
    }

    private static BillingPlan applyFields(BillingPlan plan, UpsertBillingPlanRequest request, String code) {
        plan.setCode(code);
        plan.setName(request.name().trim());
        plan.setDescription(BillingMoney.trimToNull(request.description()));
        plan.setMonthlyPrice(BillingMoney.of(request.monthlyPrice()));
        plan.setCurrency(request.currency() != null && !request.currency().isBlank()
            ? request.currency().trim().toUpperCase(Locale.ROOT)
            : "UZS");
        plan.setMaxRegisters(request.maxRegisters());
        plan.setMaxStores(request.maxStores());
        plan.setActive(request.active() == null || request.active());
        plan.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        return plan;
    }
}
