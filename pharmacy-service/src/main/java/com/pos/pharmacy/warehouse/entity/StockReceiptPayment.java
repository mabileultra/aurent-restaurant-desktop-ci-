package com.pos.pharmacy.warehouse.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "stock_receipt_payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReceiptPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receipt_id", nullable = false)
    private StockReceipt receipt;

    @Column(nullable = false, length = 20)
    private String method;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
