package com.pos.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stock_movement_facts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementFact {

    @Id
    private UUID movementId;

    private Integer companyId;
    private Integer storeId;

    @Column(length = 255)
    private String storeName;

    private UUID productId;

    @Column(nullable = false, length = 512)
    private String productName;

    @Column(length = 64)
    private String sku;

    @Column(length = 64)
    private String barcode;

    @Column(nullable = false, length = 20)
    private String movementType;

    @Column(length = 30)
    private String writeOffReason;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(precision = 18, scale = 2)
    private BigDecimal unitCostEstimate;

    @Column(length = 512)
    private String notes;

    private UUID referenceId;

    @Column(length = 40)
    private String referenceNumber;

    private UUID createdBy;

    @Column(length = 255)
    private String createdByName;

    private Instant createdAt;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @Column(nullable = false)
    private Instant ingestedAt;
}
