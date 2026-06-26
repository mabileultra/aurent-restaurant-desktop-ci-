package com.pos.reporting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "product_snapshot_facts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSnapshotFact {

    @Id
    private UUID productId;

    @Column(nullable = false)
    private Integer companyId;

    @Column(nullable = false, length = 64)
    private String sku;

    @Column(nullable = false, length = 512)
    private String productName;

    @Column(length = 64)
    private String barcode;

    private Integer categoryId;

    @Column(length = 255)
    private String categoryName;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal costPrice;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal sellingPrice;

    @Column(nullable = false)
    private int lowStockAlert;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    private Instant updatedAt;

    @Column(nullable = false)
    private Instant ingestedAt;
}
