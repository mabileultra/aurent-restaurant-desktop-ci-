package com.pos.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "stock_inventory_lines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockInventoryLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private StockInventory inventory;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "product_sku", length = 120)
    private String productSku;

    @Column(name = "system_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal systemQuantity = BigDecimal.ZERO;

    @Column(name = "counted_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal countedQuantity = BigDecimal.ZERO;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal difference = BigDecimal.ZERO;
}
