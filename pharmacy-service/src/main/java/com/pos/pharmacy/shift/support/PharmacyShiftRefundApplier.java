package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.support.PharmacySaleNetAmounts;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.repository.PharmacyCashierShiftRepository;
import com.pos.shared.money.TenderNet;
import com.pos.shared.money.TenderNetCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class PharmacyShiftRefundApplier {

    private final PharmacyCashierShiftRepository shiftRepository;
    private final PharmacyShiftSaleAccumulator accumulator;

    public BigDecimal returnedNow(Sale sale) {
        return PharmacySaleNetAmounts.returnedAgainstHeader(sale);
    }

    public void applySince(Sale sale, BigDecimal returnedBefore) {
        if (sale == null || sale.getCashierShiftId() == null) {
            return;
        }
        BigDecimal before = returnedBefore != null ? returnedBefore : BigDecimal.ZERO;
        BigDecimal after = PharmacySaleNetAmounts.returnedAgainstHeader(sale);
        TenderNet beforeNet = TenderNetCalculator.remaining(
            sale.getTotalAmount(), sale.getCashAmount(), sale.getCardAmount(), before
        );
        TenderNet afterNet = TenderNetCalculator.remaining(
            sale.getTotalAmount(), sale.getCashAmount(), sale.getCardAmount(), after
        );
        BigDecimal refundTotal = beforeNet.total().subtract(afterNet.total());
        if (refundTotal.signum() <= 0) {
            return;
        }
        PharmacyCashierShift shift = shiftRepository.findById(sale.getCashierShiftId()).orElse(null);
        if (shift == null) {
            return;
        }
        BigDecimal vatBefore = vatAt(sale, before);
        BigDecimal vatAfter = PharmacySaleNetAmounts.returnedVat(sale);
        accumulator.applyRefund(
            shift,
            refundTotal,
            beforeNet.cash().subtract(afterNet.cash()),
            beforeNet.card().subtract(afterNet.card()),
            vatAfter.subtract(vatBefore).max(BigDecimal.ZERO),
            sale.getPaymentMethod()
        );
        shiftRepository.save(shift);
    }

    private static BigDecimal vatAt(Sale sale, BigDecimal returned) {
        BigDecimal tax = sale.getTaxTotal() != null ? sale.getTaxTotal() : BigDecimal.ZERO;
        BigDecimal header = sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
        if (tax.signum() <= 0 || header.signum() <= 0 || returned == null) {
            return BigDecimal.ZERO;
        }
        return tax.multiply(returned).divide(header, 2, java.math.RoundingMode.HALF_UP);
    }
}
