package com.pos.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stock_inventory_facts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockInventoryFact {

    @Id
    private UUID inventoryId;

    @Column(nullable = false)
    private Integer companyId;

    @Column(nullable = false, length = 40)
    private String inventoryNumber;

    private Integer storeId;

    @Column(length = 255)
    private String storeName;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private int totalLines;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal totalDifference;

    private UUID createdBy;

    @Column(length = 255)
    private String createdByName;

    private Instant createdAt;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @Column(nullable = false)
    private Instant ingestedAt;
}
