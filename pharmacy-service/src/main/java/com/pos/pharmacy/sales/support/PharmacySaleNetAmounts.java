package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.pharmacy.sales.service.PharmacySalePartialReturnService;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.shared.money.TenderNet;
import com.pos.shared.money.TenderNetCalculator;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class PharmacySaleNetAmounts {

    private PharmacySaleNetAmounts() {}

    public static TenderNet remaining(Sale sale) {
        if (sale == null) {
            return TenderNetCalculator.remaining(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }
        return TenderNetCalculator.remaining(
            sale.getTotalAmount(),
            sale.getCashAmount(),
            sale.getCardAmount(),
            returnedAgainstHeader(sale)
        );
    }

    public static BigDecimal returnedAgainstHeader(Sale sale) {
        BigDecimal lineReturned = PharmacySalePartialReturnService.totalReturnedAmount(sale);
        BigDecimal lineGross = lineGross(sale);
        BigDecimal header = sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
        if (lineGross.signum() <= 0 || header.signum() <= 0) {
            return lineReturned.min(header.max(BigDecimal.ZERO));
        }
        BigDecimal scaled = lineReturned.multiply(header).divide(lineGross, 2, RoundingMode.HALF_UP);
        return scaled.min(header);
    }

    public static BigDecimal returnedVat(Sale sale) {
        BigDecimal tax = sale.getTaxTotal() != null ? sale.getTaxTotal() : BigDecimal.ZERO;
        BigDecimal header = sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
        if (tax.signum() <= 0 || header.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal returned = returnedAgainstHeader(sale);
        return tax.multiply(returned).divide(header, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal lineGross(Sale sale) {
        BigDecimal sum = BigDecimal.ZERO;
        if (sale.getItems() == null) {
            return sum;
        }
        for (SaleItem item : sale.getItems()) {
            BigDecimal qty = QuantityUtil.normalize(item.getQuantity());
            if (qty.signum() <= 0 || item.getLineTotal() == null) {
                continue;
            }
            sum = sum.add(item.getLineTotal());
        }
        return sum;
    }
}
