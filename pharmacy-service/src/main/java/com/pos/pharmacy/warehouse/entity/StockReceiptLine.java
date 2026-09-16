package com.pos.pharmacy.warehouse.entity;

import com.pos.pharmacy.catalog.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stock_receipt_lines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReceiptLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id", nullable = false)
    private StockReceipt receipt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(name = "purchase_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "unit_selling_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitSellingPrice;

    @Column(name = "line_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal lineCost;

    @Column(name = "batch_number", length = 80)
    private String batchNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "vat_percent", precision = 5, scale = 2)
    private BigDecimal vatPercent;

    @Column(name = "markup_percent", precision = 8, scale = 2)
    private BigDecimal markupPercent;

    @Column(name = "units_in_pack", precision = 18, scale = 3)
    private BigDecimal unitsInPack;

    @Column(name = "purchase_price_with_vat", precision = 18, scale = 2)
    private BigDecimal purchasePriceWithVat;

    @Column(name = "retail_price", precision = 18, scale = 2)
    private BigDecimal retailPrice;

    @Column(name = "unit_retail_price", precision = 18, scale = 2)
    private BigDecimal unitRetailPrice;

    @Column(name = "line_retail", precision = 18, scale = 2)
    private BigDecimal lineRetail;
}
