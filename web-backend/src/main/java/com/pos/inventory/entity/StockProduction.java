package com.pos.inventory.entity;

import com.pos.catalog.entity.Product;
import com.pos.entity.Store;
import com.pos.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "stock_productions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockProduction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "production_number", nullable = false, unique = true, length = 40)
    private String productionNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "output_product_id", nullable = false)
    private Product outputProduct;

    @Column(name = "output_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal outputQuantity;

    @Column(name = "output_unit_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal outputUnitCost;

    @Column(length = 1000)
    private String notes;

    @Column(name = "total_input_quantity", nullable = false, precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal totalInputQuantity = BigDecimal.ZERO;

    @Column(name = "total_input_cost", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalInputCost = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "production", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StockProductionLine> lines = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
