package com.pos.pharmacy.catalog.entity;

import com.pos.pharmacy.domain.ProductType;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "products",
    uniqueConstraints = @UniqueConstraint(name = "uq_pharm_products_company_sku", columnNames = {"company_id", "sku"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(nullable = false, length = 100)
    private String sku;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "cost_price", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "selling_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "default_discount_percent", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal defaultDiscountPercent = BigDecimal.ZERO;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = new BigDecimal("12");

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 30)
    @Builder.Default
    private ProductType productType = ProductType.RETAIL;

    @Enumerated(EnumType.STRING)
    @Column(name = "sale_type", nullable = false, length = 20)
    @Builder.Default
    private SaleType saleType = SaleType.PIECE;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_code", nullable = false, length = 16)
    @Builder.Default
    private UnitCode unitCode = UnitCode.PCS;

    @Column(name = "quantity_scale", nullable = false)
    @Builder.Default
    private int quantityScale = 0;

    @Column(name = "allow_fraction", nullable = false)
    @Builder.Default
    private boolean allowFraction = false;

    @Column(name = "stock_quantity", nullable = false, precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(name = "low_stock_alert")
    @Builder.Default
    private int lowStockAlert = 10;

    private String barcode;

    @Column(length = 5)
    private String plu;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    @Column(name = "external_product_id", length = 100)
    private String externalProductId;

    @Column(length = 32)
    private String ikpu;

    @Column(name = "ikpu_status", length = 30)
    @Builder.Default
    private String ikpuStatus = "UNKNOWN";

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "unit_measure_code", length = 20)
    private String unitMeasureCode;

    @Column(name = "package_code", length = 20)
    private String packageCode;

    @Column(name = "sold_individually")
    @Builder.Default
    private boolean soldIndividually = true;

    @Column(name = "marked_product")
    @Builder.Default
    private boolean markedProduct = false;

    @Column(name = "storage_location")
    private String storageLocation;

    @Column(name = "owner_type", length = 50)
    private String ownerType;

    @Column(name = "commission_tin", length = 9)
    private String commissionTin;

    @Column(name = "commission_pinfl", length = 14)
    private String commissionPinfl;

    @Column(name = "uz_invoice_document_id", length = 64)
    private String uzInvoiceDocumentId;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
