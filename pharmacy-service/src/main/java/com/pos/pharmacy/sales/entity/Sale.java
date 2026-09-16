package com.pos.pharmacy.sales.entity;

import com.pos.pharmacy.sales.domain.SaleEnums;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sales")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "receipt_number", nullable = false, unique = true, length = 50)
    private String receiptNumber;

    @Column(name = "cashier_id", nullable = false)
    private UUID cashierId;

    @Column(name = "cashier_name", length = 200)
    private String cashierName;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(name = "cashier_shift_id")
    private UUID cashierShiftId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "tax_total", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(name = "discount_total", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "line_discount_total", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal lineDiscountTotal = BigDecimal.ZERO;

    @Column(name = "order_discount_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal orderDiscountAmount = BigDecimal.ZERO;

    @Column(name = "order_discount_percent", precision = 5, scale = 2)
    private BigDecimal orderDiscountPercent;

    @Column(name = "total_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private SaleEnums.PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "receipt_type", length = 20)
    @Builder.Default
    private SaleEnums.ReceiptType receiptType = SaleEnums.ReceiptType.SALE;

    @Enumerated(EnumType.STRING)
    @Column(name = "card_type", length = 20)
    private SaleEnums.CardType cardType;

    @Column(name = "cash_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal cashAmount = BigDecimal.ZERO;

    @Column(name = "card_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal cardAmount = BigDecimal.ZERO;

    @Column(name = "amount_tendered", precision = 18, scale = 2)
    private BigDecimal amountTendered;

    @Column(name = "change_given", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal changeGiven = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private SaleEnums.SaleStatus status = SaleEnums.SaleStatus.COMPLETED;

    private String notes;

    @Column(name = "patient_pinfl", length = 14)
    private String patientPinfl;

    @Column(name = "loyalty_phone", length = 32)
    private String loyaltyPhone;

    @Column(name = "pharmacy_dmed", nullable = false)
    @Builder.Default
    private boolean pharmacyDmed = false;

    /** Idempotency key from desktop offline queue. */
    @Column(name = "client_sale_id", unique = true)
    private UUID clientSaleId;

    @Column(name = "offline_device_id", length = 64)
    private String offlineDeviceId;

    @Column(name = "fiscal_status", nullable = false, length = 32)
    @Builder.Default
    private String fiscalStatus = "NOT_REQUIRED";

    @Column(name = "fiscal_sign", length = 128)
    private String fiscalSign;

    @Column(name = "fiscal_receipt_seq", length = 64)
    private String fiscalReceiptSeq;

    @Column(name = "multikassa_sale_id", length = 128)
    private String multikassaSaleId;

    @Column(name = "fiscal_qr_url", length = 1024)
    private String fiscalQrUrl;

    @Column(name = "fiscal_terminal_id", length = 128)
    private String fiscalTerminalId;

    @Column(name = "fiscalized_at")
    private Instant fiscalizedAt;

    @Column(name = "fiscal_error", length = 1000)
    private String fiscalError;

    @Column(name = "print_fiscal_qr", nullable = false)
    @Builder.Default
    private boolean printFiscalQr = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
