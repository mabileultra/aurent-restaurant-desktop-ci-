package com.pos.platform.service.support;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.dto.billing.BillingLedgerResponse;
import com.pos.platform.dto.billing.BillingPlanResponse;
import com.pos.platform.dto.billing.BillingTopUpResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.entity.BillingLedgerEntry;
import com.pos.platform.entity.BillingPlan;
import com.pos.platform.entity.BillingTopUpRequest;
import com.pos.platform.entity.CompanyBilling;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class BillingMapper {

    private BillingMapper() {}

    public static BillingPlanResponse toPlan(BillingPlan plan) {
        return new BillingPlanResponse(
            plan.getId(),
            plan.getCode(),
            plan.getName(),
            plan.getDescription(),
            plan.getMonthlyPrice(),
            plan.getCurrency(),
            plan.getMaxRegisters(),
            plan.getMaxStores(),
            plan.isActive(),
            plan.getSortOrder()
        );
    }

    public static BigDecimal monthlyTotal(CompanyBilling billing) {
        BigDecimal planPrice = billing.getPlan() != null && billing.getPlan().getMonthlyPrice() != null
            ? billing.getPlan().getMonthlyPrice()
            : BigDecimal.ZERO;
        BigDecimal addon = billing.getAddonMonthlyAmount() != null
            ? billing.getAddonMonthlyAmount()
            : BigDecimal.ZERO;
        return planPrice.add(addon).setScale(2, RoundingMode.HALF_UP);
    }

    public static CompanyBillingResponse toCompany(CompanyBilling billing) {
        BillingPlan plan = billing.getPlan();
        String companyName = billing.getCompany() != null ? billing.getCompany().getName() : null;
        return new CompanyBillingResponse(
            billing.getCompanyId(),
            companyName,
            plan != null ? plan.getId() : null,
            plan != null ? plan.getCode() : null,
            plan != null ? plan.getName() : null,
            plan != null ? plan.getMonthlyPrice() : null,
            billing.getAddonMonthlyAmount(),
            monthlyTotal(billing),
            billing.getBalance(),
            billing.getStatus() != null ? billing.getStatus() : BillingAccountStatus.ACTIVE,
            billing.isBillingEnabled(),
            billing.isAutoChargeEnabled(),
            billing.getNextChargeAt(),
            billing.getPaidUntil(),
            billing.getGraceUntil(),
            plan != null ? plan.getMaxRegisters() : null,
            plan != null ? plan.getMaxStores() : null,
            plan != null ? plan.getCurrency() : "UZS"
        );
    }

    public static BillingLedgerResponse toLedger(BillingLedgerEntry entry) {
        return new BillingLedgerResponse(
            entry.getId(),
            entry.getCompanyId(),
            entry.getEntryType() != null ? entry.getEntryType() : BillingLedgerType.ADJUST,
            entry.getAmount(),
            entry.getBalanceAfter(),
            entry.getDescription(),
            entry.getCreatedAt()
        );
    }

    public static BillingTopUpResponse toTopUp(BillingTopUpRequest req, String companyName) {
        return new BillingTopUpResponse(
            req.getId(),
            req.getCompanyId(),
            companyName,
            req.getAmount(),
            req.getStatus() != null ? req.getStatus() : BillingTopUpStatus.PENDING,
            req.getComment(),
            req.getReceiptFileName(),
            req.getReceiptStoragePath() != null && !req.getReceiptStoragePath().isBlank(),
            req.getSubmittedByUserId(),
            req.getReviewedByUserId(),
            req.getReviewNote(),
            req.getReviewedAt(),
            req.getCreatedAt()
        );
    }
}
