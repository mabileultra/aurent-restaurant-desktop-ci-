package com.pos.pharmacy.pricing.registry.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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
@Table(name = "price_change_journal")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceChangeJournalEntry {

    @Id
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "snapshot_id", nullable = false)
    private UUID snapshotId;

    @Column(name = "registry_row_id")
    private UUID registryRowId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_name", length = 500)
    private String productName;

    @Column(length = 64)
    private String barcode;

    @Column(name = "pharm_id", length = 64)
    private String pharmId;

    @Column(name = "matched_by", length = 32)
    private String matchedBy;

    @Column(name = "old_selling_price", precision = 18, scale = 2)
    private BigDecimal oldSellingPrice;

    @Column(name = "limit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal limitPrice;

    @Column(name = "new_selling_price", precision = 18, scale = 2)
    private BigDecimal newSellingPrice;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "applied_by", length = 32)
    private String appliedBy;

    @Column(name = "applied_at")
    private Instant appliedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
