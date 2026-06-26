package com.pos.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "sale_item_facts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleItemFact {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID saleId;

    private Integer companyId;
    private Integer storeId;

    @Column(nullable = false)
    private LocalDate transactionDate;

    private UUID productId;

    @Column(nullable = false, length = 512)
    private String productName;

    @Column(length = 128)
    private String sku;

    @Column(length = 128)
    private String barcode;

    private Integer categoryId;

    @Column(length = 255)
    private String categoryName;

    @Column(nullable = false)
    private Long quantity;

    @Column(nullable = false)
    private Long quantityReturned;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal revenue;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal costEstimate;

    @Column(nullable = false)
    private Instant ingestedAt;
}
