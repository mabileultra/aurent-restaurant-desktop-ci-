package com.pos.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "sale_facts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleFact {

    @Id
    private UUID saleId;

    private Integer companyId;
    private Integer storeId;

    @Column(nullable = false, length = 64)
    private String receiptNumber;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal cashAmount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal cardAmount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal returnedAmount;

    @Column(length = 32)
    private String paymentMethod;

    @Column(nullable = false)
    private LocalDate transactionDate;

    private UUID createdBy;

    @Column(length = 255)
    private String storeName;

    @Column(length = 255)
    private String cashierName;

    @Column(nullable = false)
    private Long itemsSold;

    @Column(name = "sale_status", nullable = false, length = 20)
    private String saleStatus;

    @Column(nullable = false)
    private Instant ingestedAt;
}
