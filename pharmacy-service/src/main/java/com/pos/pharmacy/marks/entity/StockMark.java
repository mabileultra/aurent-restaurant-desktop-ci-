package com.pos.pharmacy.marks.entity;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stock_marks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "lot_id")
    private UUID lotId;

    @Column(name = "receipt_id")
    private UUID receiptId;

    @Column(name = "receipt_line_id")
    private UUID receiptLineId;

    @Column(name = "mark_code", nullable = false, columnDefinition = "TEXT")
    private String markCode;

    @Column(name = "mark_key", nullable = false, length = 190)
    private String markKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private StockMarkStatus status;

    @Column(name = "asl_status", length = 64)
    private String aslStatus;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "sale_id")
    private UUID saleId;

    @Column(name = "sold_at")
    private Instant soldAt;

    @Column(name = "withdraw_attempts", nullable = false)
    @Builder.Default
    private int withdrawAttempts = 0;

    @Column(name = "last_withdraw_at")
    private Instant lastWithdrawAt;

    @Column(name = "last_withdraw_error", length = 500)
    private String lastWithdrawError;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = StockMarkStatus.IN_STOCK;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
