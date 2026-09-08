package com.pos.platform.service;

import com.pos.platform.dto.billing.BillingPlanResponse;
import com.pos.platform.dto.billing.UpsertBillingPlanRequest;
import com.pos.platform.entity.BillingPlan;

import java.util.List;
import java.util.UUID;

public interface BillingPlanService {

    List<BillingPlanResponse> listPlans(boolean activeOnly);

    BillingPlanResponse createPlan(UpsertBillingPlanRequest request);

    BillingPlanResponse updatePlan(UUID planId, UpsertBillingPlanRequest request);

    BillingPlan requirePlan(UUID planId);
}
