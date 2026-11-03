package com.pos.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "stock_production_lines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockProductionLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_id", nullable = false)
    private StockProduction production;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "product_sku", length = 120)
    private String productSku;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "line_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal lineCost;
}
