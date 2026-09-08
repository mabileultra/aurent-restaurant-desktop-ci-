package com.pos.platform.entity;

import com.pos.platform.domain.BillingTopUpStatus;
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
@Table(name = "billing_topup_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingTopUpRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private BillingTopUpStatus status = BillingTopUpStatus.PENDING;

    @Column(length = 500)
    private String comment;

    @Column(name = "receipt_file_name", length = 255)
    private String receiptFileName;

    @Column(name = "receipt_content_type", length = 128)
    private String receiptContentType;

    @Column(name = "receipt_storage_path", length = 512)
    private String receiptStoragePath;

    @Column(name = "submitted_by_user_id")
    private UUID submittedByUserId;

    @Column(name = "reviewed_by_user_id")
    private UUID reviewedByUserId;

    @Column(name = "review_note", length = 500)
    private String reviewNote;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

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
            status = BillingTopUpStatus.PENDING;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
