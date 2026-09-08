package com.pos.platform.service.impl;

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
import com.pos.platform.service.BillingChargeService;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.BillingPlanService;
import com.pos.platform.service.BillingService;
import com.pos.platform.service.BillingTopUpService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Тонкий фасад для контроллеров: делегирует в специализированные сервисы.
 */
@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final BillingPlanService planService;
    private final CompanyBillingAccountService accountService;
    private final BillingLedgerService ledgerService;
    private final BillingTopUpService topUpService;
    private final BillingChargeService chargeService;

    @Override
    public List<BillingPlanResponse> listPlans(boolean activeOnly) {
        return planService.listPlans(activeOnly);
    }

    @Override
    public BillingPlanResponse createPlan(UpsertBillingPlanRequest request) {
        return planService.createPlan(request);
    }

    @Override
    public BillingPlanResponse updatePlan(UUID planId, UpsertBillingPlanRequest request) {
        return planService.updatePlan(planId, request);
    }

    @Override
    public BillingOverviewResponse overview() {
        return accountService.overview();
    }

    @Override
    public List<CompanyBillingResponse> listCompanyBillings(BillingAccountStatus status, String search) {
        return accountService.list(status, search);
    }

    @Override
    public CompanyBillingResponse getCompanyBilling(Integer companyId) {
        return accountService.get(companyId);
    }

    @Override
    public CompanyBillingResponse assignPlan(Integer companyId, AssignCompanyPlanRequest request) {
        return accountService.assignPlan(companyId, request);
    }

    @Override
    public CompanyBillingResponse adjustBalance(Integer companyId, AdjustBalanceRequest request, boolean credit) {
        return accountService.adjustBalance(companyId, request, credit);
    }

    @Override
    public CompanyBillingResponse setBlocked(Integer companyId, boolean blocked) {
        return accountService.setBlocked(companyId, blocked);
    }

    @Override
    public PageResponse<BillingLedgerResponse> ledger(Integer companyId, BillingLedgerType type, Pageable pageable) {
        return ledgerService.list(companyId, type, pageable);
    }

    @Override
    public PageResponse<BillingTopUpResponse> listTopUps(BillingTopUpStatus status, Pageable pageable) {
        return topUpService.list(status, pageable);
    }

    @Override
    public BillingTopUpResponse submitTopUp(Integer companyId, BigDecimal amount, String comment, MultipartFile receipt) {
        return topUpService.submit(companyId, amount, comment, receipt);
    }

    @Override
    public BillingTopUpResponse approveTopUp(UUID requestId, ReviewTopUpRequest request) {
        return topUpService.approve(requestId, request);
    }

    @Override
    public BillingTopUpResponse rejectTopUp(UUID requestId, ReviewTopUpRequest request) {
        return topUpService.reject(requestId, request);
    }

    @Override
    public CompanyBillingResponse tenantSnapshot() {
        return accountService.tenantSnapshot();
    }

    @Override
    public PageResponse<BillingLedgerResponse> tenantLedger(BillingLedgerType type, Pageable pageable) {
        return ledgerService.list(BillingTenantSupport.requireCompanyId(), type, pageable);
    }

    @Override
    public PageResponse<BillingTopUpResponse> tenantTopUps(Pageable pageable) {
        return topUpService.listForCompany(BillingTenantSupport.requireCompanyId(), pageable);
    }

    @Override
    public BillingTopUpResponse tenantSubmitTopUp(BigDecimal amount, String comment, MultipartFile receipt) {
        return topUpService.submit(BillingTenantSupport.requireCompanyId(), amount, comment, receipt);
    }

    @Override
    public BillingAccessResponse accessForCompany(Integer companyId) {
        return accountService.accessForCompany(companyId);
    }

    @Override
    public int runDueCharges() {
        return chargeService.runDueCharges();
    }
}
