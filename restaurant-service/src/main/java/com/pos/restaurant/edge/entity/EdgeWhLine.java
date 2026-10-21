package com.pos.restaurant.edge.entity;

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
import java.util.UUID;

@Entity
@Table(name = "edge_wh_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeWhLine {

    @Id
    private UUID id;

    @Column(name = "doc_id", nullable = false)
    private UUID docId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", length = 300)
    private String productName;

    @Column(length = 64)
    private String sku;

    @Column(precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "purchase_price", precision = 18, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "unit_selling_price", precision = 18, scale = 2)
    private BigDecimal unitSellingPrice;

    @Column(name = "line_cost", precision = 18, scale = 2)
    private BigDecimal lineCost;

    @Column(name = "system_qty", precision = 18, scale = 3)
    private BigDecimal systemQty;

    @Column(name = "counted_qty", precision = 18, scale = 3)
    private BigDecimal countedQty;

    @Column(precision = 18, scale = 3)
    private BigDecimal difference;

    @Column(name = "unit_cost", precision = 18, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "vat_percent")
    private Integer vatPercent;

    @Column(name = "marked_product")
    private Boolean markedProduct;

    @Column(name = "storage_location", length = 120)
    private String storageLocation;
}
