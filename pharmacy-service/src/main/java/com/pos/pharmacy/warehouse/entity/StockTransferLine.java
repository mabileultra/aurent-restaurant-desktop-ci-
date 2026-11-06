package com.pos.pharmacy.warehouse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "stock_transfer_lines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransferLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transfer_id", nullable = false)
    private StockTransfer transfer;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", length = 500)
    private String productName;

    @Column(name = "product_sku", length = 80)
    private String productSku;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;
}
