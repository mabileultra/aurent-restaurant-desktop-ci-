package com.pos.sales.service.sale.payment;

import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.entity.Sale;
import com.pos.exception.PosExceptions;
import com.pos.sales.service.sale.support.SalePaymentResolver.PaymentAmounts;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import static com.pos.sales.service.sale.payment.PaymentAmountScale.scale;

@Component
class CashPaymentStrategy implements SalePaymentStrategy {

    @Override
    public Set<Sale.PaymentMethod> supports() {
        return EnumSet.of(Sale.PaymentMethod.CASH);
    }

    @Override
    public PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request) {
        BigDecimal cash = scale(total);
        BigDecimal tendered = scale(request.amountTendered() != null ? request.amountTendered() : total);
        if (tendered.compareTo(cash) < 0) {
            throw PosExceptions.badRequest("Получено наличными меньше суммы оплаты");
        }
        return new PaymentAmounts(
            cash,
            BigDecimal.ZERO,
            tendered,
            tendered.subtract(cash).max(BigDecimal.ZERO)
        );
    }
}
