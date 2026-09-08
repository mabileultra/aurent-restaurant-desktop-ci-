package com.pos.platform.entity;

import com.pos.platform.domain.BillingAccountStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "company_billing")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyBilling {

    @Id
    @Column(name = "company_id")
    private Integer companyId;

    /**
     * Read-only view of company. PK is {@link #companyId} only —
     * never derive identity from this association (avoids Hibernate null identifier).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private BillingPlan plan;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private BillingAccountStatus status = BillingAccountStatus.ACTIVE;

    @Column(name = "addon_monthly_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal addonMonthlyAmount = BigDecimal.ZERO;

    @Column(name = "auto_charge_enabled", nullable = false)
    @Builder.Default
    private boolean autoChargeEnabled = true;

    @Column(name = "period_start_on")
    private LocalDate periodStartOn;

    @Column(name = "next_charge_at")
    private Instant nextChargeAt;

    @Column(name = "paid_until")
    private Instant paidUntil;

    @Column(name = "grace_until")
    private Instant graceUntil;

    @Column(name = "billing_enabled", nullable = false)
    @Builder.Default
    private boolean billingEnabled = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getPlanId() {
        return plan != null ? plan.getId() : null;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (balance == null) {
            balance = BigDecimal.ZERO;
        }
        if (addonMonthlyAmount == null) {
            addonMonthlyAmount = BigDecimal.ZERO;
        }
        if (status == null) {
            status = BillingAccountStatus.ACTIVE;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
