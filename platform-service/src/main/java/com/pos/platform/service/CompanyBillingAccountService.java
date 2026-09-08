package com.pos.platform.service;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.dto.billing.AdjustBalanceRequest;
import com.pos.platform.dto.billing.AssignCompanyPlanRequest;
import com.pos.platform.dto.billing.BillingAccessResponse;
import com.pos.platform.dto.billing.BillingOverviewResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.entity.CompanyBilling;

import java.time.Instant;
import java.util.List;

public interface CompanyBillingAccountService {

    BillingOverviewResponse overview();

    List<CompanyBillingResponse> list(BillingAccountStatus status, String search);

    CompanyBillingResponse get(Integer companyId);

    CompanyBillingResponse assignPlan(Integer companyId, AssignCompanyPlanRequest request);

    CompanyBillingResponse adjustBalance(Integer companyId, AdjustBalanceRequest request, boolean credit);

    CompanyBillingResponse setBlocked(Integer companyId, boolean blocked);

    CompanyBillingResponse tenantSnapshot();

    BillingAccessResponse accessForCompany(Integer companyId);

    CompanyBilling requireBilling(Integer companyId);

    CompanyBilling requireOrCreateBilling(Integer companyId);

    void refreshAccessStatus(CompanyBilling billing, Instant now);

    void advancePeriod(CompanyBilling billing, Instant from);
}
