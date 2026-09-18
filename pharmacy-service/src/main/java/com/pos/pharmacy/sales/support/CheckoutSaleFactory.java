package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.integration.dto.CashierShiftSnapshot;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.entity.Sale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CheckoutSaleFactory {

    private final SaleReceiptNumberGenerator receiptNumberGenerator;
    private final PharmacySalePatientSupport pharmacySalePatientSupport;

    public Sale create(
        Integer companyId,
        UUID cashierId,
        CreateSaleRequest req,
        CashierShiftSnapshot shift,
        SaleEnums.ReceiptType receiptType,
        SaleEnums.PaymentMethod paymentMethod,
        SaleEnums.CardType cardType,
        SalePaymentResolver.PaymentAmounts amounts,
        CheckoutLineAssembler.AssembledLines assembled,
        BigDecimal lineDiscountTotal,
        BigDecimal orderDiscount,
        BigDecimal orderDiscountPercent,
        BigDecimal discountTotal,
        BigDecimal total,
        OfflineSaleContext offline
    ) {
        String notes = resolveNotes(req.notes(), offline);

        Sale.SaleBuilder saleBuilder = Sale.builder()
            .companyId(companyId)
            .receiptNumber(receiptNumberGenerator.next())
            .cashierId(cashierId)
            .cashierName(shift.cashierName())
            .storeId(req.storeId())
            .cashierShiftId(shift.id())
            .subtotal(assembled.subtotalNet().setScale(2, RoundingMode.HALF_UP))
            .taxTotal(assembled.taxTotal().setScale(2, RoundingMode.HALF_UP))
            .discountTotal(discountTotal)
            .lineDiscountTotal(lineDiscountTotal)
            .orderDiscountAmount(orderDiscount)
            .orderDiscountPercent(orderDiscountPercent)
            .totalAmount(total)
            .paymentMethod(paymentMethod)
            .cashAmount(amounts.cash())
            .cardAmount(amounts.card())
            .receiptType(receiptType)
            .cardType(cardType)
            .amountTendered(amounts.tendered())
            .changeGiven(amounts.change())
            .status(SaleEnums.SaleStatus.COMPLETED)
            .notes(notes)
            .patientPinfl(pharmacySalePatientSupport.normalizePinfl(req.patientPinfl()))
            .loyaltyPhone(pharmacySalePatientSupport.normalizeLoyaltyPhone(req.loyaltyPhone()))
            .pharmacyDmed(Boolean.TRUE.equals(req.pharmacyDmed()))
            .printFiscalQr(req.printFiscalQr() == null || Boolean.TRUE.equals(req.printFiscalQr()));

        if (offline != null) {
            saleBuilder
                .clientSaleId(offline.clientSaleId())
                .offlineDeviceId(offline.offlineDeviceId())
                .createdAt(offline.createdAt() != null ? offline.createdAt() : Instant.now());
        }
        return saleBuilder.build();
    }

    private static String resolveNotes(String notes, OfflineSaleContext offline) {
        if (offline == null) {
            return notes;
        }
        if (notes == null || notes.isBlank()) {
            return "OFFLINE_SYNC";
        }
        if (!notes.contains("OFFLINE_SYNC")) {
            return notes + " | OFFLINE_SYNC";
        }
        return notes;
    }
}
