package com.pos.restaurant.edge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
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
@Table(name = "edge_products")
@IdClass(EdgeProductId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeProduct {

    @Id
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Id
    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(length = 64)
    private String sku;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(length = 64)
    private String barcode;

    @Column(name = "unit_code", length = 32)
    private String unitCode;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Column(name = "cost_price", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "selling_price", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Column(name = "stock_qty", nullable = false, precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal stockQty = BigDecimal.ZERO;

    @Column(name = "low_stock_alert", nullable = false)
    @Builder.Default
    private int lowStockAlert = 0;

    @Column(length = 32)
    private String ikpu;

    @Column(name = "package_code", length = 32)
    private String packageCode;

    @Column(name = "unit_of_measure", length = 80)
    private String unitOfMeasure;

    @Column(name = "unit_measure_code", length = 16)
    private String unitMeasureCode;

    @Column(name = "marked_product", nullable = false)
    @Builder.Default
    private boolean markedProduct = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    void preUpdate() {
        /* Callers set updatedAt for LWW; warehouse ops bump explicitly. */
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
