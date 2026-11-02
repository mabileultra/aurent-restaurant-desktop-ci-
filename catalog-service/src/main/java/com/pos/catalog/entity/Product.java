package com.pos.catalog.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Grocery catalog card. Live stock lives in Inventory ({@code store_stock}), not here.
 */
@Entity
@Table(
    name = "products",
    uniqueConstraints = @UniqueConstraint(name = "uq_products_company_sku", columnNames = {"company_id", "sku"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    /** Assigned by caller (web-backend dual-write / backfill). Never regenerate on persist. */
    @Id
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(nullable = false, length = 120)
    private String sku;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "business_type_code", length = 50)
    private String businessTypeCode;

    @Column(name = "product_type", nullable = false, length = 30)
    @Builder.Default
    private String productType = "RETAIL";

    @Column(name = "cost_price", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "selling_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "default_discount_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal defaultDiscountPercent = BigDecimal.ZERO;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = new BigDecimal("12");

    @Column(name = "sale_type", nullable = false, length = 20)
    @Builder.Default
    private String saleType = "PIECE";

    @Column(name = "unit_code", nullable = false, length = 16)
    @Builder.Default
    private String unitCode = "PCS";

    @Column(name = "quantity_scale", nullable = false)
    @Builder.Default
    private int quantityScale = 0;

    @Column(name = "allow_fraction", nullable = false)
    @Builder.Default
    private boolean allowFraction = false;

    @Column(name = "low_stock_alert")
    @Builder.Default
    private int lowStockAlert = 10;

    @Column(length = 100)
    private String barcode;

    @Column(length = 5)
    private String plu;

    @Column(name = "image_url", length = 500)
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

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductBarcode> extraBarcodes = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductStorePrice> storePrices = new ArrayList<>();

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
