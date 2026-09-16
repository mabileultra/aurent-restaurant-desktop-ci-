package com.pos.inventory.entity;

import jakarta.persistence.*;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.inventory.domain.StockReceiptStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "stock_receipts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "receipt_number", nullable = false, unique = true, length = 40)
    private String receiptNumber;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = StockReceiptStatus.POSTED;

    @Column(name = "document_date")
    private LocalDate documentDate;

    @Column(name = "receipt_type", length = 40)
    private String receiptType;

    @Column(name = "default_markup_percent", precision = 8, scale = 2)
    private BigDecimal defaultMarkupPercent;

    @Column(name = "invoice_number", length = 80)
    private String invoiceNumber;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "contract_number", length = 80)
    private String contractNumber;

    @Column(name = "financial_discount", precision = 18, scale = 2)
    private BigDecimal financialDiscount;

    @Column(name = "payment_type", length = 20)
    private String paymentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    private String notes;

    @Column(name = "total_quantity", nullable = false, precision = 18, scale = 3)
    @Builder.Default
    private BigDecimal totalQuantity = BigDecimal.ZERO;

    @Column(name = "total_cost", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Column(name = "total_retail", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalRetail = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activated_by")
    private User activatedBy;

    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StockReceiptLine> lines = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = StockReceiptStatus.POSTED;
        }
        if (documentDate == null) {
            documentDate = LocalDate.now();
        }
        if (totalRetail == null) {
            totalRetail = BigDecimal.ZERO;
        }
    }
}
