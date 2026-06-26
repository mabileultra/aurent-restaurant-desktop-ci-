package com.pos.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stock_transfer_facts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransferFact {

    @Id
    private UUID transferId;

    @Column(nullable = false)
    private Integer companyId;

    @Column(nullable = false, length = 40)
    private String transferNumber;

    @Column(nullable = false)
    private Integer fromStoreId;

    @Column(length = 255)
    private String fromStoreName;

    @Column(nullable = false)
    private Integer toStoreId;

    @Column(length = 255)
    private String toStoreName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal totalQuantity;

    private UUID createdBy;

    @Column(length = 255)
    private String createdByName;

    private Instant createdAt;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @Column(nullable = false)
    private Instant ingestedAt;
}
