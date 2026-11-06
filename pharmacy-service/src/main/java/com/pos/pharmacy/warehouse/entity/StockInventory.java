package com.pos.pharmacy.warehouse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "stock_inventories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "inventory_number", nullable = false, unique = true, length = 40)
    private String inventoryNumber;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "total_lines", nullable = false)
    @Builder.Default
    private int totalLines = 0;

    @Column(name = "total_difference", nullable = false, precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal totalDifference = BigDecimal.ZERO;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "inventory", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StockInventoryLine> lines = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
