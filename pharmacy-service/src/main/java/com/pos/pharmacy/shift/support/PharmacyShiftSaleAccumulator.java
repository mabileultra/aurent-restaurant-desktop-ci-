package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class PharmacyShiftSaleAccumulator {

    public void applySale(
        PharmacyCashierShift shift,
        BigDecimal total,
        BigDecimal cash,
        BigDecimal card,
        BigDecimal vat,
        SaleEnums.PaymentMethod method
    ) {
        shift.setSaleCount(shift.getSaleCount() + 1);
        shift.setTotalAmount(nz(shift.getTotalAmount()).add(nz(total)));
        shift.setVatAmount(nz(shift.getVatAmount()).add(nz(vat)));
        if (method == SaleEnums.PaymentMethod.CASH) {
            shift.setCashAmount(nz(shift.getCashAmount()).add(nz(total)));
        } else if (method == SaleEnums.PaymentMethod.CARD || method == SaleEnums.PaymentMethod.CASHLESS) {
            shift.setCardAmount(nz(shift.getCardAmount()).add(nz(total)));
        } else {
            // MIXED / other — split by tendered cash/card amounts
            shift.setCashAmount(nz(shift.getCashAmount()).add(nz(cash)));
            shift.setCardAmount(nz(shift.getCardAmount()).add(nz(card)));
        }
    }

    public void applyRefund(
        PharmacyCashierShift shift,
        BigDecimal refundTotal,
        BigDecimal refundCash,
        BigDecimal refundCard,
        BigDecimal refundVat,
        SaleEnums.PaymentMethod method
    ) {
        if (shift == null || refundTotal == null || refundTotal.signum() <= 0) {
            return;
        }
        shift.setTotalAmount(floor(nz(shift.getTotalAmount()).subtract(refundTotal)));
        shift.setVatAmount(floor(nz(shift.getVatAmount()).subtract(nz(refundVat))));
        if (method == SaleEnums.PaymentMethod.CASH) {
            shift.setCashAmount(floor(nz(shift.getCashAmount()).subtract(refundTotal)));
        } else if (method == SaleEnums.PaymentMethod.CARD || method == SaleEnums.PaymentMethod.CASHLESS) {
            shift.setCardAmount(floor(nz(shift.getCardAmount()).subtract(refundTotal)));
        } else {
            shift.setCashAmount(floor(nz(shift.getCashAmount()).subtract(nz(refundCash))));
            shift.setCardAmount(floor(nz(shift.getCardAmount()).subtract(nz(refundCard))));
        }
    }

    private static BigDecimal floor(BigDecimal value) {
        return value.signum() < 0 ? BigDecimal.ZERO : value;
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
