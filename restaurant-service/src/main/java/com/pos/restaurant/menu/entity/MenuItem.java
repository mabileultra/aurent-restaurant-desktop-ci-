package com.pos.restaurant.menu.entity;

import com.pos.restaurant.menu.domain.MenuItemType;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "menu_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 24)
    @Builder.Default
    private MenuItemType itemType = MenuItemType.DISH;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 64)
    private String sku;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    /** VAT percent. Zero until it is set on the dish card. */
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean available = true;

    @Column(name = "station_id")
    private UUID stationId;

    /** Denormalized section name for POS filters (synced from menu category). */
    @Column(length = 80)
    private String category;

    @Column(name = "menu_category_id")
    private UUID menuCategoryId;

    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    @Column(length = 280)
    private String description;

    @Column(name = "prep_minutes")
    private Integer prepMinutes;

    /** Finished plate weight in grams (legacy; prefer portionAmount + unit=G). */
    @Column(name = "portion_grams")
    private Integer portionGrams;

    /** Portion size: 0.7 plov, 250 grams, 1 piece. */
    @Column(name = "portion_amount", precision = 18, scale = 3)
    private BigDecimal portionAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "portion_unit", length = 16)
    private MenuPortionUnit portionUnit;

    /** Free-form override, e.g. "большая тарелка". */
    @Column(name = "portion_label", length = 40)
    private String portionLabel;

    /**
     * Shared id for size variants of one dish (own price + recipe each).
     * Null = standalone dish.
     */
    @Column(name = "variant_group_id")
    private UUID variantGroupId;

    /** Comma-separated codes: HIT,SPICY,CHEF,GRILL,FRESH,TEA */
    @Column(length = 120)
    private String tags;

    /** MXIK / ИКПУ for the fiscal line of this dish. */
    @Column(length = 32)
    private String ikpu;

    @Column(name = "package_code", length = 32)
    private String packageCode;

    @Column(name = "unit_of_measure", length = 80)
    private String unitOfMeasure;

    @Column(name = "unit_measure_code", length = 16)
    private String unitMeasureCode;

    @Column(length = 64)
    private String barcode;

    @Column(name = "marked_product", nullable = false)
    @Builder.Default
    private boolean markedProduct = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 100;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
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
