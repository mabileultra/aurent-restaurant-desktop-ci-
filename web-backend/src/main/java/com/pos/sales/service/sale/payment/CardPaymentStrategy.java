package com.pos.sales.service.sale.payment;

import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.entity.Sale;
import com.pos.sales.service.sale.support.SalePaymentResolver.PaymentAmounts;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import static com.pos.sales.service.sale.payment.PaymentAmountScale.scale;

/**
 * Безналичная оплата на полную сумму. Покрывает CARD, CASHLESS (QR) и MPESA с одинаковой логикой.
 * Для отдельного процессора достаточно добавить новый {@link SalePaymentStrategy}.
 */
@Component
class CardPaymentStrategy implements SalePaymentStrategy {

    @Override
    public Set<Sale.PaymentMethod> supports() {
        return EnumSet.of(Sale.PaymentMethod.CARD, Sale.PaymentMethod.CASHLESS, Sale.PaymentMethod.MPESA);
    }

    @Override
    public PaymentAmounts resolve(BigDecimal total, CreateSaleRequest request) {
        BigDecimal card = scale(total);
        return new PaymentAmounts(BigDecimal.ZERO, card, card, BigDecimal.ZERO);
    }
}
