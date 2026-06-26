package com.pos.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stock_receipt_facts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReceiptFact {

    @Id
    private UUID receiptId;

    private Integer companyId;
    private Integer storeId;
    private UUID supplierId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 18, scale = 3)
    private BigDecimal totalQuantity;

    @Column(length = 40)
    private String receiptNumber;

    @Column(length = 255)
    private String supplierName;

    @Column(length = 255)
    private String storeName;

    @Column(nullable = false)
    private LocalDate transactionDate;

    private UUID createdBy;

    private Instant createdAt;

    @Column(nullable = false)
    private Instant ingestedAt;
}
