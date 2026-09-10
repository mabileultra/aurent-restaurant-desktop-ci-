package com.pos.platform.controller;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.dto.billing.AdjustBalanceRequest;
import com.pos.platform.dto.billing.AssignCompanyPlanRequest;
import com.pos.platform.dto.billing.BillingLedgerResponse;
import com.pos.platform.dto.billing.BillingOverviewResponse;
import com.pos.platform.dto.billing.BillingPaymentIntentResponse;
import com.pos.platform.dto.billing.BillingPlanResponse;
import com.pos.platform.dto.billing.BillingTopUpResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.ReviewTopUpRequest;
import com.pos.platform.dto.billing.UpsertBillingPlanRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.service.BillingPaymentService;
import com.pos.platform.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/platform/billing")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Billing", description = "SaaS биллинг (SUPER_ADMIN)")
public class PlatformBillingController {

    private final BillingService billingService;
    private final BillingPaymentService paymentService;

    @GetMapping("/overview")
    @Operation(summary = "KPI биллинга")
    public ResponseEntity<BillingOverviewResponse> overview() {
        return ResponseEntity.ok(billingService.overview());
    }

    @GetMapping("/plans")
    public ResponseEntity<List<BillingPlanResponse>> plans(
        @RequestParam(defaultValue = "false") boolean activeOnly
    ) {
        return ResponseEntity.ok(billingService.listPlans(activeOnly));
    }

    @PostMapping("/plans")
    public ResponseEntity<BillingPlanResponse> createPlan(@Valid @RequestBody UpsertBillingPlanRequest request) {
        return ResponseEntity.ok(billingService.createPlan(request));
    }

    @PutMapping("/plans/{planId}")
    public ResponseEntity<BillingPlanResponse> updatePlan(
        @PathVariable UUID planId,
        @Valid @RequestBody UpsertBillingPlanRequest request
    ) {
        return ResponseEntity.ok(billingService.updatePlan(planId, request));
    }

    @GetMapping("/companies")
    public ResponseEntity<List<CompanyBillingResponse>> companies(
        @RequestParam(required = false) BillingAccountStatus status,
        @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(billingService.listCompanyBillings(status, search));
    }

    @GetMapping("/companies/{companyId}")
    public ResponseEntity<CompanyBillingResponse> company(@PathVariable Integer companyId) {
        return ResponseEntity.ok(billingService.getCompanyBilling(companyId));
    }

    @PutMapping("/companies/{companyId}/plan")
    public ResponseEntity<CompanyBillingResponse> assignPlan(
        @PathVariable Integer companyId,
        @Valid @RequestBody AssignCompanyPlanRequest request
    ) {
        return ResponseEntity.ok(billingService.assignPlan(companyId, request));
    }

    @PostMapping("/companies/{companyId}/top-up")
    public ResponseEntity<CompanyBillingResponse> topUp(
        @PathVariable Integer companyId,
        @Valid @RequestBody AdjustBalanceRequest request
    ) {
        return ResponseEntity.ok(billingService.adjustBalance(companyId, request, true));
    }

    @PostMapping("/companies/{companyId}/charge")
    public ResponseEntity<CompanyBillingResponse> charge(
        @PathVariable Integer companyId,
        @Valid @RequestBody AdjustBalanceRequest request
    ) {
        return ResponseEntity.ok(billingService.adjustBalance(companyId, request, false));
    }

    @PostMapping("/companies/{companyId}/block")
    public ResponseEntity<CompanyBillingResponse> block(@PathVariable Integer companyId) {
        return ResponseEntity.ok(billingService.setBlocked(companyId, true));
    }

    @PostMapping("/companies/{companyId}/unblock")
    public ResponseEntity<CompanyBillingResponse> unblock(@PathVariable Integer companyId) {
        return ResponseEntity.ok(billingService.setBlocked(companyId, false));
    }

    @GetMapping("/companies/{companyId}/ledger")
    public ResponseEntity<PageResponse<BillingLedgerResponse>> ledger(
        @PathVariable Integer companyId,
        @RequestParam(required = false) BillingLedgerType type,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(billingService.ledger(companyId, type, pageable));
    }

    @GetMapping("/top-ups")
    public ResponseEntity<PageResponse<BillingTopUpResponse>> topUps(
        @RequestParam(required = false) BillingTopUpStatus status,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(billingService.listTopUps(status, pageable));
    }

    @PostMapping("/top-ups/{requestId}/approve")
    public ResponseEntity<BillingTopUpResponse> approve(
        @PathVariable UUID requestId,
        @RequestBody(required = false) ReviewTopUpRequest request
    ) {
        return ResponseEntity.ok(billingService.approveTopUp(requestId, request != null ? request : new ReviewTopUpRequest(null)));
    }

    @PostMapping("/top-ups/{requestId}/reject")
    public ResponseEntity<BillingTopUpResponse> reject(
        @PathVariable UUID requestId,
        @RequestBody(required = false) ReviewTopUpRequest request
    ) {
        return ResponseEntity.ok(billingService.rejectTopUp(requestId, request != null ? request : new ReviewTopUpRequest(null)));
    }

    @GetMapping("/payments")
    @Operation(summary = "Онлайн-платежи Click/Payme")
    public ResponseEntity<PageResponse<BillingPaymentIntentResponse>> payments(
        @RequestParam(required = false) Integer companyId,
        @RequestParam(required = false) BillingPaymentStatus status,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(paymentService.list(companyId, status, pageable));
    }

    @PostMapping("/run-charges")
    public ResponseEntity<Map<String, Integer>> runCharges() {
        return ResponseEntity.ok(Map.of("charged", billingService.runDueCharges()));
    }
}
