package com.pos.sales.support;

import com.pos.sales.entity.Sale;
import com.pos.sales.service.sale.impl.SalePartialReturnServiceImpl;
import com.pos.shared.money.TenderNet;
import com.pos.shared.money.TenderNetCalculator;

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
}
