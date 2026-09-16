package com.pos.platform.entity;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
import java.util.UUID;

@Entity
@Table(name = "billing_payment_intents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingPaymentIntent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BillingPaymentProvider provider;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 8)
    @Builder.Default
    private String currency = "UZS";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private BillingPaymentStatus status = BillingPaymentStatus.PENDING;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    @Column(name = "provider_trans_id", length = 128)
    private String providerTransId;

    @Column(name = "provider_prepare_id", length = 128)
    private String providerPrepareId;

    @Column(name = "error_note", length = 500)
    private String errorNote;

    @Column(name = "paid_at")
    private Instant paidAt;

    /** Payme CancelTransaction reason (3 before perform, 5 after perform). */
    @Column(name = "payme_cancel_reason")
    private Integer paymeCancelReason;

    @Column(name = "payme_cancelled_at")
    private Instant paymeCancelledAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = BillingPaymentStatus.PENDING;
        }
        if (currency == null) {
            currency = "UZS";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
