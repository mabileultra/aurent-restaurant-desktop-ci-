package com.pos.platform.service;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.dto.billing.AdjustBalanceRequest;
import com.pos.platform.dto.billing.AssignCompanyPlanRequest;
import com.pos.platform.dto.billing.BillingAccessResponse;
import com.pos.platform.dto.billing.BillingLedgerResponse;
import com.pos.platform.dto.billing.BillingOverviewResponse;
import com.pos.platform.dto.billing.BillingPlanResponse;
import com.pos.platform.dto.billing.BillingTopUpResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.ReviewTopUpRequest;
import com.pos.platform.dto.billing.UpsertBillingPlanRequest;
import com.pos.platform.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface BillingService {

    List<BillingPlanResponse> listPlans(boolean activeOnly);

    BillingPlanResponse createPlan(UpsertBillingPlanRequest request);

    BillingPlanResponse updatePlan(UUID planId, UpsertBillingPlanRequest request);

    BillingOverviewResponse overview();

    List<CompanyBillingResponse> listCompanyBillings(BillingAccountStatus status, String search);

    CompanyBillingResponse getCompanyBilling(Integer companyId);

    CompanyBillingResponse assignPlan(Integer companyId, AssignCompanyPlanRequest request);

    CompanyBillingResponse adjustBalance(Integer companyId, AdjustBalanceRequest request, boolean credit);

    CompanyBillingResponse setBlocked(Integer companyId, boolean blocked);

    PageResponse<BillingLedgerResponse> ledger(Integer companyId, BillingLedgerType type, Pageable pageable);

    PageResponse<BillingTopUpResponse> listTopUps(BillingTopUpStatus status, Pageable pageable);

    BillingTopUpResponse submitTopUp(Integer companyId, BigDecimal amount, String comment, MultipartFile receipt);

    BillingTopUpResponse approveTopUp(UUID requestId, ReviewTopUpRequest request);

    BillingTopUpResponse rejectTopUp(UUID requestId, ReviewTopUpRequest request);

    CompanyBillingResponse tenantSnapshot();

    PageResponse<BillingLedgerResponse> tenantLedger(BillingLedgerType type, Pageable pageable);

    PageResponse<BillingTopUpResponse> tenantTopUps(Pageable pageable);

    BillingTopUpResponse tenantSubmitTopUp(BigDecimal amount, String comment, MultipartFile receipt);

    BillingAccessResponse accessForCompany(Integer companyId);

    int runDueCharges();
}
