package com.pos.platform.controller;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.dto.billing.BillingAccessResponse;
import com.pos.platform.dto.billing.BillingLedgerResponse;
import com.pos.platform.dto.billing.BillingPaymentCreateResponse;
import com.pos.platform.dto.billing.BillingPlanResponse;
import com.pos.platform.dto.billing.BillingTopUpResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.CreateBillingPaymentRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.service.BillingPaymentService;
import com.pos.platform.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/billing")
@RequiredArgsConstructor
@Tag(name = "Tenant Billing", description = "Биллинг компании")
public class TenantBillingController {

    private final BillingService billingService;
    private final BillingPaymentService paymentService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Баланс и тариф текущей компании")
    public ResponseEntity<CompanyBillingResponse> me() {
        return ResponseEntity.ok(billingService.tenantSnapshot());
    }

    @GetMapping("/me/access")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BillingAccessResponse> access() {
        Integer companyId = com.pos.platform.security.PlatformTenantContext.getCompanyId();
        if (companyId == null) {
            return ResponseEntity.ok(new BillingAccessResponse(null, false, true, null));
        }
        return ResponseEntity.ok(billingService.accessForCompany(companyId));
    }

    @GetMapping("/plans")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BillingPlanResponse>> plans() {
        return ResponseEntity.ok(billingService.listPlans(true));
    }

    @GetMapping("/me/ledger")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PageResponse<BillingLedgerResponse>> ledger(
        @RequestParam(required = false) BillingLedgerType type,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(billingService.tenantLedger(type, pageable));
    }

    @GetMapping("/me/top-ups")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PageResponse<BillingTopUpResponse>> topUps(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(billingService.tenantTopUps(pageable));
    }

    @PostMapping(value = "/me/top-ups", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BillingTopUpResponse> submitTopUp(
        @RequestParam("amount") BigDecimal amount,
        @RequestParam(value = "comment", required = false) String comment,
        @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(billingService.tenantSubmitTopUp(amount, comment, file));
    }

    @PostMapping("/me/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Оплата Click/Payme — баланс зачислится сразу после успешной оплаты")
    public ResponseEntity<BillingPaymentCreateResponse> createPayment(
        @Valid @RequestBody CreateBillingPaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.createPayment(request.provider(), request.amount()));
    }
}
