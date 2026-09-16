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
class MixedPaymentStrategy implements SalePaymentStrategy {

    @Override
    public Set<SaleEnums.PaymentMethod> supports() {
        return EnumSet.of(SaleEnums.PaymentMethod.MIXED);
    }

    @Override
    public PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request) {
        if (request.cashAmount() == null) {
            throw PharmacyErrors.badRequest("Укажите сумму наличными для смешанной оплаты");
        }
        BigDecimal cash = scale(request.cashAmount());
        if (cash.signum() < 0) {
            throw PharmacyErrors.badRequest("Суммы оплаты не могут быть отрицательными");
        }
        if (cash.compareTo(total) > 0) {
            cash = total;
        }
        BigDecimal card = scale(total.subtract(cash));
        if (cash.signum() == 0 && card.signum() == 0) {
            throw PharmacyErrors.badRequest("Укажите хотя бы одну сумму оплаты");
        }
        BigDecimal tendered = cash.signum() > 0
            ? scale(request.amountTendered() != null ? request.amountTendered() : cash)
            : BigDecimal.ZERO;
        if (cash.signum() > 0 && tendered.compareTo(cash) < 0) {
            throw PharmacyErrors.badRequest("Получено наличными меньше наличной части");
        }
        BigDecimal change = cash.signum() > 0
            ? tendered.subtract(cash).max(BigDecimal.ZERO)
            : BigDecimal.ZERO;
        return new PaymentAmounts(cash, card, tendered, change);
    }
}
