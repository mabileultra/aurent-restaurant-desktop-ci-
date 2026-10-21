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
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "edge_wh_docs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EdgeWhDocument {

    @Id
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "doc_type", nullable = false, length = 24)
    private String docType;

    @Column(name = "doc_number", nullable = false, length = 64)
    private String docNumber;

    @Column(name = "store_id")
    private Integer storeId;

    @Column(name = "store_id_2")
    private Integer storeId2;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Column(name = "supplier_name", length = 300)
    private String supplierName;

    @Column(name = "output_product_id")
    private UUID outputProductId;

    @Column(name = "output_product_name", length = 300)
    private String outputProductName;

    @Column(name = "output_qty", precision = 18, scale = 3)
    private BigDecimal outputQty;

    @Column(name = "output_unit_cost", precision = 18, scale = 2)
    private BigDecimal outputUnitCost;

    @Column(length = 120)
    private String reason;

    @Column(length = 300)
    private String recipient;

    @Column(length = 32)
    private String status;

    @Column(length = 1000)
    private String notes;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_name", length = 300)
    private String productName;

    @Column(length = 64)
    private String sku;

    @Column(name = "total_qty", precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal totalQty = BigDecimal.ZERO;

    @Column(name = "total_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Column(name = "total_diff", precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal totalDiff = BigDecimal.ZERO;

    @Column(name = "total_lines")
    @Builder.Default
    private int totalLines = 0;

    @Column(name = "loss_amount", precision = 18, scale = 2)
    private BigDecimal lossAmount;

    @Column(name = "created_by_name", length = 200)
    private String createdByName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
