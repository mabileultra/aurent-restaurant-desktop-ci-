package com.pos.sales.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "sale_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    /** Catalog product id — no JPA association (Wave 2.2). DB FK remains until Wave 2.5. */
    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_sku", length = 120)
    private String productSku;

    @Column(name = "product_barcode", length = 64)
    private String productBarcode;

    @Column(name = "unit_code", length = 16)
    private String unitCode;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "sale_type", length = 20)
    private String saleType;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate;

    @Column(name = "ikpu", length = 32)
    private String ikpu;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(name = "returned_quantity", nullable = false, precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal returnedQuantity = BigDecimal.ZERO;

    @Column(precision = 18, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "line_total", nullable = false, precision = 18, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "batch_number", length = 80)
    private String batchNumber;

    @Column(name = "expiry_date")
    private java.time.LocalDate expiryDate;

    @OneToMany(mappedBy = "saleItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<SaleItemLot> lotAllocations = new java.util.ArrayList<>();
}
