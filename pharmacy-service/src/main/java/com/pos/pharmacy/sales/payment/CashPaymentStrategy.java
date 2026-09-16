package com.pos.pharmacy.sales.payment;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.support.SalePaymentResolver.PaymentAmounts;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import static com.pos.pharmacy.sales.payment.PaymentAmountScale.scale;

@Component
class CashPaymentStrategy implements SalePaymentStrategy {

    @Override
    public Set<SaleEnums.PaymentMethod> supports() {
        return EnumSet.of(SaleEnums.PaymentMethod.CASH);
    }

    @Override
    public PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request) {
        BigDecimal cash = scale(total);
        BigDecimal tendered = scale(request.amountTendered() != null ? request.amountTendered() : total);
        if (tendered.compareTo(cash) < 0) {
            throw PharmacyErrors.badRequest("Получено наличными меньше суммы оплаты");
        }
        return new PaymentAmounts(
            cash,
            BigDecimal.ZERO,
            tendered,
            tendered.subtract(cash).max(BigDecimal.ZERO)
        );
    }
}
