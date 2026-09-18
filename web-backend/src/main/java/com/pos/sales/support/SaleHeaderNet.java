package com.pos.sales.support;

import com.pos.sales.entity.Sale;
import com.pos.sales.service.sale.impl.SalePartialReturnServiceImpl;
import com.pos.shared.money.TenderNet;
import com.pos.shared.money.TenderNetCalculator;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class SaleHeaderNet {

    private SaleHeaderNet() {}

    public static TenderNet of(Sale sale) {
        if (sale == null) {
            return TenderNetCalculator.remaining(null, null, null, null);
        }
        return TenderNetCalculator.remaining(
            sale.getTotalAmount(),
            sale.getCashAmount(),
            sale.getCardAmount(),
            SalePartialReturnServiceImpl.totalReturnedAmount(sale)
        );
    }

    public static BigDecimal returned(Sale sale) {
        if (sale == null || sale.getItems() == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return SalePartialReturnServiceImpl.totalReturnedAmount(sale);
    }
}
